import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  getGitStatus,
  stageAndCommit,
  safeRollback,
  restoreStash,
  getDiffSummary,
  createBackupStash,
} from './git.mjs';
import { scanSecrets } from './secrets.mjs';
import { detectChecks, runQualityCheck } from './quality.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, '..');

const APP_URI = 'ui://ship-guard/app.html';
const APP_MIME = 'text/html;profile=mcp-app';

function parseDataDir(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--data-dir=')) return arg.slice('--data-dir='.length);
    if (arg === '--data-dir' && argv[i + 1]) return argv[i + 1];
  }
  return path.join(PLUGIN_ROOT, 'data');
}

const dataDir = parseDataDir(process.argv.slice(2));
const prefsPath = path.join(dataDir, 'prefs.json');

function readPrefs() {
  try {
    if (fs.existsSync(prefsPath)) {
      const parsed = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
      return {
        lang: parsed?.lang === 'tr' ? 'tr' : 'en',
        repoDir: typeof parsed?.repoDir === 'string' ? parsed.repoDir : '',
        customChecks: Array.isArray(parsed?.customChecks) ? parsed.customChecks : [],
      };
    }
  } catch {
    // default
  }
  return { lang: 'en', repoDir: '', customChecks: [] };
}

function writePrefs(patch = {}) {
  const current = readPrefs();
  const next = {
    ...current,
    ...(patch.lang === 'tr' || patch.lang === 'en' ? { lang: patch.lang } : {}),
    ...(typeof patch.repoDir === 'string' ? { repoDir: patch.repoDir.trim() } : {}),
    ...(Array.isArray(patch.customChecks) ? { customChecks: patch.customChecks } : {}),
  };
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(prefsPath, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

function resolveRepoDir(explicitDir) {
  if (explicitDir && String(explicitDir).trim()) return path.resolve(String(explicitDir).trim());
  const prefs = readPrefs();
  if (prefs.repoDir && fs.existsSync(prefs.repoDir)) return path.resolve(prefs.repoDir);
  return process.cwd();
}

function readAppHtml() {
  const htmlPath = process.env.SHIP_GUARD_APP_HTML || path.join(__dirname, 'app.html');
  if (!fs.existsSync(htmlPath)) {
    return '<!doctype html><html><body><p>Ship Guard UI not built yet. Run <code>npm run build:ui</code>.</p></body></html>';
  }
  return fs.readFileSync(htmlPath, 'utf8');
}

const TOOLS = [
  {
    name: 'open_ship_guard',
    title: 'Ship Guard',
    description:
      'Open the Ship Guard UI panel (Git Flow + Safe Rollback, Secret Guard Scanner, and Quality Gate Test/Build/Lint dashboard).',
    inputSchema: {
      type: 'object',
      properties: {
        repo_dir: { type: 'string', description: 'Optional project directory path.' },
        tab: { type: 'string', enum: ['git', 'secrets', 'quality'], description: 'Optional initial tab.' },
      },
    },
    _meta: {
      ui: { resourceUri: APP_URI },
      'com.google.antigravity/ui': {
        entrypoints: [
          { type: 'aux_pane', title: 'Ship Guard' },
          { type: 'global', title: 'Ship Guard' },
        ],
      },
    },
  },
  {
    name: 'git_status',
    title: 'Git Status',
    description: 'Inspect branch, modified files, recent commits, and backup stashes for a project directory.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_dir: { type: 'string', description: 'Project directory path.' },
      },
    },
    _meta: { ui: { visibility: ['model', 'app'] } },
  },
  {
    name: 'git_checkpoint',
    title: 'Create Backup Checkpoint',
    description: 'Save uncommitted changes into a labeled Ship Guard backup stash.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_dir: { type: 'string' },
        label: { type: 'string' },
      },
    },
    _meta: { ui: { visibility: ['model', 'app'] } },
  },
  {
    name: 'git_commit',
    title: 'Stage & Commit',
    description: 'Stage all changes and create a Git commit after verifying there are no critical secrets.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_dir: { type: 'string' },
        message: { type: 'string', description: 'Commit message.' },
      },
      required: ['message'],
    },
    _meta: { ui: { visibility: ['model', 'app'] } },
  },
  {
    name: 'git_safe_rollback',
    title: 'Safe Rollback (Auto-Backup)',
    description: 'Automatically backs up current uncommitted changes to a Ship Guard stash, then resets cleanly to HEAD or the specified commit hash.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_dir: { type: 'string' },
        target: { type: 'string', description: 'Target commit hash or HEAD.' },
      },
    },
    _meta: { ui: { visibility: ['model', 'app'] } },
  },
  {
    name: 'git_restore_stash',
    title: 'Restore Backup Stash',
    description: 'Apply a Ship Guard backup stash to recover previously saved working changes.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_dir: { type: 'string' },
        stash_ref: { type: 'string', description: 'Stash ref such as stash@{0}.' },
      },
    },
    _meta: { ui: { visibility: ['model', 'app'] } },
  },
  {
    name: 'git_diff_summary',
    title: 'Get Git Diff Summary',
    description: 'Return a compact git diff suitable for drafting commit messages or PR summaries.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_dir: { type: 'string' },
      },
    },
    _meta: { ui: { visibility: ['model', 'app'] } },
  },
  {
    name: 'scan_secrets',
    title: 'Scan Secrets & Personal Paths',
    description: 'Scan a project directory for leaked API keys, tokens, private keys, .env files, and personal OS paths.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_dir: { type: 'string' },
        changed_only: { type: 'boolean', description: 'Scan only git modified/untracked files if true.' },
      },
    },
    _meta: { ui: { visibility: ['model', 'app'] } },
  },
  {
    name: 'detect_quality_checks',
    title: 'Detect Quality Checks',
    description: 'Auto-detect build, test, lint, and typecheck commands in a project directory.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_dir: { type: 'string' },
      },
    },
    _meta: { ui: { visibility: ['model', 'app'] } },
  },
  {
    name: 'run_quality_check',
    title: 'Run Quality Check',
    description: 'Execute a single build, test, or lint command and return pass/fail status, duration, and output.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_dir: { type: 'string' },
        command: { type: 'string', description: 'Shell command to execute.' },
      },
      required: ['command'],
    },
    _meta: { ui: { visibility: ['model', 'app'] } },
  },
  {
    name: 'get_preferences',
    title: 'Get Preferences',
    description: 'Read persisted UI preferences (language, repo directory, custom checks).',
    inputSchema: { type: 'object', properties: {} },
    _meta: { ui: { visibility: ['app'] } },
  },
  {
    name: 'set_preferences',
    title: 'Set Preferences',
    description: 'Persist UI preferences (language, repo directory, custom checks).',
    inputSchema: {
      type: 'object',
      properties: {
        lang: { type: 'string', enum: ['en', 'tr'] },
        repoDir: { type: 'string' },
        customChecks: { type: 'array', items: { type: 'string' } },
      },
    },
    _meta: { ui: { visibility: ['app'] } },
  },
];

const server = new Server(
  { name: 'ship-guard', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: APP_URI,
      name: 'Ship Guard App',
      description: 'Interactive Git Flow, Secret Guard, and Quality Gate UI',
      mimeType: APP_MIME,
      _meta: { ui: { prefersBorder: false } },
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri !== APP_URI) {
    throw new Error(`Unknown resource URI: ${request.params.uri}`);
  }
  return {
    contents: [
      {
        uri: APP_URI,
        mimeType: APP_MIME,
        text: readAppHtml(),
        _meta: { ui: { prefersBorder: false } },
      },
    ],
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    if (name === 'open_ship_guard') {
      const repoDir = resolveRepoDir(args.repo_dir);
      const git = getGitStatus(repoDir);
      const checks = detectChecks(repoDir);
      const prefs = readPrefs();
      const validTabs = new Set(['git', 'secrets', 'quality']);
      return {
        content: [
          {
            type: 'text',
            text: `Ship Guard (${repoDir}) | Branch: ${git.branch || 'N/A'} | Changed files: ${git.files.length} | Detected checks: ${checks.checks.length}`,
          },
        ],
        structuredContent: {
          activeTab: validTabs.has(args.tab) ? args.tab : 'git',
          repoDir,
          git,
          checks: checks.checks,
          prefs,
        },
      };
    }

    if (name === 'git_status') {
      const repoDir = resolveRepoDir(args.repo_dir);
      const git = getGitStatus(repoDir);
      return {
        content: [{ type: 'text', text: `Branch: ${git.branch || 'N/A'} | Changed: ${git.files.length}` }],
        structuredContent: git,
      };
    }

    if (name === 'git_checkpoint') {
      const repoDir = resolveRepoDir(args.repo_dir);
      const res = createBackupStash(repoDir, args.label || 'checkpoint');
      return {
        content: [{ type: 'text', text: res.message }],
        structuredContent: { ...res, git: getGitStatus(repoDir) },
      };
    }

    if (name === 'git_commit') {
      const repoDir = resolveRepoDir(args.repo_dir);
      const scan = scanSecrets(repoDir, { changedOnly: true });
      if (scan.summary.critical > 0 || scan.summary.high > 0) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Commit blocked by Secret Guard: found ${scan.findings.length} potential secret(s). Clean them first.`,
            },
          ],
          structuredContent: { blocked: true, scan },
        };
      }
      const res = stageAndCommit(repoDir, args.message);
      return {
        content: [{ type: 'text', text: res.output }],
        structuredContent: res,
      };
    }

    if (name === 'git_safe_rollback') {
      const repoDir = resolveRepoDir(args.repo_dir);
      const res = safeRollback(repoDir, args.target || 'HEAD');
      return {
        content: [
          {
            type: 'text',
            text: `Rolled back to ${res.target}. ${res.backupCreated ? `Backup stash saved: ${res.backupMessage}` : 'Working tree was clean.'}`,
          },
        ],
        structuredContent: res,
      };
    }

    if (name === 'git_restore_stash') {
      const repoDir = resolveRepoDir(args.repo_dir);
      const res = restoreStash(repoDir, args.stash_ref || 'stash@{0}');
      return {
        content: [{ type: 'text', text: `Restored backup stash ${args.stash_ref || 'stash@{0}'}.` }],
        structuredContent: res,
      };
    }

    if (name === 'git_diff_summary') {
      const repoDir = resolveRepoDir(args.repo_dir);
      const res = getDiffSummary(repoDir);
      return {
        content: [{ type: 'text', text: `${res.stat}\n\n${res.diff}` }],
        structuredContent: res,
      };
    }

    if (name === 'scan_secrets') {
      const repoDir = resolveRepoDir(args.repo_dir);
      const scan = scanSecrets(repoDir, { changedOnly: Boolean(args.changed_only) });
      return {
        content: [
          {
            type: 'text',
            text: `Scanned ${scan.scannedFiles} files: ${scan.findings.length} finding(s) (${scan.summary.critical} critical, ${scan.summary.high} high, ${scan.summary.warning} warning).`,
          },
        ],
        structuredContent: scan,
      };
    }

    if (name === 'detect_quality_checks') {
      const repoDir = resolveRepoDir(args.repo_dir);
      const res = detectChecks(repoDir);
      return {
        content: [{ type: 'text', text: `Detected ${res.checks.length} checks in ${res.repoDir}.` }],
        structuredContent: res,
      };
    }

    if (name === 'run_quality_check') {
      const repoDir = resolveRepoDir(args.repo_dir);
      const res = runQualityCheck(repoDir, args.command);
      return {
        content: [
          {
            type: 'text',
            text: `${res.passed ? 'PASSED' : 'FAILED'} (${res.durationMs}ms): ${res.command}\n${res.output.slice(0, 800)}`,
          },
        ],
        structuredContent: res,
      };
    }

    if (name === 'get_preferences') {
      const prefs = readPrefs();
      return { content: [{ type: 'text', text: JSON.stringify(prefs) }], structuredContent: prefs };
    }

    if (name === 'set_preferences') {
      const prefs = writePrefs(args);
      return { content: [{ type: 'text', text: JSON.stringify(prefs) }], structuredContent: prefs };
    }

    return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: `Error: ${err?.message || String(err)}` }] };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
