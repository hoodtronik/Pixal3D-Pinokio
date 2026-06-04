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
        // CLAUDE-NOTE: app.py loads HDRI .exr env maps via OpenCV, but opencv-python gates
        // its OpenEXR codec behind this env var, which must be set BEFORE cv2 is imported.
        // app.py sets it too late (after `import cv2`), so we set it at the process level.
        env: {
          "OPENCV_IO_ENABLE_OPENEXR": "1"
        },
        message: [
          "python app.py"
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
