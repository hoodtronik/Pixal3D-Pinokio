// CLAUDE-NOTE: Launches the Pixal3D Gradio demo inside the "pixal3d" WSL2 distro.
// Gradio prints "Running on local URL:  http://127.0.0.1:7860"; WSL2 localhost
// forwarding makes that reachable from the Windows host, so Pinokio opens it directly.
// app.py is left unmodified (don't touch the app folder) — it calls launch(share=True),
// but the local URL is printed first, which is what we capture below.
module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        message: 'wsl -d pixal3d -u root -- bash -lc "source /root/miniconda3/etc/profile.d/conda.sh; conda activate trellis2; export CUDA_HOME=/usr/local/cuda-12.4; export PATH=$CUDA_HOME/bin:$PATH; export LD_LIBRARY_PATH=$CUDA_HOME/lib64:$LD_LIBRARY_PATH; cd /opt/pixal3d/Pixal3D; python app.py"',
        on: [{
          // CLAUDE-NOTE: Match the canonical system/examples/mochi/start.js pattern
          // EXACTLY — no capture group, and read the whole match via input.event[0].
          // The capture-group + input.event[1] form left the template unsubstituted at
          // runtime ("{{input.event[1]}}"), which Pinokio then tried to stat as a path.
          // The first http URL printed is the local Gradio URL.
          "event": "/http:\/\/[0-9.:]+/",
          "done": true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        // input.event is the regex match object from the previous step; index 0 is the
        // full matched URL.
        url: "{{input.event[0]}}"
      }
    }
  ]
}
