# Contributing to Ship Guard

Thank you for your interest in contributing to **Ship Guard**!

## Local Development

1. Clone the repository into your Antigravity plugins directory (`~/.gemini/config/plugins/ship-guard`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the MCP App UI bundle:
   ```bash
   npm run build:ui
   ```
4. Verify syntax:
   ```bash
   node --check server/index.mjs server/git.mjs server/secrets.mjs server/quality.mjs scripts/secret-hook.mjs ui/build.mjs
   ```

## Guidelines

- Keep the plugin **100% local** with zero external network calls or API keys.
- Maintain both **English (`en`)** and **Turkish (`tr`)** translations in `ui/app.js`.
- Never commit personal user paths, tokens, or `.env` files (Ship Guard's own Secret Guard will catch them!).
