// CLAUDE-NOTE: Reset removes the cloned app + its venv so install can start clean.
module.exports = {
  run: [{
    method: "fs.rm",
    params: {
      path: "app"
    }
  }]
}
