import fs from 'node:fs';
import path from 'node:path';
import { scanSecrets } from '../server/secrets.mjs';

function readStdin() {
  return new Promise((resolve) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      raw += chunk;
    });
    process.stdin.on('end', () => resolve(raw));
    process.stdin.on('error', () => resolve(raw));
  });
}

function extractRepoDirFromCommand(cmd, fallback) {
  const m =
    cmd.match(/(?:Set-Location|cd)\s+(?:-Path\s+)?["']([^"']+)["']/i) ||
    cmd.match(/(?:Set-Location|cd)\s+([^\s;&|]+)/i);
  if (m && m[1] && fs.existsSync(m[1])) {
    return path.resolve(m[1]);
  }
  return fallback;
}

const raw = await readStdin();
let payload = {};
try {
  payload = JSON.parse(raw || '{}');
} catch {
  console.log(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

const cmd = String(payload?.toolCall?.args?.CommandLine || '');
if (!/\bgit\s+(?:commit|push)\b/i.test(cmd)) {
  console.log(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

const fallbackDir = payload.cwd || (Array.isArray(payload.workspacePaths) ? payload.workspacePaths[0] : '') || process.cwd();
const targetDir = extractRepoDirFromCommand(cmd, fallbackDir);

try {
  const result = scanSecrets(targetDir, { changedOnly: true });
  const total = result.findings.length;
  if (total > 0) {
    const sample = result.findings
      .slice(0, 5)
      .map((f) => `- [${f.severity.toUpperCase()}] ${f.label} in ${f.file}:${f.line} (${f.preview})`)
      .join('\n');
    console.log(
      JSON.stringify({
        decision: 'deny',
        reason: `Ship Guard blocked git commit/push: found ${total} potential secret(s) or personal path(s):\n${sample}\nClean these before committing or pushing.`,
      })
    );
    process.exit(0);
  }
} catch {
  // Never break git on unexpected scanner error
}

console.log(JSON.stringify({ decision: 'allow' }));
