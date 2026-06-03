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
          // Capture the first http URL printed (the local Gradio URL).
          "event": "/(http:\\/\\/[0-9.:]+)/",
          "done": true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        // input.event is the regex match object from the previous step; index 1 is the
        // captured URL group.
        url: "{{input.event[1]}}"
      }
    }
  ]
}
