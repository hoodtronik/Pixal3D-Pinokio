// CLAUDE-NOTE: Guided Hugging Face token setup for Pixal3D. Pixal3D's background remover
// uses the GATED model briaai/RMBG-2.0, so the app needs an HF token whose account has
// accepted that model's license. This script pops a modal with instructions, validates
// the pasted token against the gated repo (via check_hf_token.py), and on success persists
// it at the app's HF_HOME. On failure it re-shows the modal with an error message instead
// of crashing — a retry loop via `jump`, not an error spiral.
// Run by install.js (script.start) and also available as a menu item to re-set the token.
module.exports = {
  run: [
    // Clear any prior error message before the first prompt.
    {
      method: "local.set",
      params: { err: "" }
    },
    // The prompt. {{local.err}} is empty on the first pass and holds the failure notice on
    // retries. type:"password" hides the token as it's typed.
    {
      id: "prompt",
      method: "input",
      params: {
        type: "modal",
        title: "Hugging Face access (required for Pixal3D)",
        description: "{{local.err}}Pixal3D removes image backgrounds with the GATED model briaai/RMBG-2.0, so it needs your Hugging Face token.\n\nStep 1 — Open https://huggingface.co/briaai/RMBG-2.0 and click \"Agree and access repository\" (free, instant).\nStep 2 — Create a READ token at https://huggingface.co/settings/tokens\nStep 3 — Paste the token below and submit.",
        form: [{
          type: "password",
          key: "token",
          title: "Hugging Face token",
          description: "Your token is stored locally for this app only. It is never committed to git.",
          placeholder: "hf_...",
          required: true
        }]
      }
    },
    // Preserve the token in a local var (the next step's `input` becomes the shell output).
    {
      method: "local.set",
      params: { token: "{{input.token}}" }
    },
    // Validate (and, on success, persist) the token. The helper prints RMBG_OK / RMBG_BAD.
    {
      method: "shell.run",
      params: {
        env: { HF_TEST_TOKEN: "{{local.token}}" },
        message: '"{{cwd}}\\app\\env\\Scripts\\python.exe" "{{cwd}}\\check_hf_token.py"',
        on: [
          { "event": "/RMBG_OK/", "done": true },
          { "event": "/RMBG_BAD/", "done": true }
        ]
      }
    },
    // Preserve the validation result.
    {
      method: "local.set",
      params: { result: "{{input.event[0]}}" }
    },
    // On anything other than a clean RMBG_OK: set the error notice and loop back to the prompt.
    {
      method: "local.set",
      when: "{{local.result !== 'RMBG_OK'}}",
      params: { err: "⚠️ That token could not access briaai/RMBG-2.0. Make sure you clicked \"Agree and access repository\" on the model page (as the token's account) and pasted a valid READ token, then try again.\n\n" }
    },
    {
      method: "jump",
      when: "{{local.result !== 'RMBG_OK'}}",
      params: { id: "prompt" }
    }
    // Falls through here only when the token is valid and has been persisted.
  ]
}
