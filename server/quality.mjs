import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function findJsEntryFiles(repoDir) {
  const candidates = [];
  const dirs = ['', 'server', 'scripts', 'src', 'ui'];
  for (const sub of dirs) {
    const dirPath = sub ? path.join(repoDir, sub) : repoDir;
    if (!fs.existsSync(dirPath)) continue;
    let entries;
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.isFile() && /\.(mjs|cjs|js)$/i.test(e.name)) {
        candidates.push(sub ? `${sub}/${e.name}` : e.name);
      }
    }
  }
  return candidates.slice(0, 12);
}

export function detectChecks(repoDir) {
  const resolved = path.resolve(String(repoDir || process.cwd()));
  const checks = [];
  const seenCommands = new Set();

  const addCheck = (check) => {
    if (!check?.command || seenCommands.has(check.command)) return;
    seenCommands.add(check.command);
    checks.push(check);
  };

  if (!fs.existsSync(resolved)) {
    return { repoDir: resolved, checks };
  }

  // 1. Node.js / package.json scripts
  const pkgPath = path.join(resolved, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const scripts = pkg.scripts || {};
      const preferred = [
        'lint',
        'lint:fix',
        'typecheck',
        'type-check',
        'check',
        'validate',
        'verify',
        'test',
        'test:unit',
        'test:e2e',
        'build',
        'build:ui',
        'format:check',
      ];
      for (const name of preferred) {
        if (scripts[name]) {
          addCheck({
            id: `npm:${name}`,
            name: `npm run ${name}`,
            command: `npm run ${name}`,
            kind: name.includes('test')
              ? 'test'
              : name.includes('lint') || name.includes('type') || name.includes('format')
              ? 'lint'
              : 'build',
          });
        }
      }
    } catch {
      // ignore invalid package.json
    }

    // TypeScript check if tsconfig.json exists
    if (fs.existsSync(path.join(resolved, 'tsconfig.json'))) {
      addCheck({
        id: 'ts:noemit',
        name: 'TypeScript Check (tsc --noEmit)',
        command: 'npx tsc --noEmit',
        kind: 'lint',
      });
    }

    // Node.js syntax check for JS/MJS files
    const jsFiles = findJsEntryFiles(resolved);
    if (jsFiles.length > 0) {
      const fileListSingle = `[${jsFiles.map((f) => `'${f.replace(/'/g, "\\'")}'`).join(',')}]`;
      addCheck({
        id: 'node:syntax',
        name: `Node Syntax Check (${jsFiles.length} files)`,
        command: `node -e "const {execFileSync}=require('child_process');for(const f of ${fileListSingle}){execFileSync(process.execPath,['--check',f],{stdio:'inherit'})};console.log('All ${jsFiles.length} JS/MJS files passed syntax check.')"`,
        kind: 'syntax',
      });
    }

    // Security audit if package-lock.json exists
    if (fs.existsSync(path.join(resolved, 'package-lock.json'))) {
      addCheck({
        id: 'npm:audit',
        name: 'npm audit (high+)',
        command: 'npm audit --audit-level=high',
        kind: 'security',
      });
    }
  }

  // 2. Python checks
  if (
    fs.existsSync(path.join(resolved, 'pyproject.toml')) ||
    fs.existsSync(path.join(resolved, 'pytest.ini')) ||
    fs.existsSync(path.join(resolved, 'requirements.txt'))
  ) {
    addCheck({ id: 'py:pytest', name: 'pytest', command: 'pytest', kind: 'test' });
    addCheck({ id: 'py:ruff', name: 'ruff check', command: 'ruff check .', kind: 'lint' });
    addCheck({ id: 'py:mypy', name: 'mypy', command: 'mypy .', kind: 'lint' });
  }

  // 3. Rust checks
  if (fs.existsSync(path.join(resolved, 'Cargo.toml'))) {
    addCheck({ id: 'rs:check', name: 'cargo check', command: 'cargo check', kind: 'build' });
    addCheck({ id: 'rs:test', name: 'cargo test', command: 'cargo test', kind: 'test' });
    addCheck({ id: 'rs:clippy', name: 'cargo clippy', command: 'cargo clippy', kind: 'lint' });
  }

  // 4. Go checks
  if (fs.existsSync(path.join(resolved, 'go.mod'))) {
    addCheck({ id: 'go:test', name: 'go test', command: 'go test ./...', kind: 'test' });
    addCheck({ id: 'go:vet', name: 'go vet', command: 'go vet ./...', kind: 'lint' });
  }

  // 5. Git diff whitespace / conflict marker check (for any Git repo)
  if (fs.existsSync(path.join(resolved, '.git'))) {
    addCheck({
      id: 'git:diff-check',
      name: 'Git Conflict & Whitespace Check',
      command: 'git diff --check',
      kind: 'lint',
    });
  }

  return { repoDir: resolved, checks };
}

export function runQualityCheck(repoDir, command, timeoutMs = 45000) {
  const resolved = path.resolve(String(repoDir || process.cwd()));
  const cmd = String(command || '').trim();
  if (!cmd) throw new Error('Command cannot be empty.');

  const startedAt = Date.now();
  try {
    const stdout = execSync(cmd, {
      cwd: resolved,
      encoding: 'utf8',
      timeout: timeoutMs,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 4 * 1024 * 1024,
    });
    const output = String(stdout || '').trim();
    return {
      command: cmd,
      passed: true,
      exitCode: 0,
      durationMs: Date.now() - startedAt,
      output: output.length > 6000 ? `${output.slice(-6000)}` : output,
    };
  } catch (err) {
    const out = [err.stdout, err.stderr, err.message]
      .filter(Boolean)
      .map((x) => String(x))
      .join('\n')
      .trim();
    return {
      command: cmd,
      passed: false,
      exitCode: typeof err.status === 'number' ? err.status : 1,
      durationMs: Date.now() - startedAt,
      output: out.length > 6000 ? `${out.slice(-6000)}` : out,
    };
  }
}
