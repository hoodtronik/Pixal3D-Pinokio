// CLAUDE-NOTE: Native-Windows install of the standalone Pixal3D Gradio app.
// Pixal3D is built on microsoft/TRELLIS.2 and needs CUDA extensions (flash_attn,
// nvdiffrast, nvdiffrec, cumesh, flex_gemm, o_voxel, natten). The community has prebuilt
// Windows wheels for the whole stack at github.com/PozzettiAndrea/cuda-wheels. We pin the
// one coherent combo that has them all AND covers Ada (sm_89): Python 3.12 + torch 2.8.0
// + CUDA 12.8 (cp312/cu128torch2.8/win_amd64). The natten wheel from that repo includes
// native sm_89 SASS (the Blackwell natten wheels in the upstream community docs do NOT
// work on Ada — avoid them). Verified: every wheel URL below returns 200 from the GitHub
// releases API for the cu128torch2.8-cp312 tag.
//
// CLAUDE-NOTE: kernel wheels are installed with --no-deps so pip cannot swap out the
// torch 2.8.0 build they were compiled against. flex_gemm uses Triton, so we also install
// triton-windows. `spaces` is required because the upstream app.py uses @spaces.GPU.
const WHL = "https://github.com/PozzettiAndrea/cuda-wheels/releases/download"
module.exports = {
  requires: {
    bundle: "ai"
  },
  run: [
    // 1) Clone the Pixal3D app into ./app (launcher files stay in the project root).
    {
      method: "shell.run",
      params: {
        message: "git clone https://github.com/TencentARC/Pixal3D.git app"
      }
    },
    // 2) Create a Python 3.12 venv and install the full stack into it.
    {
      method: "shell.run",
      params: {
        path: "app",
        build: true,
        message: [
          // 3.12 venv (uv fetches a managed CPython 3.12 if needed). --seed installs pip
          // into the venv: app.py runs `python -m pip install ... utils3d` at startup, which
          // fails on a pip-less uv venv ("No module named pip").
          "uv venv --python 3.12 --seed env",
          // PyTorch 2.8.0 + cu128 first — every CUDA wheel is built against it.
          "uv pip install --python env/Scripts/python.exe torch==2.8.0 torchvision==0.23.0 --index-url https://download.pytorch.org/whl/cu128",
          // Triton for flex_gemm's sparse-conv kernels. CLAUDE-NOTE: the version MUST match
          // torch (torch 2.8 -> triton 3.4). triton-windows 3.6 (pairs with torch 2.10) causes
          // flex_gemm's Triton launcher to fail compiling ("__triton_launcher.c C2059") and
          // forces a broken fallback. Pin 3.4 to match torch 2.8.
          "uv pip install --python env/Scripts/python.exe \"triton-windows==3.4.0.post21\"",
          "uv pip install --python env/Scripts/python.exe -r requirements.txt",
          // `spaces` (app.py uses @spaces.GPU) + `einops` (required by the NAF upsampler
          // that Pixal3D pulls from valeoai/NAF via torch.hub; not in upstream requirements).
          "uv pip install --python env/Scripts/python.exe spaces einops",
          // CUDA-extension wheels (cu128/torch2.8/cp312/win_amd64), --no-deps so torch stays pinned.
          "uv pip install --python env/Scripts/python.exe --no-deps " +
            "\"" + WHL + "/flash_attn-latest/flash_attn-2.8.3%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\" " +
            "\"" + WHL + "/flex_gemm-latest/flex_gemm-1.0.0%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\" " +
            "\"" + WHL + "/cumesh-latest/cumesh-0.0.1%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\" " +
            "\"" + WHL + "/o_voxel-latest/o_voxel-0.0.1%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\" " +
            "\"" + WHL + "/nvdiffrast-latest/nvdiffrast-0.4.0%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\" " +
            "\"" + WHL + "/nvdiffrec_render-latest/nvdiffrec_render-0.0.1%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\" " +
            "\"" + WHL + "/natten-latest/natten-0.21.6%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\"",
          // CLAUDE-NOTE: we use the default flex_gemm sparse-conv backend (mandatory for
          // correct geometry — the model weights are stored in flex_gemm's permuted layout;
          // spconv/torchsparse have no weight-translation and produce garbage). flex_gemm's
          // Triton kernels compile fine once triton-windows matches torch (pinned above).
          // utils3d (pure-python, official upstream URL from the Pixal3D README).
          "uv pip install --python env/Scripts/python.exe \"https://github.com/LDYang694/Storages/releases/download/20260430/utils3d-0.0.2-py3-none-any.whl\"",
          // Whitelist loopback in Gradio's safehttpx SSRF guard, so file uploads work when
          // the app is served at 127.0.0.1 (otherwise: "Hostname 127.0.0.1 failed validation").
          "env\\Scripts\\python.exe ..\\patch_gradio_ssrf.py",
          // The prebuilt nvdiffrec_render wheel ships only the compiled _C; vendor the
          // pure-python modules (nvdiffrec_render.light etc.) the renderer needs.
          "env\\Scripts\\python.exe ..\\fix_nvdiffrec_render.py"
        ]
      }
    },
    // 3) Guided Hugging Face token setup (Pixal3D needs gated briaai/RMBG-2.0). Pops a
    //    modal with instructions, validates the token, and re-prompts on failure.
    {
      method: "script.start",
      params: {
        uri: "hf_token.js"
      }
    }
  ]
}
