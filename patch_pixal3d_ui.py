# CLAUDE-NOTE: Fix a cosmetic bug in Pixal3D's web UI (app/index.html): the Decimation
# slider's value label is in a span id="decim_val", but the updateVal() handler writes to
# id + "_val" = "decimation_val". The mismatch makes the label throw and stick at "1M" while
# dragging (the slider's actual value still changes and is sent correctly; only the displayed
# number was frozen). Rename the span id to match. Idempotent; run after the app is cloned.
import pathlib

here = pathlib.Path(__file__).resolve().parent
html = here / "app" / "index.html"
if not html.exists():
    print("UI_PATCH_SKIP index.html not found at", html)
    raise SystemExit(0)

src = html.read_text(encoding="utf-8")
if 'id="decim_val"' in src:
    src = src.replace('id="decim_val"', 'id="decimation_val"', 1)
    html.write_text(src, encoding="utf-8")
    print("UI_PATCH_OK fixed decimation slider label id")
else:
    print("UI_PATCH_OK already patched (or label id changed upstream)")
