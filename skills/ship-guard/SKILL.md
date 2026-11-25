---
name: ship-guard
description: Manage Git Flow with auto-backup safe rollback, scan projects for leaked API keys/secrets/personal paths (Secret Guard), and run auto-detected build/test/lint checks (Quality Gate). Use when the user wants to inspect Git status, safely roll back changes, scan for secrets before pushing, or run project tests/builds.
---

# Ship Guard Plugin Skill

This plugin ships an interactive MCP App UI (side pane & sidebar), a `PreToolUse` Secret Guard hook on `git commit` / `git push`, and MCP tools under `ship-guard_ship-guard`.

## Available Tools

1. `open_ship_guard` — Opens the Ship Guard UI (`tab`: `"git"`, `"secrets"`, or `"quality"`).
2. `git_status` / `git_commit` / `git_checkpoint` / `git_safe_rollback` / `git_restore_stash` / `git_diff_summary` — Full Git Flow with automatic pre-rollback backup stashes so rollbacks are always undoable.
3. `scan_secrets` — Scans for API keys (OpenAI, Gemini, GitHub, AWS, Stripe, Slack, private keys), `.env` files, hardcoded passwords, and personal OS paths.
4. `detect_quality_checks` / `run_quality_check` — Auto-detects and runs `package.json` scripts, Python (`pytest`/`ruff`), Rust, or Go checks.
