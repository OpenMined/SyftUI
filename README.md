# 🎛️ SyftUI

A slick user interface for the [SyftBox Daemon](https://www.github.com/OpenMined/syft) — your gateway to federated data science magic 🧙‍♂️✨.

SyftUI comes in two flavors:

1. 🖥️ **Desktop App** – All-in-one bundle, just download and run!
2. 🌐 **Web App** – Lightweight and handy, works with a remote or local SyftBox client.

## 🚀 Installation

### 🖥️ Desktop App (Recommended)

The easiest and most powerful way to run SyftUI.

- Download the app for your OS.
- Open it.
- That’s it. 🎉

The SyftBox client is bundled in — no extra setup needed!

### 🌐 Web App

Perfect for headless setups or low-resource environments.

- Make sure a SyftBox client is running (locally or on a public machine).
- Launch the frontend.
- Enter the **Client URL** and **Token** (you’ll find them in your SyftBox client output).

## 🛠️ Development

### 💅 Set Up

To get started with development, just run the following steps:

1. **Install [Bun](https://bun.sh/docs/installation)**

   Our project runs on Bun for lightning-fast installs and dev experience. Other package managers might work, but we haven't tested them.

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install Tauri prerequisites**

   Tauri powers our desktop builds. Follow their [official setup guide](https://tauri.app/start/prerequisites/) to install any system dependencies (like Rust, Xcode, etc.).

3. **Install dependencies**

   This will grab all the packages needed to run the project:

   ```bash
   bun install
   ```

4. **Set up pre-commit hooks**

   We use Husky to keep our codebase clean and consistent. This step sets up Git hooks to lint and check code automatically before each commit:

   ```bash
   bun husky
   ```

✅ That’s it — you’re all set to start building!

### 🖥️ Desktop App

Work on the UI, the SyftBox client, AND the Tauri app — all at once with hot reload.

```bash
bun run tauri dev
```

---

### 🌐 Web App (Frontend-Only)

Run the frontend in dev mode. Make sure you have a SyftBox client running somewhere!

```bash
bun run dev
```

💡 Tip: You'll need to copy-paste the **Client URL** and **Token** manually into the frontend.

## 🏗️ Build

### 🖥️ Desktop App

#### 🍎 macOS

**Output directory:** `./src-tauri/target/release/bundle/dmg`

```bash
bun run tauri build --bundles dmg
```

#### 🐧 Linux

Coming soon... 🛠️

#### 🪟 Windows

Coming soon... 🛠️

### 🌐 Web App

This builds the frontend in **SSG** mode (Static Site Generation).

**Output:** `./out`

```bash
bun run build
```

---

That's it! Now go build something private, powerful, and pretty! 🧠🔒💻
