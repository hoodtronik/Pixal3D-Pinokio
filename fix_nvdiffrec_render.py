# CLAUDE-NOTE: The prebuilt Windows nvdiffrec_render wheel ships ONLY the compiled
# renderutils/_C extension — none of the pure-Python modules. Pixal3D imports
# nvdiffrec_render.light (EnvironmentLight) for HDRI shading, so it fails with
# "No module named 'nvdiffrec_render.light'". This vendors the pure-Python files from the
# upstream source (JeffreyXiang/nvdiffrec, renderutils branch) into the installed package,
# WITHOUT touching the compiled _C.pyd. Idempotent (skips if already vendored).
import os
import sys
import shutil
import tempfile
import subprocess

pkg_dir = os.path.join(sys.prefix, "Lib", "site-packages", "nvdiffrec_render")
if not os.path.isdir(pkg_dir):
    print("NVDIFFREC_SKIP nvdiffrec_render not installed at", pkg_dir)
    raise SystemExit(0)
if os.path.exists(os.path.join(pkg_dir, "light.py")):
    print("NVDIFFREC_OK already vendored")
    raise SystemExit(0)

tmp = tempfile.mkdtemp()
repo = os.path.join(tmp, "nvdiffrec")
subprocess.check_call([
    "git", "clone", "-b", "renderutils", "--depth", "1",
    "https://github.com/JeffreyXiang/nvdiffrec.git", repo,
])
src = os.path.join(repo, "nvdiffrec_render")

# Copy pure-Python modules (+ the bsdf data blob), skipping C sources / tests and never
# overwriting the prebuilt _C extension.
copied = 0
for root, dirs, files in os.walk(src):
    dirs[:] = [d for d in dirs if d not in ("c_src", "tests", "__pycache__")]
    rel = os.path.relpath(root, src)
    dst = pkg_dir if rel == "." else os.path.join(pkg_dir, rel)
    os.makedirs(dst, exist_ok=True)
    for fn in files:
        if fn.endswith((".py", ".bin")):
            shutil.copy2(os.path.join(root, fn), os.path.join(dst, fn))
            copied += 1

shutil.rmtree(tmp, ignore_errors=True)
print(f"NVDIFFREC_OK vendored {copied} python files into nvdiffrec_render")
