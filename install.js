// CLAUDE-NOTE: Pixal3D's backbone (microsoft/TRELLIS.2) is Linux-only and depends on
// custom CUDA wheels (flash-attn, nvdiffrast, nvdiffrec, cumesh, flexgemm, o_voxel,
// natten) that have NO native Windows builds. On Windows the only supported path is an
// isolated Ubuntu WSL2 distro ("pixal3d") with NVIDIA GPU passthrough. This installer
// imports a fresh Ubuntu rootfs, installs the CUDA 12.4 build tools + Miniconda, runs the
// official TRELLIS.2 setup.sh to build all CUDA extensions, then clones Pixal3D and
// installs its extra deps. Everything lives inside the distro (native ext4) for fast
// compilation; the distro vhdx lives under ./wsl so Reset can remove it cleanly.
//
// CLAUDE-NOTE (shell): Pinokio's shell.run wrapper on Windows here is BASH-like, not cmd
// — verified from logs: it expanded $PATH into the command text and broke inner parsing.
// So every `$` meant for the INNER WSL bash is escaped as `\$` (written `\\$` in JS), and
// `$(...)` as `\$(...)`. The outer shell then passes a literal `$` through to `bash -lc`,
// where it is expanded in the Linux/WSL context.
//
// CLAUDE-NOTE (cuda): We do NOT install the `cuda-toolkit-12-4` meta package — on Ubuntu
// 24.04 it pulls nsight-systems → libtinfo5, which is uninstallable and breaks the apt
// step. We install only the build pieces we actually need (nvcc + cudart/libraries dev).
module.exports = {
  requires: {
    bundle: "ai"
  },
  run: [
    // 1) Download the official Ubuntu 24.04 (noble) WSL rootfs tarball.
    {
      method: "fs.download",
      params: {
        uri: "https://cloud-images.ubuntu.com/wsl/releases/noble/current/ubuntu-noble-wsl-amd64-wsl.rootfs.tar.gz",
        dir: "cache"
      }
    },
    // 2) Import it as an isolated, dedicated WSL2 distro named "pixal3d".
    //    Unregister any previous "pixal3d" first so re-running install is idempotent.
    {
      method: "shell.run",
      params: {
        message: 'wsl --unregister pixal3d; wsl --import pixal3d "{{cwd}}/wsl" "{{cwd}}/cache/ubuntu-noble-wsl-amd64-wsl.rootfs.tar.gz" --version 2'
      }
    },
    // 3) System packages + CUDA 12.4 build tools (nvcc etc.) + Miniconda.
    //    The GPU driver comes from the Windows host via WSL passthrough, so we use NVIDIA's
    //    "wsl-ubuntu" repo. Install only the build sub-packages (no nsight/libtinfo5).
    {
      method: "shell.run",
      params: {
        message: 'wsl -d pixal3d -u root -- bash -lc "set -e; export DEBIAN_FRONTEND=noninteractive; apt-get update; apt-get install -y build-essential git wget curl ca-certificates ninja-build libjpeg-dev libgl1 libglib2.0-0; wget -q https://developer.download.nvidia.com/compute/cuda/repos/wsl-ubuntu/x86_64/cuda-keyring_1.1-1_all.deb -O /tmp/cuda-keyring.deb; dpkg -i /tmp/cuda-keyring.deb; apt-get update; apt-get install -y cuda-compiler-12-4 cuda-cudart-dev-12-4 cuda-libraries-dev-12-4 cuda-nvtx-12-4; test -d /root/miniconda3 || (wget -q https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && bash /tmp/miniconda.sh -b -p /root/miniconda3); echo PROVISION_DONE"'
      }
    },
    // 4) Clone TRELLIS.2 (recursive) and run its setup.sh to build all CUDA extensions
    //    into a fresh conda env "trellis2" (python 3.10, torch 2.6 / cu124). This step
    //    compiles flash-attn/nvdiffrast/cumesh/flexgemm/o_voxel and takes a long time.
    {
      method: "shell.run",
      params: {
        message: 'wsl -d pixal3d -u root -- bash -lc "set -e; source /root/miniconda3/etc/profile.d/conda.sh; export CUDA_HOME=/usr/local/cuda-12.4; export PATH=\\$CUDA_HOME/bin:\\$PATH; export LD_LIBRARY_PATH=\\$CUDA_HOME/lib64:\\$LD_LIBRARY_PATH; export TORCH_CUDA_ARCH_LIST=\\$(nvidia-smi --query-gpu=compute_cap --format=csv,noheader | head -n1 | xargs); mkdir -p /opt/pixal3d; cd /opt/pixal3d; test -d TRELLIS.2 || git clone -b main https://github.com/microsoft/TRELLIS.2.git --recursive; cd TRELLIS.2; . ./setup.sh --new-env --basic --flash-attn --nvdiffrast --nvdiffrec --cumesh --o-voxel --flexgemm; echo TRELLIS_SETUP_DONE"'
      }
    },
    // 5) Clone Pixal3D and install its extra deps into the same trellis2 env.
    //    natten is built against the detected GPU compute capability (Ada = 8.9).
    {
      method: "shell.run",
      params: {
        message: 'wsl -d pixal3d -u root -- bash -lc "set -e; source /root/miniconda3/etc/profile.d/conda.sh; conda activate trellis2; export CUDA_HOME=/usr/local/cuda-12.4; export PATH=\\$CUDA_HOME/bin:\\$PATH; export LD_LIBRARY_PATH=\\$CUDA_HOME/lib64:\\$LD_LIBRARY_PATH; cd /opt/pixal3d; test -d Pixal3D || git clone https://github.com/TencentARC/Pixal3D.git; cd Pixal3D; pip install -r requirements.txt; NATTEN_CUDA_ARCH=\\$(nvidia-smi --query-gpu=compute_cap --format=csv,noheader | head -n1 | xargs) NATTEN_N_WORKERS=\\$(nproc) pip install natten==0.21.0 --no-build-isolation; pip install https://github.com/LDYang694/Storages/releases/download/20260430/utils3d-0.0.2-py3-none-any.whl; echo PIXAL3D_DEPS_DONE"'
      }
    },
    // 6) Pre-warm the Hugging Face cache so the first launch is fast. Tolerant of
    //    failure (|| true): if a repo id differs, weights still download on first run.
    {
      method: "shell.run",
      params: {
        message: 'wsl -d pixal3d -u root -- bash -lc "source /root/miniconda3/etc/profile.d/conda.sh; conda activate trellis2; huggingface-cli download microsoft/TRELLIS.2-4B || true; huggingface-cli download TencentARC/Pixal3D || true; echo WEIGHTS_PREFETCH_DONE"'
      }
    },
    // 7) Sentinel file so pinokio.js knows the install completed successfully.
    {
      method: "fs.write",
      params: {
        path: "INSTALLED",
        text: "pixal3d"
      }
    }
  ]
}
