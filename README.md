# Pixal3D — Pinokio Launcher

One-click launcher for [**Pixal3D**](https://github.com/TencentARC/Pixal3D) (SIGGRAPH 2026):
**Pixel-Aligned 3D Generation from Images**. Pixal3D turns a single image into a
high-fidelity 3D mesh (`.glb`) with detailed geometry and PBR textures by lifting pixel
features into 3D through back-projection (built on Microsoft **TRELLIS.2**).

## What this launcher does

Pixal3D's backbone (TRELLIS.2) is **Linux-only** and relies on custom CUDA extensions
(`flash-attn`, `nvdiffrast`, `nvdiffrec`, `cumesh`, `flexgemm`, `o_voxel`, `natten`) that
have **no native Windows builds**. So on Windows this launcher provisions an **isolated
Ubuntu 24.04 WSL2 distro** named `pixal3d` with your NVIDIA GPU passed through, installs the
CUDA 12.4 toolkit + Miniconda, runs the official TRELLIS.2 `setup.sh` to compile the CUDA
extensions, then clones and installs Pixal3D and launches its Gradio web demo.

Everything is self-contained inside the distro, so **Reset** fully uninstalls it by
unregistering the distro.

## Requirements

- **Windows 11** with **WSL2 enabled** (`wsl --version` should work).
- **NVIDIA GPU** with a recent Windows driver (WSL CUDA passthrough). **≥ 24 GB VRAM**
  recommended (the project is verified on A100/H100; an RTX 6000 Ada / 4090-class card with
  24–48 GB works well).
- ~60+ GB free disk for the toolkit, conda env, and model weights.
- A working internet connection (first install downloads several GB of wheels + weights).

> The first install is long — it compiles CUDA extensions and downloads the TRELLIS.2-4B and
> Pixal3D model weights. This is normal.

## How to use

In Pinokio:

1. **Install** — provisions the WSL2 distro and builds everything (one time).
2. **Start** — launches the Gradio demo; when ready, **Open Web UI** appears.
3. In the web UI, upload a single image and generate a `.glb` 3D asset.
4. **Update** — pulls the latest TRELLIS.2 + Pixal3D code and re-syncs Python deps.
5. **Reset** — unregisters the `pixal3d` distro and removes all local files (full uninstall).

### Low-VRAM mode

Standard mode runs at resolution 1536. If you hit out-of-memory errors on a smaller card,
edit `start.js` and change the launch command to `python app.py --low_vram` (switches the
default resolution to 1024 and loads models on demand). With 24 GB+ this is usually not
needed.

### If the attention backend errors

`app.py` defaults to the `flash_attn` backend. If you see flash-attention errors, set the
SDPA fallback by adding `export ATTN_BACKEND=sdpa;` before `python app.py` in `start.js`.

## Programmatic API

When running, the Gradio demo exposes named API endpoints. From the Windows host use the
local URL Pinokio captured (default `http://127.0.0.1:7860`). The key endpoints are:

- `/preprocess` — background-removal / preprocessing for an input image.
- `/generate_3d` — generate the 3D latent state from an image (seed, resolution, guidance…).
- `/extract_glb_api` — export the result to a downloadable `.glb`.

### Python (`gradio_client`)

```python
from gradio_client import Client, handle_file

client = Client("http://127.0.0.1:7860")

# 1) Generate the 3D state from an image
state = client.predict(
    image=handle_file("dog.png"),
    seed=0,
    resolution=1536,
    api_name="/generate_3d",
)

# 2) Export to GLB
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
  image: handle_file("dog.png"),
  seed: 0,
  resolution: 1536,
});

const glb = await client.predict("/extract_glb_api", {
  state_path: state.data[0],
  decimation_target: 50000,
  texture_size: 1024,
  session_id: "",
});

console.log("GLB:", glb.data);
```

### curl

Gradio's HTTP API is a two-step (POST to start a job, GET the result). The simplest path is
the queue API:

```bash
# Submit a call to the /generate_3d endpoint
curl -X POST http://127.0.0.1:7860/gradio_api/call/generate_3d \
  -H "Content-Type: application/json" \
  -d '{"data": [{"path": "dog.png"}, 0, 1536]}'

# The response returns an EVENT_ID; stream the result:
curl -N http://127.0.0.1:7860/gradio_api/call/generate_3d/$EVENT_ID
```

> Tip: open `http://127.0.0.1:7860/?view=api` in your browser to see the exact, current
> request schema for every endpoint of your running instance.

### Command-line inference (inside the distro)

You can also run the non-UI inference script directly inside WSL:

```bash
wsl -d pixal3d -u root -- bash -lc "source /root/miniconda3/etc/profile.d/conda.sh; conda activate trellis2; cd /opt/pixal3d/Pixal3D; python inference.py --image assets/images/0_img.png --output ./output.glb"
```

## Credits

- [Pixal3D](https://github.com/TencentARC/Pixal3D) — Tencent ARC Lab / Tsinghua University (MIT License).
- Built on [TRELLIS.2](https://github.com/microsoft/TRELLIS.2) and
  [Direct3D-S2](https://github.com/DreamTechAI/Direct3D-S2).
