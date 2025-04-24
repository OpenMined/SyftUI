# Guidelines for new commands
# - Start with a verb
# - Keep it short (max. 3 words in a command)
# - Group commands by context. Include group name in the command name.
# - Mark things private that are util functions with [private] or _var
# - Don't over-engineer, keep it simple.
# - Don't break existing commands
# - Maintain cross-platform compatibility by using Python instead of shell scripts for complex operations
# - Use Path from pathlib for file paths to handle different path separators automatically
# - Handle platform-specific differences (Windows vs Unix) explicitly where needed
# - Provide proper error handling for all operations to fail gracefully on all platforms
# - Run just --fmt --unstable after adding new commands
# ---------------------------------------------------------------------------------------------------------------------
# Private vars

_red := '\033[1;31m'
_cyan := '\033[1;36m'
_blue := '\033[1;34m'
_green := '\033[1;32m'
_yellow := '\033[1;33m'
_inverse := '\033[7m'
_nc := '\033[0m'
_token := "3c8ae64be3af883044cdc0653849c522"


# ---------------------------------------------------------------------------------------------------------------------

# List all commands.
default:
    just --list

# ------------------------------------------------ CODE QUALITY CHECKS ------------------------------------------------

# Check the code quality of the frontend, bridge and desktop app.
[group('code-quality:check')]
check: check-frontend check-desktop check-syftbox
    echo "{{ _green }} All code quality checks completed successfully. {{ _nc }}"

# Check the bridge server code quality.
[group('code-quality:check')]
check-syftbox:
    echo "TODO"

# Check the desktop app code quality.
[group('code-quality:check')]
check-desktop:
    cargo clippy --manifest-path ./src-tauri/Cargo.toml
    cargo fmt --manifest-path ./src-tauri/Cargo.toml --check
    echo "{{ _green }}Desktop app code quality check completed successfully.{{ _nc }}"

# Check the frontend code quality.
[group('code-quality:check')]
check-frontend:
    bun run --cwd src-frontend prettier --check .
    bun run --cwd src-frontend lint
    echo "{{ _green }}Frontend code quality check completed successfully.{{ _nc }}"

# ------------------------------------------------ CODE QUALITY FIXES -------------------------------------------------

# Tidy up the code of the frontend, bridge and desktop app.
[group('code-quality:tidy')]
tidy: tidy-frontend tidy-desktop tidy-syftbox
    just --fmt --unstable
    echo "{{ _green }}Justfile formatted successfully.{{ _nc }}"

# Tidy up the bridge server code.
[group('code-quality:tidy')]
tidy-syftbox:
    echo "TODO"

# Tidy up the desktop app code.
[group('code-quality:tidy')]
tidy-desktop:
    cargo clippy --manifest-path ./src-tauri/Cargo.toml --fix --allow-staged
    cargo fmt --manifest-path ./src-tauri/Cargo.toml
    echo "{{ _green }}Desktop app code tidied up successfully.{{ _nc }}"

# Tidy up the frontend code.
[group('code-quality:tidy')]
tidy-frontend:
    bun run --cwd src-frontend prettier --write .
    bun run --cwd src-frontend lint --fix
    echo "{{ _green }}Frontend code tidied up successfully.{{ _nc }}"

# ---------------------------------------------------- DEV COMMANDS ---------------------------------------------------

[group('dev')]
dev:
    #!/bin/sh
    set -eou pipefail

    export BRIDGE_HOST="localhost"
    export BRIDGE_PORT="7938"
    export BRIDGE_TOKEN="{{ _token }}"

    bunx concurrently --kill-others --success first \
        --prefix name --names "BRIDGE,FRONTEND,DESKTOP" \
        --prefix-colors red,yellow,green \
        "just dev-syftbox" "just dev-frontend" "just dev-desktop"

[group('dev')]
dev-syftbox:
    #!/bin/sh
    set -eou pipefail

    # if empty dir
    if [ -z "$(ls -A src-syftbox)" ]; then
        echo "'src-syftbox' is empty."
        echo "Run {{ _cyan }}'just setup'{{ _nc }} to initialize the project."
        exit 1
    fi

    cd src-syftbox
    go run ./cmd/client daemon --http-addr localhost:7938 --http-token {{ _token }} --http-swagger

# Run the desktop dev app.
[group('dev')]
dev-desktop:
    bunx @tauri-apps/cli dev

# Run the frontend dev server.
[group('dev')]
dev-frontend:
    bun run --cwd src-frontend dev

# -------------------------------------------------- PACKAGE COMMANDS -------------------------------------------------

# Build the frontend, bridge and desktop app and package them into a single installable.
[group('package')]
package TARGET_TRIPLE="":
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(["just", "package-frontend", "desktop_build=yes"], check=True)
        subprocess.run(["just", "package-bridge", "{{ TARGET_TRIPLE }}"], check=True)
        subprocess.run(["just", "package-desktop", "{{ TARGET_TRIPLE }}"], check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Build the bridge and package it into a single installable.
[group('package')]
package-bridge TARGET_TRIPLE="":
    #!/usr/bin/env python
    import os
    import platform
    import subprocess
    import shutil
    import sys
    from pathlib import Path

    try:
        target_triple = "{{ TARGET_TRIPLE }}"
        if not target_triple:
            # Get target triple
            rustc_output = subprocess.run(['rustc', '-Vv'], capture_output=True, text=True).stdout
            target_triple = None
            for line in rustc_output.splitlines():
                if 'host:' in line:
                    target_triple = line.split('host:')[1].strip()
                    break

        if not target_triple:
            print(f"{{ _red }}Failed to determine the target triple. Please check the Rust installation.{{ _nc }}")
            sys.exit(1)

        # Run the build command
        if target_triple == "aarch64-apple-darwin":
            subprocess.run(['just', '--justfile=src-syftbox/justfile', 'build-client-target', 'darwin', 'arm64'], check=True)
        elif target_triple == "x86_64-apple-darwin":
            subprocess.run(['just', '--justfile=src-syftbox/justfile', 'build-client-target', 'darwin', 'amd64'], check=True)
        else:
            # The command will automatically determine the target triple
            subprocess.run(['just', '--justfile=src-syftbox/justfile', 'build-client-target'], check=True)

        # Determine extension
        extension = '.exe' if platform.system() == 'Windows' else ''

        # Copy the binary
        dst_dir = Path("src-tauri/binaries")
        dst = dst_dir / f"syftbox_client-{target_triple}{extension}"
        dst_dir.mkdir(parents=True, exist_ok=True)

        # Find and copy the client binary
        client_files = list(Path('src-syftbox/.out').glob('syftbox_client_*'))
        if not client_files:
            print(f"{{ _red }}No client binary found in src-syftbox/.out{{ _nc }}")
            sys.exit(1)

        shutil.copy2(client_files[0], dst)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Build the desktop app and package it into a single installable.
[group('package')]
package-desktop TARGET_TRIPLE="":
    #!/usr/bin/env python
    import os
    import subprocess
    import sys

    env = os.environ.copy()
    target_triple = "{{ TARGET_TRIPLE }}"
    if not target_triple:
        # Get target triple
        rustc_output = subprocess.run(['rustc', '-Vv'], capture_output=True, text=True).stdout
        for line in rustc_output.splitlines():
            if 'host:' in line:
                target_triple = line.split('host:')[1].strip()
                break

    if not target_triple:
        print(f"{{ _red }}Failed to determine the target triple. Please check the Rust installation.{{ _nc }}")
        sys.exit(1)

    try:
        if env.get('GITHUB_CI') == '1':
            env['CI'] = 'false'
            env['TAURI_BUNDLER_DMG_IGNORE_CI'] = 'true'
            subprocess.run(['bunx', '@tauri-apps/cli', 'build', "--ci", "--target", target_triple], env=env, check=True)
        else:
            env['TAURI_SIGNING_PRIVATE_KEY'] = 'dummy'
            env['TAURI_SIGNING_PRIVATE_KEY_PASSWORD'] = 'dummy'
            subprocess.run(['bunx', '@tauri-apps/cli', 'build'], env=env, check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Build the frontend and package it as a static site export.
[group('package')]
package-frontend desktop_build="no":
    #!/usr/bin/env python
    import os
    import subprocess
    import sys

    env = os.environ.copy()

    try:
        if "{{ desktop_build }}" != "no":
            env['IS_DESKTOP_BUILD'] = '1'
            subprocess.run(['bun', 'run', '--cwd', 'src-frontend', 'build'], env=env, check=True)
        else:
            subprocess.run(['bun', 'run', '--cwd', 'src-frontend', 'build'], check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Temporary helper to deploy the frontend to the staging server
[group('package')]
deploy-frontend-to-stage:
    #!/usr/bin/env python
    import os
    import platform
    import subprocess
    import zipfile
    import tempfile
    import sys
    import shutil
    from pathlib import Path

    print("Deploying frontend to syftboxstage.openmined.org...")

    source_dir = Path("./src-frontend/out")
    dest_dir = "/home/azureuser/data/snapshot/tauquir@openmined.org/public/syftui"
    dest_zip_dir = str(Path(dest_dir).parent)

    try:
        # Create zip file using Python's zipfile module for cross-platform compatibility
        temp_dir = tempfile.gettempdir()
        zip_path = os.path.join(temp_dir, "out.zip")

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(source_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, source_dir)
                    zipf.write(file_path, arcname)

        # Check if we're on Windows
        if platform.system() == 'Windows':
            # Windows might not have scp/ssh installed by default
            # Check if they're available
            ssh_available = shutil.which('ssh') is not None
            scp_available = shutil.which('scp') is not None

            if not ssh_available or not scp_available:
                print(f"{{ _red }}Warning: SSH/SCP commands not found on Windows.{{ _nc }}")
                print("Please install OpenSSH client or ensure it's in your PATH.")
                print("You can install it via Windows Optional Features or use a tool like Git Bash.")
                sys.exit(1)

        # Continue with the deployment
        subprocess.run(['scp', zip_path, f'azureuser@syftbox-stage:{dest_zip_dir}/out.zip'], check=True)

        # Clean up local zip
        os.remove(zip_path)

        # SSH commands
        ssh_commands = [
            f'rm -rf {dest_dir}',
            f'mkdir -p {dest_dir}',
            f'cd {dest_zip_dir} && unzip -o out.zip -d {dest_dir}',
            f'rm {dest_zip_dir}/out.zip'
        ]

        for cmd in ssh_commands:
            subprocess.run(['ssh', 'azureuser@syftbox-stage', cmd], check=True)

        print(f"{{ _green }}Frontend deployment complete.{{ _nc }}")
    except subprocess.CalledProcessError as e:
        print(f"{{ _red }}Deployment failed with error code {e.returncode}{{ _nc }}")
        sys.exit(e.returncode)

# -------------------------------------------------- UTILITY COMMANDS -------------------------------------------------

# Update version numbers
[group('utils')]
update-version TARGET_TRIPLE="":
    #!/usr/bin/env python
    import json
    import re
    import subprocess
    from pathlib import Path

    target_triple = "{{ TARGET_TRIPLE }}"
    if not target_triple:
        # Get target triple
        rustc_output = subprocess.run(['rustc', '-Vv'], capture_output=True, text=True).stdout
        for line in rustc_output.splitlines():
            if 'host:' in line:
                target_triple = line.split('host:')[1].strip()
                break

    if not target_triple:
        print(f"{{ _red }}Failed to determine the target triple. Please check the Rust installation.{{ _nc }}")
        sys.exit(1)

    # Get versions
    with open('src-frontend/package.json') as f:
        frontend_version = json.load(f)['version']

    with open('src-tauri/tauri.conf.json') as f:
        desktop_version = json.load(f)['version']

    # Find and get daemon version
    daemon_path = next(Path('src-tauri/binaries').glob(f'syftbox_client-{target_triple}*'))
    daemon_output = subprocess.run([str(daemon_path), '--version'], capture_output=True, text=True).stdout
    daemon_version = re.search(r'version ([0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9]+)*)', daemon_output).group(1)

    # Get commit hash
    commit_hash = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip()

    print(f"{{ _green }}Frontend version:{{ _nc }} {frontend_version}")
    print(f"{{ _green }}Desktop version:{{ _nc }} {desktop_version}")
    print(f"{{ _green }}Daemon version:{{ _nc }} {daemon_version}")
    print(f"{{ _green }}Commit hash:{{ _nc }} {commit_hash}")

    # Update version.rs
    version_file = Path('src-tauri/src/version.rs')
    content = version_file.read_text()

    content = re.sub(r'(pub const DESKTOP_VERSION: &str = ).*', f'\\1"{desktop_version}";', content)
    content = re.sub(r'(pub const FRONTEND_VERSION: &str = ).*', f'\\1"{frontend_version}";', content)
    content = re.sub(r'(pub const DAEMON_VERSION: &str = ).*', f'\\1"{daemon_version}";', content)
    content = re.sub(r'(pub const COMMIT_HASH: &str = ).*', f'\\1"{commit_hash}";', content)

    version_file.write_text(content)

# Reset the dev environment.
[group('utils')]
reset:
    git submodule foreach --quiet --recursive git reset --hard
    git submodule deinit --all --force
    git clean -xfd
    echo "{{ _green }}Reset complete.{{ _nc }} Run {{ _red }}just setup{{ _nc }} to re-setup the dev environment."

# Configure the dev environment
[group('utils')]
setup skip_prerequisites="no":
    #!/usr/bin/env python
    import os
    import platform
    import subprocess
    import sys
    import shutil
    from pathlib import Path

    # Run prerequisites setup based on platform
    subprocess.run(['just', '_install-os-pre-requisites', '{{ skip_prerequisites }}'], check=True)

    print("\nInitializing submodules...")
    subprocess.run(['git', 'submodule', 'update', '--init', '--recursive', '--remote'], check=True)

    # Check and install Bun if needed
    if shutil.which('bun') is None:
        system = platform.system()
        print("Installing Bun...")

        if system == "Windows":
            # Bun install for Windows using PowerShell
            try:
                subprocess.run([
                    "powershell", "-Command",
                    "irm bun.sh/install.ps1 | iex"
                ], check=True)
            except subprocess.CalledProcessError:
                print(f"{{ _red }}Failed to install Bun using PowerShell. Please install manually:{{ _nc }}")
                print("https://bun.sh/docs/installation")
                sys.exit(1)
        else:
            # Unix-like systems (macOS, Linux)
            try:
                subprocess.run([
                    "curl", "-fsSL", "https://bun.sh/install", "|", "bash"
                ], shell=True, check=True)
            except subprocess.CalledProcessError:
                print(f"{{ _red }}Failed to install Bun. Please install manually:{{ _nc }}")
                print("https://bun.sh/docs/installation")
                sys.exit(1)

    # Check and install Rust if needed
    if shutil.which('rustup') is None:
        system = platform.system()
        print("Installing Rust...")

        if system == "Windows":
            # Rust install for Windows
            try:
                subprocess.run([
                    "powershell", "-Command",
                    "(New-Object Net.WebClient).DownloadFile('https://win.rustup.rs/x86_64', 'rustup-init.exe'); ./rustup-init.exe -y"
                ], check=True)
            except subprocess.CalledProcessError:
                print(f"{{ _red }}Failed to install Rust. Please install manually:{{ _nc }}")
                print("https://www.rust-lang.org/tools/install")
                sys.exit(1)
        else:
            # Unix-like systems (macOS, Linux)
            try:
                subprocess.run([
                    "curl", "--proto", "=https", "--tlsv1.2", "-sSf", "https://sh.rustup.rs", "|", "sh", "-s", "--", "-y"
                ], shell=True, check=True)
            except subprocess.CalledProcessError:
                print(f"{{ _red }}Failed to install Rust. Please install manually:{{ _nc }}")
                print("https://www.rust-lang.org/tools/install")
                sys.exit(1)

    print("Installing dependencies...")

    # Find bun executable
    bun_exec = shutil.which('bun')
    if not bun_exec:
        # Try common locations
        home = str(Path.home())
        possible_paths = [
            os.path.join(home, '.bun', 'bin', 'bun'),                 # Unix
            os.path.join(home, '.bun', 'bin', 'bun.exe'),             # Windows
            os.path.join(home, 'AppData', 'Local', 'bun', 'bun.exe')  # Windows
        ]

        for path in possible_paths:
            if os.path.exists(path):
                bun_exec = path
                break

        if not bun_exec:
            print(f"{{ _red }}Bun executable not found. Please ensure it's in your PATH.{{ _nc }}")
            sys.exit(1)

    # Install frontend dependencies
    subprocess.run([bun_exec, 'install', '--cwd', 'src-frontend'], check=True)

    # Setup pre-commit hooks
    bunx_exec = None
    if platform.system() == "Windows":
        bunx_exec = os.path.join(os.path.dirname(bun_exec), 'bunx.exe')
    else:
        bunx_exec = os.path.join(os.path.dirname(bun_exec), 'bunx')

    if not os.path.exists(bunx_exec):
        bunx_exec = bun_exec  # Use 'bun' directly with 'x' argument
        subprocess.run([bunx_exec, 'x', 'husky'], check=True)
    else:
        subprocess.run([bunx_exec, 'husky'], check=True)

    print(f"\n{{ _green }}Setup complete!{{ _nc }}")
    print(f"You can now run {{ _red }}just dev{{ _nc }} to start the frontend, server, and desktop app — all at once with hot-reloading.")

_install-os-pre-requisites skip_prerequisites="no":
    #!/usr/bin/env python
    import os
    import platform
    import subprocess
    import sys

    system = platform.system()

    if "{{ skip_prerequisites }}" == "no":
        if system == "Darwin":  # macOS
            # Check for Xcode Command Line Tools
            if not os.path.exists('/Library/Developer/CommandLineTools'):
                print(f"{{ _yellow }}Installing Xcode Command Line Tools{{ _nc }}")
                try:
                    # Create the file that triggers the CLT installation prompt
                    with open('/tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress', 'w'):
                        pass

                    # Find the latest Command Line Tools
                    result = subprocess.run(['softwareupdate', '-l'], capture_output=True, text=True)
                    clt_line = None
                    for line in result.stdout.splitlines():
                        if "Command Line" in line:
                            clt_line = line
                            break

                    if clt_line:
                        # Extract product name
                        product = clt_line.strip().split('* ')[1].strip()
                        # Install
                        subprocess.run(['softwareupdate', '-i', product, '--verbose'], check=True)
                    else:
                        print(f"{{ _red }}Command Line Tools not found in software update list{{ _nc }}")
                        print("Please install manually using 'xcode-select --install'")
                except Exception as e:
                    print(f"{{ _red }}Error installing Command Line Tools: {e}{{ _nc }}")
                    print("Please install manually using 'xcode-select --install'")

        elif system == "Windows":
            print(f"{{ _yellow }}Checking Windows dependencies...{{ _nc }}")

            # Check for required dependencies
            try:
                # WebView2 is needed for Tauri on Windows
                print(f"{{ _green }}Make sure you have Microsoft Edge WebView2 installed{{ _nc }}")
                print("You can download it from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/")

                # Microsoft Visual C++ Build Tools
                print(f"{{ _green }}Make sure you have Microsoft Visual C++ Build Tools installed{{ _nc }}")
                print("You can download it from: https://visualstudio.microsoft.com/visual-cpp-build-tools/")

            except Exception as e:
                print(f"{{ _red }}Error: {e}{{ _nc }}")
                print("Please install dependencies manually")

        elif system == "Linux":
            # Try to detect the distribution
            try:
                with open('/etc/os-release') as f:
                    os_info = {}
                    for line in f:
                        if '=' in line:
                            key, value = line.strip().split('=', 1)
                            os_info[key] = value.strip('"')

                distro = os_info.get('ID', '').lower()

                # Install dependencies based on distribution
                if distro in ['ubuntu', 'debian', 'pop', 'mint']:
                    print(f"{{ _green }}Detected {distro} distribution{{ _nc }}")
                    print(f"{{ _yellow }}Installing Tauri dependencies...{{ _nc }}")
                    deps = [
                        "libwebkit2gtk-4.0-dev", "build-essential", "curl", "wget", "file", 
                        "libssl-dev", "libgtk-3-dev", "libayatana-appindicator3-dev", "librsvg2-dev"
                    ]
                    cmd = ["sudo", "apt", "update", "&&", "sudo", "apt", "install", "-y"] + deps
                    print(" ".join(cmd))

                elif distro in ['fedora', 'rhel', 'centos']:
                    print(f"{{ _green }}Detected {distro} distribution{{ _nc }}")
                    print(f"{{ _yellow }}Installing Tauri dependencies...{{ _nc }}")
                    deps = [
                        "webkit2gtk3-devel", "openssl-devel", "curl", "wget", 
                        "file", "gtk3-devel", "libappindicator-gtk3-devel", 
                        "librsvg2-devel"
                    ]
                    cmd = ["sudo", "dnf", "install", "-y"] + deps
                    print(" ".join(cmd))

                elif distro in ['arch', 'manjaro']:
                    print(f"{{ _green }}Detected {distro} distribution{{ _nc }}")
                    print(f"{{ _yellow }}Installing Tauri dependencies...{{ _nc }}")
                    deps = [
                        "webkit2gtk", "base-devel", "curl", "wget", "openssl", 
                        "appmenu-gtk-module", "gtk3", "libappindicator-gtk3", 
                        "librsvg"
                    ]
                    cmd = ["sudo", "pacman", "-Syu", "--needed"] + deps
                    print(" ".join(cmd))

                else:
                    print(f"{{ _red }}Unsupported Linux distribution: {distro}{{ _nc }}")
                    print("Please install Tauri dependencies manually according to:")
                    print("https://tauri.app/start/prerequisites/#linux")

            except Exception as e:
                print(f"{{ _red }}Error detecting Linux distribution: {e}{{ _nc }}")
                print("Please install Tauri dependencies manually according to:")
                print("https://tauri.app/start/prerequisites/#linux")

        else:
            print(f"{{ _red }}Unsupported operating system: {system}{{ _nc }}")
            print("Please install Tauri dependencies manually according to:")
            print("https://tauri.app/start/prerequisites/#system-dependencies")
            sys.exit(1)

# Install the toolchain for SyftUI
[group('utils')]
setup-toolchain:
    #!/bin/sh
    set -eou pipefail

    check_cmd() {
        command -v "$1" > /dev/null 2>&1
        return $?
    }

    if ! check_cmd "bun"; then
        echo "{{ _cyan }}Installing Bun...{{ _nc }}"
        curl -fsSL https://bun.sh/install | bash
    else
        echo "{{ _cyan }}✅ Bun{{ _nc }}"
    fi

    if ! check_cmd "rustup"; then
        echo "{{ _yellow }}Installing Rust...{{ _nc }}"
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    else
        echo "{{ _cyan }}✅ Rust{{ _nc }}"
    fi

    if ! check_cmd "go"; then
        echo "Install go from: https://go.dev/doc/install"
    else
        echo "{{ _cyan }}✅ Go{{ _nc }}"
    fi

    echo "{{ _green }}Toolchain is ready!{{ _nc }}"
