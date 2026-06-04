# CLAUDE-NOTE: Pixal3D's Gradio app serves at 127.0.0.1 and generates self-referential
# file URLs (for inputs/outputs). Gradio 6.x runs those through safehttpx SSRF protection,
# whose PUBLIC_HOSTNAME_WHITELIST only allows hf.co/huggingface.co — so loopback uploads
# fail with "Hostname 127.0.0.1 failed validation". This idempotently adds loopback hosts
# to that whitelist in the INSTALLED gradio package (a venv fix; the app code is untouched).
# Re-runs safely (marker guard) and re-applies after a gradio upgrade.
import pathlib

try:
    import gradio.processing_utils as pu
except Exception as e:
    print("SSRF_PATCH_SKIP could not import gradio.processing_utils:", repr(e)[:100])
    raise SystemExit(0)

marker = "# pixal3d-ssrf-loopback"
path = pathlib.Path(pu.__file__)
src = path.read_text(encoding="utf-8")

if marker in src:
    print("SSRF_PATCH_OK already patched")
elif "PUBLIC_HOSTNAME_WHITELIST = [" in src:
    src = src.replace(
        "PUBLIC_HOSTNAME_WHITELIST = [",
        'PUBLIC_HOSTNAME_WHITELIST = [\n    "127.0.0.1", "localhost", "0.0.0.0", "::1",  ' + marker,
        1,
    )
    path.write_text(src, encoding="utf-8")
    print("SSRF_PATCH_OK patched gradio whitelist for loopback")
else:
    print("SSRF_PATCH_SKIP whitelist marker not found in gradio (version changed?)")
