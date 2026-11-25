import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '__pycache__',
  '.venv',
  'venv',
  'coverage',
  '.trash',
]);

const SKIP_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
]);

const TEXT_EXTS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.jsonc',
  '.md', '.txt', '.yml', '.yaml', '.toml', '.env', '.ini', '.cfg',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.cs', '.php', '.sh',
  '.ps1', '.bat', '.cmd', '.html', '.css', '.scss', '.sql', '.xml',
]);

const RULES = [
  {
    id: 'private-key',
    severity: 'critical',
    label: 'Private Key',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    id: 'openai-key',
    severity: 'critical',
    label: 'OpenAI API Key',
    regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/,
  },
  {
    id: 'google-api-key',
    severity: 'critical',
    label: 'Google / Gemini API Key',
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/,
  },
  {
    id: 'github-token',
    severity: 'critical',
    label: 'GitHub Token',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  },
  {
    id: 'aws-key',
    severity: 'critical',
    label: 'AWS Access Key',
    regex: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: 'stripe-key',
    severity: 'critical',
    label: 'Stripe Live Key',
    regex: /\bsk_live_[0-9A-Za-z]{20,}\b/,
  },
  {
    id: 'slack-token',
    severity: 'critical',
    label: 'Slack Token',
    regex: /\bxox[baprs]-[0-9A-Za-z-]{16,}\b/,
  },
  {
    id: 'generic-secret',
    severity: 'high',
    label: 'Hardcoded Secret / Password',
    regex: /(?:api[_-]?key|secret[_-]?key|access[_-]?token|password|passwd)\s*[:=]\s*["']([A-Za-z0-9_\-./+=]{12,})["']/i,
    ignore: /your[_-]|example|placeholder|changeme|dummy|test123|xxxx|\*{4}/i,
  },
  {
    id: 'personal-path',
    severity: 'warning',
    label: 'Personal User Path',
    regex: /(?:[A-Za-z]:\\Users\\[A-Za-z0-9._-]+|\/Users\/[A-Za-z0-9._-]+|\/home\/[A-Za-z0-9._-]+)/,
    ignore: /<YOUR_|<USER|<KULLANICI|example|username|yourname/i,
  },
];

function maskValue(raw) {
  const s = String(raw || '');
  if (s.length <= 10) return '****';
  return `${s.slice(0, 4)}****${s.slice(-4)}`;
}

function isScannableFile(filePath) {
  const base = path.basename(filePath);
  if (SKIP_FILES.has(base)) return false;
  if (base.startsWith('.env')) return true;
  const ext = path.extname(base).toLowerCase();
  return TEXT_EXTS.has(ext) || ext === '';
}

function collectFiles(rootDir, acc = [], maxFiles = 600) {
  if (!fs.existsSync(rootDir) || acc.length >= maxFiles) return acc;
  let entries;
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (acc.length >= maxFiles) break;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectFiles(path.join(rootDir, entry.name), acc, maxFiles);
    } else if (entry.isFile()) {
      const full = path.join(rootDir, entry.name);
      if (isScannableFile(full)) acc.push(full);
    }
  }
  return acc;
}

function getChangedGitFiles(repoDir) {
  try {
    const out = execFileSync('git', ['status', '--porcelain=v1'], {
      cwd: repoDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const list = [];
    for (const line of out.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const rel = line.slice(3).trim().replace(/^"|"$/g, '');
      const full = path.join(repoDir, rel);
      if (fs.existsSync(full) && fs.statSync(full).isFile() && isScannableFile(full)) {
        list.push(full);
      }
    }
    return list;
  } catch {
    return null;
  }
}

export function scanSecrets(repoDir, { changedOnly = false } = {}) {
  const resolved = path.resolve(String(repoDir || process.cwd()));
  if (!fs.existsSync(resolved)) {
    return { repoDir: resolved, scannedFiles: 0, findings: [], summary: { critical: 0, high: 0, warning: 0 } };
  }

  let files = changedOnly ? getChangedGitFiles(resolved) : null;
  if (!files) {
    files = collectFiles(resolved);
  }

  const findings = [];
  for (const filePath of files) {
    let stat;
    try {
      stat = fs.statSync(filePath);
      if (stat.size > 512 * 1024) continue; // skip huge files > 512 KiB
    } catch {
      continue;
    }

    const rel = path.relative(resolved, filePath).replace(/\\/g, '/');
    const base = path.basename(filePath);

    // Flag tracked/present .env file (except .env.example / .env.sample)
    if (/^\.env($|\.)/i.test(base) && !/example|sample|template/i.test(base)) {
      findings.push({
        ruleId: 'env-file',
        severity: 'high',
        label: 'Environment File (.env)',
        file: rel,
        line: 1,
        preview: `${base} should be in .gitignore`,
      });
    }

    let raw;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const lines = raw.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line || line.length > 2000) continue;
      for (const rule of RULES) {
        const match = line.match(rule.regex);
        if (!match) continue;
        if (rule.ignore && rule.ignore.test(line)) continue;
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          label: rule.label,
          file: rel,
          line: i + 1,
          preview: maskValue(match[0]),
        });
        if (findings.length >= 100) break;
      }
      if (findings.length >= 100) break;
    }
    if (findings.length >= 100) break;
  }

  const summary = {
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    warning: findings.filter((f) => f.severity === 'warning').length,
  };

  return {
    repoDir: resolved,
    scannedFiles: files.length,
    findings,
    summary,
  };
}
