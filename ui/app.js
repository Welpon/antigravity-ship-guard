import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
} from '@modelcontextprotocol/ext-apps';

const I18N = {
  en: {
    appName: 'Ship Guard',
    tabGit: 'Git Flow',
    tabSecrets: 'Secrets',
    tabQuality: 'Quality',
    refresh: 'Refresh',
    repoPlaceholder: 'Project directory path...',
    loadRepo: 'Load',
    notGitRepo: 'This directory is not a Git repository.',
    branch: 'Branch',
    changedFiles: 'Changed Files',
    workingTreeClean: 'Working tree is clean.',
    commitPlaceholder: 'Commit message (e.g. feat: add login flow)...',
    commitBtn: 'Stage & Commit',
    aiCommitBtn: 'AI Commit / PR Msg',
    checkpointBtn: 'Checkpoint',
    rollbackHeadBtn: 'Safe Rollback to HEAD',
    recentCommits: 'Recent Commits',
    noCommits: 'No commits yet.',
    rollbackBtn: 'Rollback',
    confirmRollback: 'Auto-backup current changes and reset to',
    confirmYes: 'Confirm',
    confirmCancel: 'Cancel',
    backupStashes: 'Backup Stashes',
    noStashes: 'No backup stashes yet.',
    restoreBtn: 'Restore',
    hookBannerTitle: 'PreToolUse Hook Active',
    hookBannerDesc: 'Automatically blocks git commit / git push if secrets or personal paths are found.',
    scanChangedBtn: 'Scan Changed',
    scanFullBtn: 'Full Project Scan',
    scanning: 'Scanning...',
    critical: 'Critical',
    high: 'High',
    warning: 'Warning',
    cleanSecretsBtn: 'Clean with AI',
    noFindings: 'No secrets or personal paths detected.',
    notScannedYet: 'Run a scan to inspect your project for leaked keys, .env files, or personal paths.',
    scannedFiles: 'Scanned files',
    runAllBtn: 'Run All Checks',
    running: 'Running...',
    detectedChecks: 'Quality Checks',
    noChecks: 'No checks auto-detected. Add a custom command below.',
    runBtn: 'Run',
    fixWithAi: 'Fix with AI',
    customPlaceholder: 'Custom command (e.g. npm run lint)...',
    addBtn: 'Add',
    removeBtn: 'Remove',
    quickPresets: 'Quick Add Presets',
    passed: 'PASSED',
    failed: 'FAILED',
    idle: 'IDLE',
    sentToChat: 'Sent prompt to chat.',
    chatUnavailable: 'Host does not support sending messages to chat.',
    commitRequired: 'Enter a commit message first.',
    loading: 'Loading...',
  },
  tr: {
    appName: 'Ship Guard',
    tabGit: 'Git Akışı',
    tabSecrets: 'Gizli Bilgi',
    tabQuality: 'Kalite',
    refresh: 'Yenile',
    repoPlaceholder: 'Proje klasör yolu...',
    loadRepo: 'Yükle',
    notGitRepo: 'Bu klasör bir Git deposu değil.',
    branch: 'Dal',
    changedFiles: 'Değişen Dosyalar',
    workingTreeClean: 'Çalışma dizini temiz.',
    commitPlaceholder: 'Commit mesajı (örn. feat: giriş ekranı eklendi)...',
    commitBtn: 'Kaydet (Commit)',
    aiCommitBtn: 'AI Commit / PR Yaz',
    checkpointBtn: 'Yedek Al',
    rollbackHeadBtn: 'HEAD Noktasına Güvenli Dön',
    recentCommits: 'Son Commitler',
    noCommits: 'Henüz commit yok.',
    rollbackBtn: 'Geri Dön',
    confirmRollback: 'Mevcut değişiklikler otomatik yedeklenip şu noktaya dönülecek:',
    confirmYes: 'Onayla',
    confirmCancel: 'İptal',
    backupStashes: 'Yedek Noktaları (Stash)',
    noStashes: 'Henüz yedek noktası yok.',
    restoreBtn: 'Geri Yükle',
    hookBannerTitle: 'PreToolUse Koruması Aktif',
    hookBannerDesc: 'git commit / git push öncesinde sızıntı veya kişisel yol tespit edilirse otomatik engeller.',
    scanChangedBtn: 'Değişenleri Tara',
    scanFullBtn: 'Tüm Projeyi Tara',
    scanning: 'Taranıyor...',
    critical: 'Kritik',
    high: 'Yüksek',
    warning: 'Uyarı',
    cleanSecretsBtn: 'AI ile Temizle',
    noFindings: 'Gizli anahtar veya kişisel yol bulunmadı.',
    notScannedYet: 'Projedeki API anahtarları, .env dosyaları veya kişisel yolları kontrol etmek için tarama başlatın.',
    scannedFiles: 'Taranan dosya',
    runAllBtn: 'Tümünü Çalıştır',
    running: 'Çalışıyor...',
    detectedChecks: 'Kalite Kontrolleri',
    noChecks: 'Otomatik kontrol bulunamadı. Aşağıdan özel komut ekleyebilirsiniz.',
    runBtn: 'Çalıştır',
    fixWithAi: 'AI ile Düzelt',
    customPlaceholder: 'Özel komut (örn. npm run lint)...',
    addBtn: 'Ekle',
    removeBtn: 'Sil',
    quickPresets: 'Hızlı Hazır Komutlar',
    passed: 'GEÇTİ',
    failed: 'HATA',
    idle: 'HAZIR',
    sentToChat: 'İstek sohbete gönderildi.',
    chatUnavailable: 'Bu ortam sohbete doğrudan mesaj göndermeyi desteklemiyor.',
    commitRequired: 'Önce bir commit mesajı girin.',
    loading: 'Yükleniyor...',
  },
};

const QUALITY_PRESETS = [
  { label: 'npm test', cmd: 'npm test' },
  { label: 'npm run build', cmd: 'npm run build' },
  { label: 'npm run lint', cmd: 'npm run lint' },
  { label: 'tsc --noEmit', cmd: 'npx tsc --noEmit' },
  { label: 'npm audit', cmd: 'npm audit --audit-level=high' },
  { label: 'git diff --check', cmd: 'git diff --check' },
  { label: 'pytest', cmd: 'pytest' },
  { label: 'ruff check', cmd: 'ruff check .' },
];

const state = {
  lang: 'en',
  activeTab: 'git',
  repoDir: '',
  repoInput: '',
  git: null,
  scan: null,
  checks: [],
  customChecks: [],
  checkResults: {},
  commitMsg: '',
  customCmdInput: '',
  pendingRollback: null,
  busy: false,
  busyCheck: null,
  toast: null,
  canSendMessage: false,
};

function t(key) {
  return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(text, isError = false) {
  state.toast = { text, isError };
  render();
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    state.toast = null;
    render();
  }, 5000);
}

const app = new App({ name: 'Ship Guard', version: '1.0.0' });

function applyThemeFromContext(ctx) {
  if (!ctx) return;
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
}

app.onhostcontextchanged = (ctx) => {
  applyThemeFromContext(ctx);
};

app.ontoolinput = (params) => {
  const args = params?.arguments || {};
  if (args.tab && ['git', 'secrets', 'quality'].includes(args.tab)) {
    state.activeTab = args.tab;
  }
  if (args.repo_dir) {
    state.repoDir = args.repo_dir;
    state.repoInput = args.repo_dir;
  }
  render();
};

app.ontoolresult = (result) => {
  const sc = result?.structuredContent;
  if (!sc) return;
  if (sc.activeTab && ['git', 'secrets', 'quality'].includes(sc.activeTab)) {
    state.activeTab = sc.activeTab;
  }
  if (sc.prefs) {
    if (sc.prefs.lang === 'en' || sc.prefs.lang === 'tr') state.lang = sc.prefs.lang;
    if (Array.isArray(sc.prefs.customChecks)) state.customChecks = sc.prefs.customChecks;
  }
  if (sc.repoDir) {
    state.repoDir = sc.repoDir;
    state.repoInput = sc.repoDir;
  }
  if (sc.git) state.git = sc.git;
  if (Array.isArray(sc.checks)) state.checks = sc.checks;
  render();
};

async function callTool(name, args = {}) {
  const res = await app.callServerTool({ name, arguments: args });
  if (res?.isError) {
    const msg = res?.content?.[0]?.text || 'Tool call failed';
    const err = new Error(msg);
    err.structuredContent = res?.structuredContent;
    throw err;
  }
  return res;
}

async function refreshAll(explicitDir) {
  state.busy = true;
  render();
  try {
    const dir = explicitDir ?? state.repoDir;
    const res = await callTool('open_ship_guard', dir ? { repo_dir: dir, tab: state.activeTab } : { tab: state.activeTab });
    const sc = res?.structuredContent;
    if (sc) {
      if (sc.prefs) {
        if (sc.prefs.lang === 'en' || sc.prefs.lang === 'tr') state.lang = sc.prefs.lang;
        if (Array.isArray(sc.prefs.customChecks)) state.customChecks = sc.prefs.customChecks;
      }
      state.repoDir = sc.repoDir || dir || '';
      state.repoInput = state.repoDir;
      state.git = sc.git || null;
      state.checks = Array.isArray(sc.checks) ? sc.checks : [];
    }
  } catch (err) {
    showToast(err.message, true);
  } finally {
    state.busy = false;
    render();
  }
}

async function sendPromptToChat(text) {
  if (!state.canSendMessage) {
    showToast(t('chatUnavailable'), true);
    return;
  }
  try {
    await app.sendMessage({
      role: 'user',
      content: [{ type: 'text', text }],
    });
    showToast(t('sentToChat'));
  } catch (err) {
    showToast(err.message || t('chatUnavailable'), true);
  }
}

async function toggleLanguage() {
  const next = state.lang === 'en' ? 'tr' : 'en';
  state.lang = next;
  render();
  try {
    await callTool('set_preferences', { lang: next });
  } catch {
    // non-fatal
  }
}

async function loadRepoFromInput() {
  const nextDir = state.repoInput.trim();
  if (!nextDir) return;
  try {
    await callTool('set_preferences', { repoDir: nextDir });
  } catch {
    // ignore
  }
  state.scan = null;
  state.checkResults = {};
  state.pendingRollback = null;
  await refreshAll(nextDir);
}

async function handleCheckpoint() {
  state.busy = true;
  render();
  try {
    const res = await callTool('git_checkpoint', { repo_dir: state.repoDir, label: 'checkpoint' });
    if (res?.structuredContent?.git) state.git = res.structuredContent.git;
    showToast(res?.content?.[0]?.text || 'Checkpoint created.');
  } catch (err) {
    showToast(err.message, true);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleCommit() {
  const msg = state.commitMsg.trim();
  if (!msg) {
    showToast(t('commitRequired'), true);
    return;
  }
  state.busy = true;
  render();
  try {
    const res = await callTool('git_commit', { repo_dir: state.repoDir, message: msg });
    state.commitMsg = '';
    if (res?.structuredContent?.status) state.git = res.structuredContent.status;
    showToast(res?.content?.[0]?.text || 'Committed.');
  } catch (err) {
    if (err.structuredContent?.scan) {
      state.scan = err.structuredContent.scan;
      state.activeTab = 'secrets';
    }
    showToast(err.message, true);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleAiCommitMessage() {
  state.busy = true;
  render();
  try {
    const res = await callTool('git_diff_summary', { repo_dir: state.repoDir });
    const diff = res?.structuredContent?.diff || '';
    const stat = res?.structuredContent?.stat || '';
    const prompt =
      state.lang === 'tr'
        ? `Şu Git değişiklikleri için kısa, anlamlı bir Conventional Commit mesajı ve 3 maddelik PR özeti yaz (repo: ${state.repoDir}):\n\n${stat}\n\n${diff || '(Henüz diff yok, çalışma dizini temiz olabilir.)'}`
        : `Draft a concise Conventional Commit message and a 3-bullet PR summary for these Git changes (repo: ${state.repoDir}):\n\n${stat}\n\n${diff || '(No diff available.)'}`;
    await sendPromptToChat(prompt);
  } catch (err) {
    showToast(err.message, true);
  } finally {
    state.busy = false;
    render();
  }
}

async function confirmRollback(target) {
  state.busy = true;
  state.pendingRollback = null;
  render();
  try {
    const res = await callTool('git_safe_rollback', { repo_dir: state.repoDir, target });
    if (res?.structuredContent?.status) state.git = res.structuredContent.status;
    showToast(res?.content?.[0]?.text || 'Rolled back safely.');
  } catch (err) {
    showToast(err.message, true);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleRestoreStash(stashRef) {
  state.busy = true;
  render();
  try {
    const res = await callTool('git_restore_stash', { repo_dir: state.repoDir, stash_ref: stashRef });
    if (res?.structuredContent?.status) state.git = res.structuredContent.status;
    showToast(res?.content?.[0]?.text || 'Stash restored.');
  } catch (err) {
    showToast(err.message, true);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleScanSecrets(changedOnly) {
  state.busy = true;
  render();
  try {
    const res = await callTool('scan_secrets', { repo_dir: state.repoDir, changed_only: changedOnly });
    state.scan = res?.structuredContent || null;
  } catch (err) {
    showToast(err.message, true);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleCleanSecretsWithAi() {
  if (!state.scan?.findings?.length) return;
  const lines = state.scan.findings
    .slice(0, 20)
    .map((f) => `- [${f.severity.toUpperCase()}] ${f.file}:${f.line} — ${f.label} (${f.preview})`)
    .join('\n');
  const prompt =
    state.lang === 'tr'
      ? `Ship Guard şu projede (${state.repoDir}) gizli bilgi veya kişisel yol buldu. Lütfen bunları güvenli hale getir (env değişkeni veya yer tutucu kullan, gerekirse .gitignore güncelle):\n\n${lines}`
      : `Ship Guard found potential secrets or personal paths in ${state.repoDir}. Please clean them up safely (replace with env vars or placeholders and update .gitignore if needed):\n\n${lines}`;
  await sendPromptToChat(prompt);
}

function getAllChecks() {
  const custom = (state.customChecks || []).map((cmd, idx) => ({
    id: `custom:${idx}`,
    name: cmd,
    command: cmd,
    kind: 'custom',
    isCustom: true,
  }));
  return [...(state.checks || []), ...custom];
}

async function runSingleCheck(command) {
  state.busyCheck = command;
  render();
  try {
    const res = await callTool('run_quality_check', { repo_dir: state.repoDir, command });
    if (res?.structuredContent) {
      state.checkResults[command] = res.structuredContent;
    }
  } catch (err) {
    state.checkResults[command] = {
      command,
      passed: false,
      exitCode: 1,
      durationMs: 0,
      output: err.message,
    };
  } finally {
    state.busyCheck = null;
    render();
  }
}

async function runAllChecks() {
  const all = getAllChecks();
  for (const c of all) {
    await runSingleCheck(c.command);
  }
}

async function addCustomCheck(explicitCmd) {
  const cmd = String(explicitCmd ?? state.customCmdInput).trim();
  if (!cmd) return;
  if (!state.customChecks.includes(cmd)) {
    state.customChecks = [...state.customChecks, cmd];
    if (!explicitCmd) state.customCmdInput = '';
    render();
    try {
      await callTool('set_preferences', { customChecks: state.customChecks });
    } catch {
      // non-fatal
    }
  }
}

async function removeCustomCheck(cmd) {
  state.customChecks = state.customChecks.filter((c) => c !== cmd);
  delete state.checkResults[cmd];
  render();
  try {
    await callTool('set_preferences', { customChecks: state.customChecks });
  } catch {
    // non-fatal
  }
}

async function handleFixCheckWithAi(command) {
  const res = state.checkResults[command];
  if (!res) return;
  const prompt =
    state.lang === 'tr'
      ? `Ship Guard Quality Gate şu komutta hata aldı (${state.repoDir}):\nKomut: \`${command}\`\nÇıkış kodu: ${res.exitCode}\n\nÇıktı:\n\`\`\`\n${(res.output || '').slice(0, 3000)}\n\`\`\`\nLütfen hatanın kök nedenini bulup düzelt ve komutu tekrar doğrula.`
      : `Ship Guard Quality Gate failed in ${state.repoDir}:\nCommand: \`${command}\`\nExit code: ${res.exitCode}\n\nOutput:\n\`\`\`\n${(res.output || '').slice(0, 3000)}\n\`\`\`\nPlease diagnose and fix the root cause, then re-verify the command.`;
  await sendPromptToChat(prompt);
}

function renderGitTab() {
  const git = state.git;
  if (!git || !git.isRepo) {
    return `<div class="card"><div class="empty">${esc(t('notGitRepo'))}</div></div>`;
  }

  const filesHtml =
    git.files.length === 0
      ? `<div class="empty">${esc(t('workingTreeClean'))}</div>`
      : `<div class="list">${git.files
          .slice(0, 30)
          .map(
            (f) => `
          <div class="list-item">
            <span class="badge badge-warn mono">${esc(f.status)}</span>
            <span class="mono truncate" style="flex:1" title="${esc(f.path)}">${esc(f.path)}</span>
          </div>`
          )
          .join('')}</div>`;

  const confirmHtml = state.pendingRollback
    ? `
      <div class="confirm-bar">
        <span>${esc(t('confirmRollback'))} <strong class="mono">${esc(state.pendingRollback)}</strong></span>
        <div class="row">
          <button class="btn btn-sm btn-danger" data-action="confirm-rollback">${esc(t('confirmYes'))}</button>
          <button class="btn btn-sm" data-action="cancel-rollback">${esc(t('confirmCancel'))}</button>
        </div>
      </div>`
    : '';

  const commitsHtml =
    git.commits.length === 0
      ? `<div class="empty">${esc(t('noCommits'))}</div>`
      : `<div class="list">${git.commits
          .map(
            (c) => `
          <div class="list-item">
            <div class="list-item-col">
              <div class="row">
                <span class="badge badge-accent mono">${esc(c.shortHash)}</span>
                <span class="truncate" style="flex:1" title="${esc(c.subject)}">${esc(c.subject)}</span>
              </div>
              <span class="muted">${esc(c.author)} · ${esc(c.relativeDate)}</span>
            </div>
            <button class="btn btn-sm btn-danger" data-action="ask-rollback" data-target="${esc(c.hash)}" ${state.busy ? 'disabled' : ''}>↩ ${esc(t('rollbackBtn'))}</button>
          </div>`
          )
          .join('')}</div>`;

  const stashesHtml =
    git.stashes.length === 0
      ? `<div class="empty">${esc(t('noStashes'))}</div>`
      : `<div class="list">${git.stashes
          .map(
            (s) => `
          <div class="list-item">
            <div class="list-item-col">
              <span class="mono truncate" title="${esc(s.message)}">${esc(s.message)}</span>
              <span class="muted">${esc(s.ref)} · ${esc(s.relativeDate)}</span>
            </div>
            <button class="btn btn-sm btn-ok" data-action="restore-stash" data-ref="${esc(s.ref)}" ${state.busy ? 'disabled' : ''}>${esc(t('restoreBtn'))}</button>
          </div>`
          )
          .join('')}</div>`;

  return `
    <div class="card">
      <div class="card-header">
        <div class="row">
          <span class="card-title">${esc(t('branch'))}</span>
          <span class="badge badge-accent mono">${esc(git.branch || 'HEAD')}</span>
          <span class="badge">${git.files.length} ${esc(t('changedFiles'))}</span>
        </div>
        <div class="row">
          <button class="btn btn-sm" data-action="checkpoint" ${state.busy ? 'disabled' : ''}>💾 ${esc(t('checkpointBtn'))}</button>
          <button class="btn btn-sm btn-danger" data-action="ask-rollback" data-target="HEAD" ${state.busy ? 'disabled' : ''}>↩ ${esc(t('rollbackHeadBtn'))}</button>
        </div>
      </div>
      ${confirmHtml}
      <div class="row">
        <input class="input" id="commitMsgInput" placeholder="${esc(t('commitPlaceholder'))}" value="${esc(state.commitMsg)}" />
      </div>
      <div class="row">
        <button class="btn btn-primary" data-action="commit" ${state.busy ? 'disabled' : ''}>✓ ${esc(t('commitBtn'))}</button>
        ${
          state.canSendMessage
            ? `<button class="btn" data-action="ai-commit" ${state.busy ? 'disabled' : ''}>✨ ${esc(t('aiCommitBtn'))}</button>`
            : ''
        }
      </div>
      ${filesHtml}
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">${esc(t('recentCommits'))}</span></div>
      ${commitsHtml}
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">${esc(t('backupStashes'))}</span></div>
      ${stashesHtml}
    </div>
  `;
}

function renderSecretsTab() {
  const scan = state.scan;
  const sevClass = (s) => (s === 'critical' ? 'badge-danger' : s === 'high' ? 'badge-warn' : 'badge-accent');

  const resultsHtml = !scan
    ? `<div class="empty">${esc(t('notScannedYet'))}</div>`
    : `
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-val" style="color:var(--danger)">${scan.summary.critical}</div><div class="stat-lbl">${esc(t('critical'))}</div></div>
        <div class="stat-box"><div class="stat-val" style="color:var(--warn)">${scan.summary.high}</div><div class="stat-lbl">${esc(t('high'))}</div></div>
        <div class="stat-box"><div class="stat-val" style="color:var(--accent)">${scan.summary.warning}</div><div class="stat-lbl">${esc(t('warning'))}</div></div>
      </div>
      <div class="row-between">
        <span class="muted">${esc(t('scannedFiles'))}: ${scan.scannedFiles}</span>
        ${
          scan.findings.length > 0 && state.canSendMessage
            ? `<button class="btn btn-sm btn-primary" data-action="clean-secrets-ai">🧹 ${esc(t('cleanSecretsBtn'))}</button>`
            : ''
        }
      </div>
      ${
        scan.findings.length === 0
          ? `<div class="empty" style="color:var(--ok)">✓ ${esc(t('noFindings'))}</div>`
          : `<div class="list">${scan.findings
              .map(
                (f) => `
              <div class="list-item">
                <div class="list-item-col">
                  <div class="row">
                    <span class="badge ${sevClass(f.severity)}">${esc(f.severity.toUpperCase())}</span>
                    <strong>${esc(f.label)}</strong>
                  </div>
                  <span class="mono muted truncate" title="${esc(f.file)}:${f.line}">${esc(f.file)}:${f.line} · ${esc(f.preview)}</span>
                </div>
              </div>`
              )
              .join('')}</div>`
      }
    `;

  return `
    <div class="card">
      <div class="row-between">
        <div class="list-item-col">
          <div class="row">
            <span class="badge badge-ok">🛡️ ${esc(t('hookBannerTitle'))}</span>
          </div>
          <span class="muted">${esc(t('hookBannerDesc'))}</span>
        </div>
      </div>
      <div class="row">
        <button class="btn btn-primary" data-action="scan-changed" ${state.busy ? 'disabled' : ''}>${state.busy ? esc(t('scanning')) : esc(t('scanChangedBtn'))}</button>
        <button class="btn" data-action="scan-full" ${state.busy ? 'disabled' : ''}>${esc(t('scanFullBtn'))}</button>
      </div>
    </div>

    <div class="card">
      ${resultsHtml}
    </div>
  `;
}

function renderQualityTab() {
  const allChecks = getAllChecks();
  const listHtml =
    allChecks.length === 0
      ? `<div class="empty">${esc(t('noChecks'))}</div>`
      : `<div class="list">${allChecks
          .map((c) => {
            const res = state.checkResults[c.command];
            const isRunning = state.busyCheck === c.command;
            const badge = isRunning
              ? `<span class="badge badge-accent">${esc(t('running'))}</span>`
              : !res
              ? `<span class="badge">${esc(t('idle'))}</span>`
              : res.passed
              ? `<span class="badge badge-ok">✓ ${esc(t('passed'))} (${res.durationMs}ms)</span>`
              : `<span class="badge badge-danger">✕ ${esc(t('failed'))} (${res.durationMs}ms)</span>`;

            return `
            <div class="card" style="padding:8px 9px;gap:6px">
              <div class="row-between">
                <div class="list-item-col">
                  <div class="row">
                    <span class="badge">${esc((c.kind || 'custom').toUpperCase())}</span>
                    <span class="mono" style="font-weight:600">${esc(c.name)}</span>
                    ${badge}
                  </div>
                </div>
                <div class="row">
                  <button class="btn btn-sm btn-primary" data-action="run-check" data-cmd="${esc(c.command)}" ${state.busyCheck ? 'disabled' : ''}>▶ ${esc(t('runBtn'))}</button>
                  ${
                    res && !res.passed && state.canSendMessage
                      ? `<button class="btn btn-sm btn-danger" data-action="fix-check-ai" data-cmd="${esc(c.command)}">🔧 ${esc(t('fixWithAi'))}</button>`
                      : ''
                  }
                  ${
                    c.isCustom
                      ? `<button class="btn btn-sm" data-action="remove-custom" data-cmd="${esc(c.command)}" title="${esc(t('removeBtn'))}">✕</button>`
                      : ''
                  }
                </div>
              </div>
              ${res && res.output ? `<pre class="code-output">${esc(res.output)}</pre>` : ''}
            </div>`;
          })
          .join('')}</div>`;

  const existingCmds = new Set(allChecks.map((c) => c.command));
  const availablePresets = QUALITY_PRESETS.filter((p) => !existingCmds.has(p.cmd));
  const presetsHtml =
    availablePresets.length > 0
      ? `
      <div style="display:flex;flex-direction:column;gap:5px;margin-top:4px">
        <span class="muted">${esc(t('quickPresets'))}</span>
        <div class="row">
          ${availablePresets
            .map(
              (p) =>
                `<button class="btn btn-sm mono" data-action="add-preset" data-cmd="${esc(p.cmd)}">+ ${esc(p.label)}</button>`
            )
            .join('')}
        </div>
      </div>`
      : '';

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">${esc(t('detectedChecks'))} (${allChecks.length})</span>
        <button class="btn btn-sm btn-primary" data-action="run-all-checks" ${state.busyCheck || allChecks.length === 0 ? 'disabled' : ''}>▶ ${esc(t('runAllBtn'))}</button>
      </div>
      ${listHtml}
      <div class="row" style="margin-top:4px">
        <input class="input input-mono" id="customCmdInput" placeholder="${esc(t('customPlaceholder'))}" value="${esc(state.customCmdInput)}" style="flex:1" />
        <button class="btn btn-sm" data-action="add-custom">+ ${esc(t('addBtn'))}</button>
      </div>
      ${presetsHtml}
    </div>
  `;
}

function render() {
  const root = document.getElementById('root');
  if (!root) return;

  const toastHtml = state.toast
    ? `<div class="toast ${state.toast.isError ? 'toast-err' : 'toast-ok'}"><span>${esc(state.toast.text)}</span></div>`
    : '';

  let bodyHtml = '';
  if (state.activeTab === 'git') bodyHtml = renderGitTab();
  else if (state.activeTab === 'secrets') bodyHtml = renderSecretsTab();
  else bodyHtml = renderQualityTab();

  root.innerHTML = `
    <div class="app-shell">
      <div class="topbar">
        <div class="brand">
          <span class="brand-icon">🛡️</span>
          <span>${esc(t('appName'))}</span>
        </div>
        <div class="topbar-actions">
          <button class="btn btn-sm" data-action="toggle-lang">${state.lang === 'en' ? 'EN / TR' : 'TR / EN'}</button>
          <button class="btn btn-sm" data-action="refresh" ${state.busy ? 'disabled' : ''}>↻ ${esc(t('refresh'))}</button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-btn ${state.activeTab === 'git' ? 'active' : ''}" data-action="tab" data-tab="git">🔀 ${esc(t('tabGit'))}</button>
        <button class="tab-btn ${state.activeTab === 'secrets' ? 'active' : ''}" data-action="tab" data-tab="secrets">🔒 ${esc(t('tabSecrets'))}</button>
        <button class="tab-btn ${state.activeTab === 'quality' ? 'active' : ''}" data-action="tab" data-tab="quality">✅ ${esc(t('tabQuality'))}</button>
      </div>

      <div class="repo-bar">
        <input class="input input-mono" id="repoDirInput" placeholder="${esc(t('repoPlaceholder'))}" value="${esc(state.repoInput)}" />
        <button class="btn btn-sm" data-action="load-repo" ${state.busy ? 'disabled' : ''}>${esc(t('loadRepo'))}</button>
      </div>

      ${toastHtml}
      ${bodyHtml}
    </div>
  `;
}

document.addEventListener('input', (e) => {
  const target = e.target;
  if (target.id === 'repoDirInput') state.repoInput = target.value;
  if (target.id === 'commitMsgInput') state.commitMsg = target.value;
  if (target.id === 'customCmdInput') state.customCmdInput = target.value;
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'repoDirInput') loadRepoFromInput();
  if (e.target.id === 'customCmdInput') addCustomCheck();
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'tab') {
    state.activeTab = btn.dataset.tab;
    render();
  } else if (action === 'toggle-lang') {
    toggleLanguage();
  } else if (action === 'refresh') {
    refreshAll();
  } else if (action === 'load-repo') {
    loadRepoFromInput();
  } else if (action === 'checkpoint') {
    handleCheckpoint();
  } else if (action === 'commit') {
    handleCommit();
  } else if (action === 'ai-commit') {
    handleAiCommitMessage();
  } else if (action === 'ask-rollback') {
    state.pendingRollback = btn.dataset.target || 'HEAD';
    render();
  } else if (action === 'cancel-rollback') {
    state.pendingRollback = null;
    render();
  } else if (action === 'confirm-rollback') {
    confirmRollback(state.pendingRollback || 'HEAD');
  } else if (action === 'restore-stash') {
    handleRestoreStash(btn.dataset.ref);
  } else if (action === 'scan-changed') {
    handleScanSecrets(true);
  } else if (action === 'scan-full') {
    handleScanSecrets(false);
  } else if (action === 'clean-secrets-ai') {
    handleCleanSecretsWithAi();
  } else if (action === 'run-check') {
    runSingleCheck(btn.dataset.cmd);
  } else if (action === 'run-all-checks') {
    runAllChecks();
  } else if (action === 'add-custom') {
    addCustomCheck();
  } else if (action === 'add-preset') {
    addCustomCheck(btn.dataset.cmd);
  } else if (action === 'remove-custom') {
    removeCustomCheck(btn.dataset.cmd);
  } else if (action === 'fix-check-ai') {
    handleFixCheckWithAi(btn.dataset.cmd);
  }
});

async function bootstrap() {
  render();
  await app.connect();
  applyThemeFromContext(app.getHostContext());
  const caps = app.getHostCapabilities();
  state.canSendMessage = Boolean(caps?.message);
  await refreshAll();
}

bootstrap().catch((err) => {
  showToast(err?.message || 'Failed to connect MCP App', true);
});
