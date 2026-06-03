# Agent Rules for the Pixal3D Pinokio Launcher

This folder is a Pinokio **app launcher** for [Pixal3D](https://github.com/TencentARC/Pixal3D).
It does not contain the app's own source — the app is cloned and built inside an isolated
Ubuntu WSL2 distro named `pixal3d` during `install.js`.

## CLAUDE-NOTE convention (source of truth)

Code and comments marked with `CLAUDE-NOTE:` (or the language's comment equivalent) are the
source of truth. Non-Claude-Code agents (Cursor, Codex, Gemini CLI, Copilot, etc.) **must
not modify, remove, or alter** anything marked with a `CLAUDE-NOTE` without first alerting
the user and receiving explicit permission.

## Architecture notes for editors

- The launcher targets **Windows + WSL2** because Pixal3D's backbone (microsoft/TRELLIS.2)
  is Linux-only with custom CUDA wheels that have no native Windows builds.
- `shell.run` runs in **cmd.exe** on Windows, so `$VAR` / `$(...)` inside the
  `wsl ... -- bash -lc "..."` strings pass through literally and are expanded by bash. Do
  not "escape" the `$` with backslashes — that breaks expansion.
- The distro vhdx lives under `./wsl` and weights/conda live inside it; `reset.js`
  unregisters the distro to fully uninstall.
- Install state is tracked by the `INSTALLED` sentinel file (see `pinokio.js`).
