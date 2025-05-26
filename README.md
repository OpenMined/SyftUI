# 🎛️ SyftUI

A slick user interface for [SyftBox](https://www.github.com/OpenMined/syft) — your gateway to federated data science magic 🧙‍♂️✨.

SyftUI comes in two flavors:

1. 🖥️ **Desktop App** – All-in-one bundle, just download and run!
2. 🌐 **Web App** – Lightweight and handy, connects with any SyftBox daemon (local or remote).

## 🚀 Installation

### 🖥️ Desktop App (Recommended)

The easiest, most powerful way to run SyftUI.

- Download the app for your OS.
  - [Windows](https://github.com/OpenMined/SyftUI/releases/latest/download/SyftBox-x86_64-pc-windows-msvc.msi)
  - [Linux](https://github.com/OpenMined/SyftUI/releases/latest/download/SyftBox-x86_64-unknown-linux-gnu.AppImage)
  - [Mac (Apple Silicon)](https://github.com/OpenMined/SyftUI/releases/latest/download/SyftBox-aarch64-apple-darwin.dmg)
  - [Mac (Intel)](https://github.com/OpenMined/SyftUI/releases/latest/download/SyftBox-x86_64-apple-darwin.dmg)
- Open it.
- That’s it. 🎉

The SyftBox daemon is already bundled — no extra setup needed!

### 🌐 Web App (For the Adventurous)

Perfect for headless setups or low-resource environments.

- Make sure a SyftBox daemon is running (either locally or remotely) — instructions [here](https://github.com/openmined/syftbox/).
- Launch the frontend by visiting [this link](https://syftboxstage.openmined.org/datasites/tauquir@openmined.org/syftui).
- Enter the **Client URL** and **Token** (you’ll find them in your SyftBox client logs).

## 🛠️ Development

### 💅 Set Up

✨ One command. All the dependencies. Magic. ✨

   ```sh
   just setup
   ```

✅ And boom! You’re ready to start building! It’s that simple. 🚀

### 🖥️ Desktop App (Frontend + Bridge + Desktop)

Work on the frontend, the SyftBox bridge client, AND the Tauri app — all at once with hot reload.

```bash
just dev
```

### 🌐 Web App (Frontend-Only)

Run the frontend in dev mode.

```bash
just dev-frontend
```

💡 Tip: Don’t forget to manually run the SyftBox client by executing `just dev-bridge` in a terminal. Then, copy the **Client URL** and **Token** from the logs and paste them into the frontend.

## 🏗️ Build and Package

### 🖥️ Desktop App

To build and package the desktop app for your current operating system, run:

```bash
just package
```

Depending on your OS, this command will generate the appropriate installer:

* **Windows**: `.msi` package
* **Linux**: `.AppImage`, `.deb`, and `.rpm` packages
* **macOS**: `.dmg` package

### 🌐 Web App

Build the frontend in **SSG** (Static Site Generation) mode.

**Output:** `./out`

```bash
just package-frontend
```

---

And that's it! Now go create something private, powerful, and pretty! 🧠🔒💻
