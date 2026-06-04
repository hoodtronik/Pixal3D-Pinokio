# CLAUDE-NOTE: Validates a Hugging Face token against the GATED model briaai/RMBG-2.0,
# which Pixal3D requires for background removal. Reads the token from the HF_TEST_TOKEN
# env var (set by hf_token.js) and tries to fetch a gated file. Prints a distinct token
# that hf_token.js's `on` matcher keys off of:
#   RMBG_OK   -> token is valid AND the account has accepted the RMBG-2.0 license
#   RMBG_BAD  -> missing/invalid token, or the license has not been accepted
# Lives in its own file (not an inline python -c) so the OK/BAD markers only appear in the
# program OUTPUT, never in the echoed command line (which the matcher also scans).
import os

token = (os.environ.get("HF_TEST_TOKEN") or "").strip()
if not token:
    print("RMBG_BAD no token provided")
    raise SystemExit(0)

try:
    from huggingface_hub import hf_hub_download, login
    # Gate check: only succeeds if the token is valid AND the license is accepted.
    hf_hub_download("briaai/RMBG-2.0", "config.json", token=token)
    # Persist the token at HF_HOME (Pinokio injects HF_HOME for this app), so start.js
    # picks it up automatically. add_to_git_credential=False avoids an interactive prompt.
    login(token=token, add_to_git_credential=False)
    print("RMBG_OK")
except Exception as e:
    print("RMBG_BAD", repr(e)[:120])
