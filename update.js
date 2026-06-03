// CLAUDE-NOTE: Updates the TRELLIS.2 backbone and Pixal3D code inside the distro, then
// re-syncs Pixal3D's Python deps in case requirements changed. CUDA extensions from
// setup.sh are not rebuilt here; if a TRELLIS.2 update changes them, run Reset + Install.
module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: 'wsl -d pixal3d -u root -- bash -lc "set -e; source /root/miniconda3/etc/profile.d/conda.sh; conda activate trellis2; export CUDA_HOME=/usr/local/cuda-12.4; export PATH=\\$CUDA_HOME/bin:\\$PATH; cd /opt/pixal3d/TRELLIS.2 && git pull --recurse-submodules; cd /opt/pixal3d/Pixal3D && git pull && pip install -r requirements.txt; echo UPDATE_DONE"'
      }
    }
  ]
}
