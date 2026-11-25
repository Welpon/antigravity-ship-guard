import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function runGit(repoDir, args) {
  return execFileSync('git', args, {
    cwd: repoDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 4 * 1024 * 1024,
  }).trimEnd();
}

export function isGitRepo(dir) {
  if (!dir || !fs.existsSync(dir)) return false;
  try {
    const out = runGit(dir, ['rev-parse', '--is-inside-work-tree']);
    return out.trim() === 'true';
  } catch {
    return false;
  }
}

export function getGitStatus(repoDir) {
  if (!isGitRepo(repoDir)) {
    return {
      isRepo: false,
      repoDir: repoDir || '',
      branch: '',
      files: [],
      commits: [],
      stashes: [],
    };
  }

  let branch = 'HEAD';
  try {
    branch = runGit(repoDir, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  } catch {
    // empty repo
  }

  let files = [];
  try {
    const rawStatus = runGit(repoDir, ['status', '--porcelain=v1']);
    files = rawStatus
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => ({
        status: line.slice(0, 2).trim() || 'M',
        path: line.slice(3).trim().replace(/^"|"$/g, ''),
      }));
  } catch {
    files = [];
  }

  let commits = [];
  try {
    const rawLog = runGit(repoDir, [
      'log',
      '-n',
      '12',
      '--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ar',
    ]);
    commits = rawLog
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [hash, shortHash, subject, author, relativeDate] = line.split('\x1f');
        return { hash, shortHash, subject, author, relativeDate };
      });
  } catch {
    commits = [];
  }

  let stashes = [];
  try {
    const rawStash = runGit(repoDir, ['stash', 'list', '--pretty=format:%gd%x1f%gs%x1f%ar']);
    stashes = rawStash
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, 10)
      .map((line) => {
        const [ref, message, relativeDate] = line.split('\x1f');
        return { ref, message, relativeDate };
      });
  } catch {
    stashes = [];
  }

  return {
    isRepo: true,
    repoDir: path.resolve(repoDir),
    branch,
    files,
    commits,
    stashes,
  };
}

export function createBackupStash(repoDir, label = 'checkpoint') {
  const status = getGitStatus(repoDir);
  if (!status.isRepo) throw new Error('Not a Git repository.');
  if (status.files.length === 0) {
    return { created: false, message: 'Working tree is clean; no backup stash needed.' };
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const msg = `ship-guard-${label}-${stamp}`;
  runGit(repoDir, ['stash', 'push', '-u', '-m', msg]);
  return { created: true, message: msg };
}

export function stageAndCommit(repoDir, commitMessage) {
  const msg = String(commitMessage || '').trim();
  if (!msg) throw new Error('Commit message cannot be empty.');
  if (!isGitRepo(repoDir)) throw new Error('Not a Git repository.');
  runGit(repoDir, ['add', '-A']);
  const out = runGit(repoDir, ['commit', '-m', msg]);
  return { output: out, status: getGitStatus(repoDir) };
}

export function safeRollback(repoDir, targetHash = 'HEAD') {
  if (!isGitRepo(repoDir)) throw new Error('Not a Git repository.');
  const backup = createBackupStash(repoDir, 'pre-rollback');
  if (targetHash && targetHash !== 'HEAD') {
    runGit(repoDir, ['reset', '--hard', targetHash]);
  }
  return {
    backupCreated: backup.created,
    backupMessage: backup.message,
    target: targetHash || 'HEAD',
    status: getGitStatus(repoDir),
  };
}

export function restoreStash(repoDir, stashRef = 'stash@{0}') {
  if (!isGitRepo(repoDir)) throw new Error('Not a Git repository.');
  const out = runGit(repoDir, ['stash', 'apply', stashRef]);
  return { output: out, status: getGitStatus(repoDir) };
}

export function getDiffSummary(repoDir) {
  if (!isGitRepo(repoDir)) throw new Error('Not a Git repository.');
  let stat = '';
  let diff = '';
  try {
    stat = runGit(repoDir, ['diff', '--stat']);
    diff = runGit(repoDir, ['diff', '--unified=2']);
    if (!diff) {
      stat = runGit(repoDir, ['diff', '--cached', '--stat']);
      diff = runGit(repoDir, ['diff', '--cached', '--unified=2']);
    }
  } catch {
    // ignore
  }
  const truncated = diff.length > 6000;
  return {
    stat,
    diff: truncated ? `${diff.slice(0, 6000)}\n... (truncated)` : diff,
    truncated,
  };
}
