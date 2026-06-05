// CLAUDE-NOTE: Launches the Pixal3D Gradio demo from the Python 3.12 venv created by
// install.js. build:true gives the shell an MSVC/CUDA build env in case Triton (flex_gemm)
// needs to JIT-compile kernels on first run. The app prints "Running on local URL:
// http://127.0.0.1:7860", which we capture with the canonical mochi pattern.
// app.py is left unmodified; it calls launch(share=True) but prints the local URL first.
module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        build: true,
        // CLAUDE-NOTE env vars:
        // - OPENCV_IO_ENABLE_OPENEXR: app.py loads HDRI .exr env maps via OpenCV, which gates
        //   its OpenEXR codec behind this var; it must be set BEFORE cv2 is imported, but
        //   app.py sets it too late, so we set it at the process level.
        // - GRADIO_ALLOWED_PATHS: let Gradio serve the rendered previews/GLB the app writes
        //   under app/ (otherwise output files 403). {{cwd}} is the launcher root.
        // (We use the default flex_gemm conv backend — correct geometry; see install.js.)
        env: {
          "OPENCV_IO_ENABLE_OPENEXR": "1",
          "GRADIO_ALLOWED_PATHS": "{{cwd}}/app"
        },
        // CLAUDE-NOTE: `--low_vram` is appended when the menu launches start.js?low_vram=true
        // (loads models on demand → generation peak ~13GB instead of ~all-resident). app.py
        // auto-lowers the UI's default resolution/texture in low-VRAM mode.
        message: [
          "python app.py {{args.low_vram ? '--low_vram' : ''}}"
        ],
        on: [{
          "event": "/http:\/\/[0-9.:]+/",
          "done": true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[0]}}"
      }
    }
  ]
}
