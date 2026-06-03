# Agent Rules for the Pixal3D Pinokio Launcher

This folder is a Pinokio **app launcher** for [Pixal3D](https://github.com/TencentARC/Pixal3D).
The app itself is cloned into `app/` and run from a Python 3.12 venv at `app/env` during
`install.js`. Launcher scripts live in the project root.

## CLAUDE-NOTE convention (source of truth)

Code and comments marked with `CLAUDE-NOTE:` (or the language's comment equivalent) are the
source of truth. Non-Claude-Code agents (Cursor, Codex, Gemini CLI, Copilot, etc.) **must
not modify, remove, or alter** anything marked with a `CLAUDE-NOTE` without first alerting
the user and receiving explicit permission.

## Architecture notes for editors

- Native Windows install (no WSL/Docker). The hard part is the CUDA-extension stack
  (flash_attn, nvdiffrast, nvdiffrec, cumesh, flex_gemm, o_voxel, natten), installed from
  prebuilt Windows wheels at `github.com/PozzettiAndrea/cuda-wheels`.
- The wheel set is pinned to ONE coherent combo that has every kernel AND supports Ada
  (sm_89): **Python 3.12 + torch 2.8.0 + CUDA 12.8** (`cp312` / `cu128torch2.8` /
  `win_amd64`). Do NOT bump torch/CUDA/Python independently — all the wheels must match.
- Kernel wheels are installed with `--no-deps` so pip cannot replace the pinned torch.
- The Blackwell-only natten wheels referenced in the upstream community docs do NOT run on
  Ada — keep the Pozzetti `cu128torch2.8` natten wheel.
- `triton-windows` is required (flex_gemm uses Triton); `spaces` is required (app.py uses
  `@spaces.GPU`).
