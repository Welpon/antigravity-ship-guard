# Ship Guard for Antigravity

**Git Flow & Auto-Backup Safe Rollback**, **Secret Guard (PreToolUse Hook + Scanner)**, **Quality Gate (Test / Build / Lint + Fix with AI)**, and **Release Manager (SemVer Bump, Git Tags & GitHub Releases)** in one MCP App plugin for Google Antigravity.

- **Zero extra cost (0 tokens / 0 external APIs):** Runs 100% locally.
- **Side Pane + Sidebar:** Openable anywhere inside Antigravity.
- **Automatic `PreToolUse` Secret Hook:** Blocks `git commit` and `git push` automatically if API keys, tokens, `.env` files, or personal OS paths are detected in changed files.
- **Bilingual UI (EN / TR):** English by default, with persistent one-click Turkish (`TR`) switching.

---

## Features

### 1. Git Flow (`Git Flow` / `Git Akışı`)
- View active branch, modified/untracked files, recent commits, and backup stashes.
- **💾 Checkpoint:** Save uncommitted work into a timestamped `ship-guard-checkpoint-...` stash in one click.
- **✓ Stage & Commit:** Secret-checked commit flow directly from the side pane.
- **✨ AI Commit / PR Msg:** Sends a compact diff to chat to draft Conventional Commit messages and PR summaries.
- **↩ Safe Rollback (Auto-Backup):** Automatically stashes current uncommitted changes (`ship-guard-pre-rollback-...`) before resetting to `HEAD` or any past commit — with 1-click **Restore** so even rollbacks are undoable.

### 2. Secret Guard (`Secrets` / `Gizli Bilgi`)
- **Automatic `PreToolUse` Hook (`hooks.json`):** Intercepts `git commit` and `git push` commands and blocks them (`decision: "deny"`) if leaked keys, `.env` files, or personal OS paths are found.
- **On-Demand Scanner:** Run **Scan Changed** or **Full Project Scan** with `Critical / High / Warning` counters, masked previews, and **🧹 Clean with AI**.

### 3. Quality Gate (`Quality` / `Kalite`)
- Auto-detects `package.json` scripts (`lint`, `typecheck`, `test`, `build`, `build:ui`, etc.), **Node Syntax Check** (`node --check`), **`npm audit --audit-level=high`**, **`tsc --noEmit`**, **`git diff --check`**, Python (`pytest`, `ruff`, `mypy`), Rust (`cargo check/test/clippy`), and Go (`go test/vet`).
- **Quick Add Presets** + custom persistent commands, **Run All Checks**, pass/fail timing badges, output viewer, and 1-click **🔧 Fix with AI** on failures.

### 4. Release & Tags (`Release` / `Yayın`)
- Displays current version (`package.json` / `plugin.json`), latest Git tag, and `gh` CLI readiness.
- **1-Click SemVer Bump:** `+ Patch`, `+ Minor`, `+ Major`.
- **Auto-Generated Changelog:** Groups commits since the last tag into `Features / Fixes / Other Changes`, plus **✨ AI Release Notes**.
- **Git Tag & GitHub Release:** Create local tag, **Tag & Push**, or publish a **GitHub Release** (with optional **Draft** mode and automatic Secret Guard check).

---

## Installation

**Requirements:** Node.js 18+, Git (and optional [GitHub CLI `gh`](https://cli.github.com/) for publishing GitHub Releases).

### Windows (PowerShell)
```powershell
git clone https://github.com/Welpon/antigravity-ship-guard.git "$env:USERPROFILE\.gemini\config\plugins\ship-guard"
cd "$env:USERPROFILE\.gemini\config\plugins\ship-guard"
npm install
```

### macOS / Linux
```bash
git clone https://github.com/Welpon/antigravity-ship-guard.git ~/.gemini/config/plugins/ship-guard
cd ~/.gemini/config/plugins/ship-guard && npm install
```

### Without Git (ZIP Download)
1. Click **Code → Download ZIP** on GitHub.
2. Extract into `~/.gemini/config/plugins/ship-guard`.
3. Open a terminal in that folder and run `npm install`.

Antigravity discovers the plugin automatically. Open it from the **Side Pane (`+` → Ship Guard)** or **Sidebar (Plugins → Ship Guard)**.

---

## Related Antigravity Plugins
- **[Context Brain](https://github.com/Welpon/antigravity-context-brain)** — Live Context Monitor, Markdown Memory Vault, Kanban & Activity Log
- **[Ship Guard](https://github.com/Welpon/antigravity-ship-guard)** — Git Flow, Safe Rollback, Secret Guard Hook, Quality Gate & GitHub Releases
- **[Local Studio](https://github.com/Welpon/antigravity-local-studio)** — SQLite / PostgreSQL Explorer & Localhost API Tester
- **[Project Studio](https://github.com/Welpon/antigravity-project-studio)** — Project Kickstart Scaffolder & Live UI Kit Previewer

## Contributing
Pull requests and issues are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for local development steps.

## License
[MIT](LICENSE)
