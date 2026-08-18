# CLAUDE-NOTE: Make Pixal3D's GLB export universally importable (app/app.py).
# Upstream calls glb.export(..., extension_webp=True), which encodes every texture as
# WebP and adds the EXT_texture_webp glTF extension. WebP shrinks the file for browsers,
# but almost no DCC/game-engine importer supports EXT_texture_webp: Unreal rejects the
# asset outright ("Unsupported extensions: EXT_texture_webp" -> "no data to import"),
# and Blender/Maya/Godot hit the same wall. Flipping the flag to False makes trimesh
# embed textures as PNG (its default), which every consumer reads. Idempotent; wired
# into install.js after the other patches.
import pathlib

here = pathlib.Path(__file__).resolve().parent
app_py = here / "app" / "app.py"
if not app_py.exists():
    print("GLB_PATCH_SKIP app.py not found at", app_py)
    raise SystemExit(0)

src = app_py.read_text(encoding="utf-8")

if "extension_webp=True" in src:
    src = src.replace("extension_webp=True", "extension_webp=False")
    app_py.write_text(src, encoding="utf-8")
    print("GLB_PATCH_OK textures now export as PNG (EXT_texture_webp disabled)")
else:
    print("GLB_PATCH_OK already patched")
