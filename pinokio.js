module.exports = {
  version: "7.0",
  title: "Pixal3D",
  description: "Pixel-Aligned 3D Generation from Images (SIGGRAPH 2026). Generate high-fidelity 3D GLB assets from a single image. Runs the TRELLIS.2-based Gradio demo inside an isolated Ubuntu WSL2 environment with NVIDIA GPU passthrough.",
  icon: "icon.png",
  menu: async (kernel, info) => {
    // CLAUDE-NOTE: The app lives inside the WSL2 distro, not a Windows venv, so install
    // state is tracked with the INSTALLED sentinel written at the end of install.js.
    // The ./wsl folder existing without the sentinel means a partial/failed install,
    // for which we offer a resume Install plus Reset.
    let installed = info.exists("INSTALLED")
    let partial = info.exists("wsl") && !installed
    let running = {
      install: info.running("install.js"),
      start: info.running("start.js"),
      update: info.running("update.js"),
      reset: info.running("reset.js")
    }
    if (running.install) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Installing",
        href: "install.js",
      }]
    } else if (running.update) {
      return [{
        default: true,
        icon: "fa-solid fa-terminal",
        text: "Updating",
        href: "update.js",
      }]
    } else if (running.reset) {
      return [{
        default: true,
        icon: "fa-solid fa-terminal",
        text: "Resetting",
        href: "reset.js",
      }]
    } else if (running.start) {
      let local = info.local("start.js")
      if (local && local.url) {
        return [{
          default: true,
          icon: "fa-solid fa-rocket",
          text: "Open Web UI",
          href: local.url,
        }, {
          icon: "fa-solid fa-terminal",
          text: "Terminal",
          href: "start.js",
        }]
      } else {
        return [{
          default: true,
          icon: "fa-solid fa-terminal",
          text: "Terminal",
          href: "start.js",
        }]
      }
    } else if (installed) {
      return [{
        default: true,
        icon: "fa-solid fa-power-off",
        text: "Start",
        href: "start.js",
      }, {
        icon: "fa-solid fa-plug",
        text: "Update",
        href: "update.js",
      }, {
        icon: "fa-regular fa-circle-xmark",
        text: "Reset",
        href: "reset.js",
      }]
    } else if (partial) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Resume Install",
        href: "install.js",
      }, {
        icon: "fa-regular fa-circle-xmark",
        text: "Reset",
        href: "reset.js",
      }]
    } else {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Install",
        href: "install.js",
      }]
    }
  }
}
