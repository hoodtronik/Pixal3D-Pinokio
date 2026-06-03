# Pixal3D — Pinokio Launcher (native Windows)

One-click launcher for [**Pixal3D**](https://github.com/TencentARC/Pixal3D) (SIGGRAPH 2026):
**Pixel-Aligned 3D Generation from Images**. Pixal3D turns a single image into a
high-fidelity 3D mesh (`.glb`) with detailed geometry and PBR textures, using back-projection
to establish direct pixel-to-3D correspondences (built on Microsoft **TRELLIS.2**).

## What this launcher does

Installs and runs the Pixal3D Gradio demo **natively on Windows** using prebuilt CUDA wheels
— no WSL or Docker. It creates a Python 3.12 virtual environment, installs PyTorch 2.8 (CUDA
12.8) and the full TRELLIS.2 CUDA-extension stack (`flash_attn`, `nvdiffrast`, `nvdiffrec`,
`cumesh`, `flex_gemm`, `o_voxel`, `natten`) from the community
[PozzettiAndrea/cuda-wheels](https://github.com/PozzettiAndrea/cuda-wheels) builds, then
launches `app.py`.

## Requirements

- **Windows 10/11 (x64).**
- **NVIDIA GPU**, compute capability **sm_80+** (Ampere/Ada/Blackwell). Tested target:
  **RTX 6000 Ada (sm_89)**. **≥ 16 GB VRAM** (24 GB+ recommended).
- A recent NVIDIA driver (CUDA 12.8 runtime ships inside the torch wheel — no system CUDA
  toolkit needed).
- ~30 GB free disk for the venv + model weights, plus an internet connection (first run
  downloads several GB of weights from Hugging Face).

> The wheel stack is pinned to **Python 3.12 / torch 2.8.0 / CUDA 12.8**. This is the one
> combo with prebuilt Windows wheels for every kernel that also covers Ada GPUs.

## How to use

In Pinokio:

1. **Install** — clones Pixal3D, builds the 3.12 venv, installs torch + all CUDA wheels.
2. **Start** — launches the Gradio demo; when ready, **Open Web UI** appears.
3. In the web UI, upload a single image and generate a `.glb` 3D asset.
4. **Update** — pulls the latest launcher + Pixal3D code.
5. **Reset** — deletes `app/` (clone + venv) for a clean reinstall.

### Low-VRAM mode

Standard mode runs at resolution 1536. On smaller cards, edit `start.js` and change the
launch command to `python app.py --low_vram` (default resolution 1024, models loaded on
demand). With 24 GB+ this is usually unnecessary.

### If the attention backend errors

`app.py` defaults to the `flash_attn` backend. If you see flash-attention errors, add
`ATTN_BACKEND=sdpa` to the `env` in `start.js` to use PyTorch's SDPA fallback (no flash-attn
needed).

## Programmatic API

When running, the Gradio demo exposes named API endpoints at the local URL Pinokio captured
(default `http://127.0.0.1:7860`). Key endpoints:

- `/preprocess` — preprocess / background-removal for an input image.
- `/generate_3d` — generate the 3D state from an image (seed, resolution, guidance…).
- `/extract_glb_api` — export the result to a downloadable `.glb`.

### Python (`gradio_client`)

```python
from gradio_client import Client, handle_file

client = Client("http://127.0.0.1:7860")

state = client.predict(
    image=handle_file("dog.png"),
    seed=0,
    resolution=1536,
    api_name="/generate_3d",
)

glb_path = client.predict(
    state_path=state,
    decimation_target=50000,
    texture_size=1024,
    session_id="",
    api_name="/extract_glb_api",
)
print("Saved GLB:", glb_path)
```

### JavaScript (`@gradio/client`)

```js
import { Client, handle_file } from "@gradio/client";

const client = await Client.connect("http://127.0.0.1:7860");
const state = await client.predict("/generate_3d", {
  image: handle_file("dog.png"), seed: 0, resolution: 1536,
});
const glb = await client.predict("/extract_glb_api", {
  state_path: state.data[0], decimation_target: 50000, texture_size: 1024, session_id: "",
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

## Credits

- [Pixal3D](https://github.com/TencentARC/Pixal3D) — Tencent ARC Lab / Tsinghua University (MIT License).
- Built on [TRELLIS.2](https://github.com/microsoft/TRELLIS.2) and [Direct3D-S2](https://github.com/DreamTechAI/Direct3D-S2).
- Windows CUDA wheels: [PozzettiAndrea/cuda-wheels](https://github.com/PozzettiAndrea/cuda-wheels);
  Windows guidance from [Saganaki22/Pixal3D-ComfyUI](https://github.com/Saganaki22/Pixal3D-ComfyUI).
