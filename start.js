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
        // - SPARSE_CONV_BACKEND=spconv: use prebuilt spconv for sparse conv instead of the
        //   default flex_gemm, whose Triton kernels fail to JIT-compile under VS2019.
        // - GRADIO_ALLOWED_PATHS: let Gradio serve the rendered previews/GLB the app writes
        //   under app/ (otherwise output files 403). {{cwd}} is the launcher root.
        env: {
          "OPENCV_IO_ENABLE_OPENEXR": "1",
          "SPARSE_CONV_BACKEND": "spconv",
          "GRADIO_ALLOWED_PATHS": "{{cwd}}/app"
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
