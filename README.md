# 🎛️ SyftUI

A slick user interface for [SyftBox](https://www.github.com/OpenMined/syft) — your gateway to federated data science magic 🧙‍♂️✨.

SyftUI comes in two flavors:

1. 🖥️ **Desktop App** – All-in-one bundle, just download and run!
2. 🌐 **Web App** – Lightweight and handy, works with any SyftBox client (local or remote).

## 🚀 Installation

### 🖥️ Desktop App (Recommended)

The easiest, most powerful way to run SyftUI.

- Download the app for your OS.
- Open it.
- That’s it. 🎉

The SyftBox client is already bundled — no extra setup needed!

### 🌐 Web App (For the Adventurous)

Perfect for headless setups or low-resource environments.

- Make sure a SyftBox client is running (either locally or remotely).
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

💡 Tip: Don’t forget to manually run the SyftGo **bridge server** by executing `just dev-bridge` in a terminal. Then, copy the **Client URL** and **Token** from the logs and paste them into the frontend.

## 🏗️ Build and Package

### 🖥️ Desktop App

#### 🍎 macOS

**Output directory:** `./src-tauri/target/release/bundle/dmg`

```bash
just package
```

#### 🐧 Linux

Coming soon... 🛠️

#### 🪟 Windows

Coming soon... 🛠️

### 🌐 Web App

Build the frontend in **SSG** (Static Site Generation) mode.

**Output:** `./out`

```bash
just package-frontend
```

---

And that's it! Now go create something private, powerful, and pretty! 🧠🔒💻
