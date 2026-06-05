# CLAUDE-NOTE: Small fixes to Pixal3D's web UI (app/index.html). Idempotent; run after the
# app is cloned (wired into install.js). Both fixes are cosmetic/UX only.
#   1. The Decimation slider's value label span is id="decim_val" but updateVal() targets
#      id + "_val" = "decimation_val", so the label froze at "1M" while dragging. Rename it.
#   2. Add a guidance hint under the Decimation slider: thin/detailed subjects (legs, claws)
#      fragment at low decimation, so users know higher = safer. No auto-recommendation is
#      possible (depends on the subject), so a static hint is the right call.
import pathlib

here = pathlib.Path(__file__).resolve().parent
html = here / "app" / "index.html"
if not html.exists():
    print("UI_PATCH_SKIP index.html not found at", html)
    raise SystemExit(0)

src = html.read_text(encoding="utf-8")
changed = False

# 1. Fix the decimation label id so the displayed value updates while dragging.
if 'id="decim_val"' in src:
    src = src.replace('id="decim_val"', 'id="decimation_val"', 1)
    changed = True

# 2. Add a guidance hint under the Decimation slider (idempotent via the marker id).
anchor = 'oninput="updateVal(\'decimation\')">'
if 'id="decimation-hint"' not in src and anchor in src:
    hint = (
        '\n                            <div id="decimation-hint" '
        'style="font-size:11px;opacity:0.6;margin-top:4px;line-height:1.35;">'
        'Higher keeps thin/detailed parts (legs, claws, antennae) intact; lower (300k+) is '
        'fine for solid objects and exports faster. Unsure? Leave at 1M.</div>'
    )
    src = src.replace(anchor, anchor + hint, 1)
    changed = True

if changed:
    html.write_text(src, encoding="utf-8")
    print("UI_PATCH_OK applied UI fixes (decimation label + hint)")
else:
    print("UI_PATCH_OK already patched")
