# Pixal3D — Pinokio Launcher (Windows)

A **one-click [Pinokio](https://pinokio.co) launcher** for [**Pixal3D**](https://github.com/TencentARC/Pixal3D)
(SIGGRAPH 2026) — **Pixel-Aligned 3D Generation from Images**. Pixal3D turns a single image
into a high-fidelity 3D mesh (`.glb`) with detailed geometry and PBR textures, using
back-projection to establish direct pixel-to-3D correspondences (built on Microsoft
**TRELLIS.2**).

> **This is a Pinokio launcher** — it is meant to be installed and run from within the
> [Pinokio](https://pinokio.co) app, which handles the whole install/start/stop lifecycle for
> you. It is not a standalone script.

## Install in Pinokio

1. Install [Pinokio](https://pinokio.co).
2. In Pinokio, go to **Discover → Download from URL** (or the **Download** page) and paste:
   ```
   https://github.com/hoodtronik/Pixal3D-Pinokio
   ```
3. Open the installed **Pixal3D** app and click **Install**. You'll be guided through a
   Hugging Face token prompt (see [Hugging Face access](#hugging-face-access-required)).
4. When install finishes, click **Start** and then **Open Web UI**.

## What this launcher does

Installs and runs the Pixal3D Gradio web UI **natively on Windows** (no WSL, no Docker). It:

- creates an isolated **Python 3.12** virtual environment,
- installs **PyTorch 2.8 (CUDA 12.8)** + the full TRELLIS.2 CUDA-extension stack
  (`flash_attn`, `nvdiffrast`, `nvdiffrec`, `cumesh`, `flex_gemm`, `o_voxel`, `natten`) from
  the community [PozzettiAndrea/cuda-wheels](https://github.com/PozzettiAndrea/cuda-wheels)
  builds (with **triton-windows pinned to 3.4** to match torch 2.8 — required for correct
  geometry),
- guides you through Hugging Face authentication for a gated model,
- and launches the Gradio demo so you can drag in an image and export a `.glb`.

Verified end-to-end on Windows 11 + RTX 6000 Ada.

## Requirements

- **Windows 10/11 (x64)** with the **[Pinokio](https://pinokio.co)** app.
- **NVIDIA GPU**, compute capability **sm_80+** (Ampere / Ada / Blackwell). Tested on an
  **RTX 6000 Ada (sm_89)**. **≥ 16 GB VRAM**; **24 GB+ recommended** (full-quality export of
  detailed meshes is VRAM-heavy).
- A recent NVIDIA driver (the CUDA 12.8 runtime ships inside the torch wheel — no system CUDA
  toolkit needed).
- ~30 GB free disk (venv + model weights) and an internet connection (first run downloads
  several GB of weights from Hugging Face).

## How to use

In the Pinokio app, the Pixal3D menu gives you:

1. **Install** — clones Pixal3D, builds the venv, installs everything, then prompts for your
   **Hugging Face token**.
2. **Start** — launches the demo at full quality; when ready, **Open Web UI** appears.
3. **Start (Low VRAM)** — same, but loads models on demand (generation peak ~13 GB instead of
   all-resident). Use on smaller cards or to keep the rest of your PC responsive.
4. In the web UI: upload one image → **Start Generation** → tweak settings → **Export GLB**.
5. **Set HF Token** — re-run the Hugging Face token setup anytime (e.g. if it expires).
6. **Update** — pull the latest launcher + Pixal3D code. **Reset** — wipe `app/` for a clean
   reinstall.

### Hugging Face access (required)

Pixal3D's background remover uses the **gated** model
[`briaai/RMBG-2.0`](https://huggingface.co/briaai/RMBG-2.0), so the app needs a Hugging Face
token whose account has accepted that model's license. **Install pops a guided modal:**

1. Open the [RMBG-2.0 page](https://huggingface.co/briaai/RMBG-2.0) and click **"Agree and
   access repository"** (free, instant).
2. Create a **READ** token at <https://huggingface.co/settings/tokens>.
3. Paste it into the prompt. It's validated against the gated repo; if it's wrong, the prompt
   reappears with guidance (no error spiral). The token is stored locally for this app only
   and is never committed to git.

## Tips — output quality & speed

- **Subject matters most.** Pixal3D reconstructs **solid / compact** subjects (characters,
  chunky objects, animals) cleanly. **Thin, articulated, mechanical** subjects (insect legs,
  claws, antennae, thin railings) can **fragment** — this is a model limitation, not a bug.
- **Decimation (face count):** higher keeps thin/detailed parts intact; lower (**300k+**) is
  fine for solid objects and exports faster. **Unsure? Leave it at 1M** (the default is
  always safe — lowering it is purely a speed/size optimization). The UI shows this hint
  under the slider.
- **Texture size** is the main driver of export VRAM/time. Drop it to **1024** (or 512) for
  fast, light exports; 4096 is overkill for most uses and can pin a 48 GB card.
- **Resolution** 1024 vs 1536 mainly trades detail for speed; both produce clean meshes.
- If a hard subject fragments, try a **different seed** or a **tighter crop** of the subject.

### If the attention backend errors

`app.py` defaults to the `flash_attn` backend. If you hit flash-attention errors, add
`"ATTN_BACKEND": "sdpa"` to the `env` in `start.js` to use PyTorch's SDPA fallback.

## Programmatic API

While running, the Gradio demo exposes named API endpoints at the local URL Pinokio captured
(default `http://127.0.0.1:7860`):

- `/preprocess` — preprocess / background-removal for an input image.
- `/generate_3d` — generate the 3D state from an image (seed, resolution, guidance…).
- `/extract_glb_api` — export the result to a downloadable `.glb`.

### Python (`gradio_client`)

```python
from gradio_client import Client, handle_file

client = Client("http://127.0.0.1:7860")

state = client.predict(
    handle_file("dog.png"), 0, 1536,            # image, seed, resolution
    api_name="/generate_3d",
)
glb = client.predict(
    state["state_path"], 1000000, 1024, "",     # state, decimation_target, texture_size, session_id
    api_name="/extract_glb_api",
)
print("Saved GLB:", glb)
```

### JavaScript (`@gradio/client`)

```js
import { Client, handle_file } from "@gradio/client";

const client = await Client.connect("http://127.0.0.1:7860");
const state = await client.predict("/generate_3d", {
  image: handle_file("dog.png"), seed: 0, resolution: 1536,
});
const glb = await client.predict("/extract_glb_api", {
  state_path: state.data[0].state_path, decimation_target: 1000000, texture_size: 1024, session_id: "",
});
console.log("GLB:", glb.data);
```

### curl

```bash
curl -X POST http://127.0.0.1:7860/gradio_api/call/generate_3d \
  -H "Content-Type: application/json" \
  -d '{"data": [{"path": "dog.png"}, 0, 1536]}'
# returns EVENT_ID; then stream the result:
curl -N http://127.0.0.1:7860/gradio_api/call/generate_3d/$EVENT_ID
```

> Open `http://127.0.0.1:7860/?view=api` in your browser to see the exact request schema for
> every endpoint of your running instance.

## How it works (for the curious)

The launcher pins one coherent, Ada-compatible Windows stack — **Python 3.12 / torch 2.8.0 /
CUDA 12.8 / triton-windows 3.4** — and installs the prebuilt CUDA wheels for it. It then
applies a few small post-install fixes the standalone app needs on Windows (vendoring the
pure-Python `nvdiffrec_render` modules, enabling OpenEXR before `cv2` import, whitelisting
loopback for Gradio's SSRF guard, and a couple of UI tweaks). All of this is automated in
`install.js`/`start.js` — a fresh install reproduces the working setup with no manual steps.

## Credits

- [Pixal3D](https://github.com/TencentARC/Pixal3D) — Tencent ARC Lab / Tsinghua University (MIT License).
- Built on [TRELLIS.2](https://github.com/microsoft/TRELLIS.2) and [Direct3D-S2](https://github.com/DreamTechAI/Direct3D-S2).
- Windows CUDA wheels: [PozzettiAndrea/cuda-wheels](https://github.com/PozzettiAndrea/cuda-wheels);
  Windows guidance from [Saganaki22/Pixal3D-ComfyUI](https://github.com/Saganaki22/Pixal3D-ComfyUI).
- Launcher for [Pinokio](https://pinokio.co).
