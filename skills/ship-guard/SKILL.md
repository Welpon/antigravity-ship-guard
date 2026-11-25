---
name: ship-guard
description: Manage Git Flow with auto-backup safe rollback, scan projects for leaked API keys/secrets/personal paths (Secret Guard), run auto-detected build/test/lint checks (Quality Gate), and manage SemVer bumps, Git tags, and GitHub Releases. Use when the user wants to inspect Git status, safely roll back changes, scan for secrets before pushing, run project tests/builds, or create tags and GitHub releases.
---

# Ship Guard Skill

Use the `ship-guard` MCP tools when the user asks about Git workflows, secret scanning, quality checks, or releases:

- **`open_ship_guard`**: Opens the 4-tab side pane (`git`, `secrets`, `quality`, `release`).
- **Git Flow:** `git_status`, `git_checkpoint`, `git_commit`, `git_safe_rollback`, `git_restore_stash`, `git_diff_summary`.
- **Secret Guard:** `scan_secrets` (plus automatic `PreToolUse` hook blocking `git commit` / `git push` when leaks are detected).
- **Quality Gate:** `detect_quality_checks`, `run_quality_check`.
- **Release & Tags:** `release_info`, `release_bump_version`, `release_create_tag`, `release_publish_github`.
