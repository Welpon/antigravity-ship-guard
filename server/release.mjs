import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isGitRepo } from './git.mjs';

function runGit(repoDir, args) {
  return execFileSync('git', args, {
    cwd: repoDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 4 * 1024 * 1024,
  }).trimEnd();
}

function resolveGhBinary() {
  const candidates =
    process.platform === 'win32'
      ? ['gh', 'C:\\Program Files\\GitHub CLI\\gh.exe', 'C:\\Program Files (x86)\\GitHub CLI\\gh.exe']
      : ['gh', '/usr/local/bin/gh', '/opt/homebrew/bin/gh'];

  for (const bin of candidates) {
    try {
      if (bin.includes(path.sep) && !fs.existsSync(bin)) continue;
      execFileSync(bin, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return bin;
    } catch {
      // try next
    }
  }
  return null;
}

function readJsonVersion(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return typeof data?.version === 'string' ? data.version : null;
  } catch {
    return null;
  }
}

function writeJsonVersion(filePath, nextVersion) {
  if (!fs.existsSync(filePath)) return false;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (typeof data?.version !== 'string') return false;
  data.version = nextVersion;
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return true;
}

export function computeNextSemver(current, level = 'patch') {
  const match = String(current || '0.0.0').trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  let major = match ? Number(match[1]) : 0;
  let minor = match ? Number(match[2]) : 0;
  let patch = match ? Number(match[3]) : 0;

  if (level === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (level === 'minor') {
    minor += 1;
    patch = 0;
  } else if (level === 'patch') {
    patch += 1;
  } else if (/^\d+\.\d+\.\d+/.test(String(level))) {
    return String(level).replace(/^v/, '');
  }
  return `${major}.${minor}.${patch}`;
}

function formatChangelog(commits) {
  if (!commits.length) return 'Initial release.';
  const feats = [];
  const fixes = [];
  const others = [];
  for (const c of commits) {
    const line = `- ${c.subject} (\`${c.shortHash}\`)`;
    if (/^feat(\(.+\))?:/i.test(c.subject)) feats.push(line);
    else if (/^fix(\(.+\))?:/i.test(c.subject)) fixes.push(line);
    else others.push(line);
  }
  const sections = [];
  if (feats.length) sections.push(`### Features\n${feats.join('\n')}`);
  if (fixes.length) sections.push(`### Fixes\n${fixes.join('\n')}`);
  if (others.length) sections.push(`### Other Changes\n${others.join('\n')}`);
  return sections.join('\n\n');
}

export function getReleaseInfo(repoDir) {
  const resolved = path.resolve(String(repoDir || process.cwd()));
  if (!isGitRepo(resolved)) {
    return {
      isRepo: false,
      repoDir: resolved,
      currentVersion: null,
      latestTag: null,
      suggestedTag: 'v1.0.0',
      tags: [],
      commitsSinceTag: [],
      draftNotes: '',
      remoteUrl: '',
      ghAvailable: Boolean(resolveGhBinary()),
    };
  }

  const pkgVer = readJsonVersion(path.join(resolved, 'package.json'));
  const pluginVer = readJsonVersion(path.join(resolved, 'plugin.json'));
  const currentVersion = pkgVer || pluginVer || '1.0.0';

  let tags = [];
  try {
    const rawTags = runGit(resolved, [
      'tag',
      '--sort=-creatordate',
      '--format=%(refname:short)%x1f%(creatordate:short)%x1f%(subject)',
    ]);
    tags = rawTags
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, 12)
      .map((line) => {
        const [name, date, subject] = line.split('\x1f');
        return { name, date: date || '', subject: subject || '' };
      });
  } catch {
    tags = [];
  }

  const latestTag = tags[0]?.name || null;
  const range = latestTag ? `${latestTag}..HEAD` : 'HEAD';

  let commitsSinceTag = [];
  try {
    const rawLog = runGit(resolved, [
      'log',
      range,
      '-n',
      '25',
      '--pretty=format:%h%x1f%s%x1f%ar',
    ]);
    commitsSinceTag = rawLog
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [shortHash, subject, relativeDate] = line.split('\x1f');
        return { shortHash, subject, relativeDate };
      });
  } catch {
    commitsSinceTag = [];
  }

  let remoteUrl = '';
  try {
    remoteUrl = runGit(resolved, ['remote', 'get-url', 'origin']).trim();
  } catch {
    remoteUrl = '';
  }

  const suggestedTag = `v${currentVersion.replace(/^v/, '')}`;

  return {
    isRepo: true,
    repoDir: resolved,
    currentVersion,
    latestTag,
    suggestedTag,
    tags,
    commitsSinceTag,
    draftNotes: formatChangelog(commitsSinceTag),
    remoteUrl,
    ghAvailable: Boolean(resolveGhBinary()),
  };
}

export function bumpVersion(repoDir, level = 'patch') {
  const resolved = path.resolve(String(repoDir || process.cwd()));
  const pkgPath = path.join(resolved, 'package.json');
  const pluginPath = path.join(resolved, 'plugin.json');
  const current = readJsonVersion(pkgPath) || readJsonVersion(pluginPath);
  if (!current) {
    throw new Error('No package.json or plugin.json with a version field found in this repository.');
  }
  const nextVersion = computeNextSemver(current, level);
  const updatedFiles = [];
  if (writeJsonVersion(pkgPath, nextVersion)) updatedFiles.push('package.json');
  if (writeJsonVersion(pluginPath, nextVersion)) updatedFiles.push('plugin.json');
  return {
    previousVersion: current,
    nextVersion,
    suggestedTag: `v${nextVersion}`,
    updatedFiles,
    release: getReleaseInfo(resolved),
  };
}

function validateTagName(tag) {
  const clean = String(tag || '').trim();
  if (!clean) throw new Error('Tag name cannot be empty.');
  if (!/^[A-Za-z0-9._/-]+$/.test(clean) || clean.includes('..') || clean.startsWith('-')) {
    throw new Error(`Invalid Git tag name: ${clean}`);
  }
  return clean;
}

export function createGitTag(repoDir, tagName, message = '', { push = false } = {}) {
  const resolved = path.resolve(String(repoDir || process.cwd()));
  if (!isGitRepo(resolved)) throw new Error('Not a Git repository.');
  const tag = validateTagName(tagName);
  const msg = String(message || `Release ${tag}`).trim();

  runGit(resolved, ['tag', '-a', tag, '-m', msg]);
  let pushed = false;
  if (push) {
    runGit(resolved, ['push', 'origin', tag]);
    pushed = true;
  }
  return {
    tag,
    message: msg,
    pushed,
    release: getReleaseInfo(resolved),
  };
}

export function createGithubRelease(repoDir, { tag, title, notes, draft = false } = {}) {
  const resolved = path.resolve(String(repoDir || process.cwd()));
  if (!isGitRepo(resolved)) throw new Error('Not a Git repository.');
  const cleanTag = validateTagName(tag);
  const gh = resolveGhBinary();
  if (!gh) {
    throw new Error('GitHub CLI (gh) is not installed or not found on PATH.');
  }

  // Ensure tag exists locally; if not, create it
  let tagExists = false;
  try {
    const existing = runGit(resolved, ['tag', '-l', cleanTag]);
    tagExists = existing.trim() === cleanTag;
  } catch {
    tagExists = false;
  }
  if (!tagExists) {
    runGit(resolved, ['tag', '-a', cleanTag, '-m', title || `Release ${cleanTag}`]);
  }

  // Push tag to origin
  runGit(resolved, ['push', 'origin', cleanTag]);

  const args = [
    'release',
    'create',
    cleanTag,
    '--title',
    String(title || cleanTag).trim(),
    '--notes',
    String(notes || `Release ${cleanTag}`).trim(),
  ];
  if (draft) args.push('--draft');

  const out = execFileSync(gh, args, {
    cwd: resolved,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 4 * 1024 * 1024,
  }).trim();

  return {
    tag: cleanTag,
    title: String(title || cleanTag).trim(),
    draft: Boolean(draft),
    url: out,
    release: getReleaseInfo(resolved),
  };
}
