# Ship Guard for Antigravity

**Git Flow & Auto-Backup Safe Rollback**, **Secret Guard (PreToolUse Hook + Scanner)**, and **Quality Gate (Test / Build / Lint + Fix with AI)** in one clean MCP App plugin for Google Antigravity.

- **Zero extra cost (0 tokens / 0 external APIs):** Runs 100% locally.
- **Automatic `PreToolUse` Secret Hook:** Blocks `git commit` and `git push` automatically if API keys, tokens, `.env` files, or personal OS paths are detected in changed files.
- **Bilingual UI (EN / TR):** English by default, persistent one-click Turkish (`TR`) switch.

## Installation

**Requirement:** Node.js 18+ and Git

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

Open from the **Side Pane (`+` → Ship Guard)** or **Sidebar (Plugins → Ship Guard)**.

## License
[MIT](LICENSE)
