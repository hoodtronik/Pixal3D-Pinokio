// CLAUDE-NOTE: Reset = full uninstall of the isolated environment. Unregistering the
// "pixal3d" distro deletes its ext4 vhdx (the conda env, both repos, and all weights).
// Then we remove the local install dir, the cached rootfs, and the sentinel so the
// launcher returns to a clean "not installed" state.
module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "wsl --unregister pixal3d"
      }
    },
    {
      method: "fs.rm",
      params: {
        path: "wsl"
      }
    },
    {
      method: "fs.rm",
      params: {
        path: "cache"
      }
    },
    {
      method: "fs.rm",
      params: {
        path: "INSTALLED"
      }
    }
  ]
}
