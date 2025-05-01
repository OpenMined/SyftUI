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

[private]
_red := '\033[1;31m'
[private]
_cyan := '\033[1;36m'
[private]
_blue := '\033[1;34m'
[private]
_green := '\033[1;32m'
[private]
_yellow := '\033[1;33m'
[private]
_inverse := '\033[7m'
[private]
_nc := '\033[0m'

# ---------------------------------------------------------------------------------------------------------------------

# List all commands.
default:
    just --list

# ------------------------------------------------ CODE QUALITY CHECKS ------------------------------------------------

# Check the code quality of the frontend, daemon and desktop app.
[group('code-quality:check')]
check:
    #!/usr/bin/env python
    import os
    import sys
    import subprocess

    try:
        subprocess.run(['just', 'check-frontend'], check=True)
        # subprocess.run(['just', 'check-daemon'], check=True)
        subprocess.run(['just', 'check-desktop'], check=True)

        print(f"\n{{ _inverse }}{{ _green }}All code quality checks completed successfully.{{ _nc }}\n")
    except subprocess.CalledProcessError as e:
        print(f"\n{{ _red }}Check failed with error code {e.returncode}{{ _nc }}")
        sys.exit(e.returncode)

# Check the daemon code quality.
[group('code-quality:check')]
check-daemon:
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(['just', '--justfile=src-daemon/justfile', 'run-checks'], check=True)
        print(f"\n{{ _green }}Daemon code quality check completed successfully.{{ _nc }}\n")
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Check the desktop app code quality.
[group('code-quality:check')]
check-desktop:
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(['cargo', 'clippy', '--manifest-path', './src-tauri/Cargo.toml'], check=True)
        subprocess.run(['cargo', 'fmt', '--manifest-path', './src-tauri/Cargo.toml', '--check'], check=True)
        print(f"\n{{ _green }}Desktop app code quality check completed successfully.{{ _nc }}\n")
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Check the frontend code quality.
[group('code-quality:check')]
check-frontend:
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(['bun', 'run', '--cwd', 'src-frontend', 'prettier', '--check', '.'], check=True)
        subprocess.run(['bun', 'run', '--cwd', 'src-frontend', 'lint'], check=True)

        # TODO: Uncomment this once the type errors are fixed.
        # subprocess.run(['bun', 'run', '--cwd', 'src-frontend', 'tsc', '--noEmit'], check=True)

        print(f"\n{{ _green }}Frontend code quality check completed successfully.{{ _nc }}\n")
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# ------------------------------------------------ CODE QUALITY FIXES -------------------------------------------------

# Tidy up the code of the frontend, daemon and desktop app.
[group('code-quality:tidy')]
tidy:
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(['just', 'tidy-frontend'], check=True)
        # subprocess.run(['just', 'tidy-daemon'], check=True)
        subprocess.run(['just', 'tidy-desktop'], check=True)
        subprocess.run(['just', '--fmt', '--unstable'], check=True)  # Format the justfile as well

        print(f"\n{{ _green }}Justfile formatted successfully.{{ _nc }}")
        print(f"\n{{ _inverse }}{{ _green }}Code tidied up successfully.{{ _nc }}\n")
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Tidy up the daemon code.
[group('code-quality:tidy')]
tidy-daemon:
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(['just', '--justfile=src-daemon/justfile', 'run-checks-and-fix'], check=True)
        print(f"\n{{ _green }}Daemon code tidied up successfully.{{ _nc }}\n")
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Tidy up the desktop app code.
[group('code-quality:tidy')]
tidy-desktop:
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(['cargo', 'clippy', '--manifest-path', './src-tauri/Cargo.toml',
                       '--fix', '--allow-staged'], check=True)
        subprocess.run(['cargo', 'fmt', '--manifest-path', './src-tauri/Cargo.toml'], check=True)
        print(f"\n{{ _green }}Desktop app code tidied up successfully.{{ _nc }}\n")
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Tidy up the frontend code.
[group('code-quality:tidy')]
tidy-frontend:
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(['bun', 'run', '--cwd', 'src-frontend', 'prettier', '--write', '.'], check=True)
        subprocess.run(['bun', 'run', '--cwd', 'src-frontend', 'lint', '--fix'], check=True)
        print(f"\n{{ _green }}Frontend code tidied up successfully.{{ _nc }}\n")
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# ---------------------------------------------------- DEV COMMANDS ---------------------------------------------------

# Run the frontend, daemon and desktop app concurrently.
[group('dev')]
dev:
    #!/usr/bin/env python
    import os
    import platform
    import subprocess
    import sys

    env = os.environ.copy()
    env.update({
        "DAEMON_HOST": "localhost",
        "DAEMON_PORT": "7938",  # 7938 is the vanity number for SYFT in T9 keypad config 😎
        "DAEMON_TOKEN": "SYFTBOX_DEV_DUMMY_TOKEN_32_CHARS"
    })

    try:
        subprocess.run([
            "bunx", "concurrently",
            "--kill-others",
            "--success", "first",
            "--prefix", "name",
            "--names", "  DAEMON , FRONTEND ,  DESKTOP ",
            "--prefix-colors", "red,yellow,green",
            "just dev-daemon", "just dev-frontend", "just dev-desktop"
        ], env=env, check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

[group('dev')]
dev-daemon:
    #!/usr/bin/env python
    import os
    import subprocess
    import sys
    from pathlib import Path

    http_addr = f"{os.environ.get('DAEMON_HOST', 'localhost')}:{os.environ.get('DAEMON_PORT', '7938')}"

    try:
        os.chdir('src-daemon')
        cmd = [
            f"{Path.home()}/go/bin/air",
            "--",
            "daemon",
            "--http-addr", http_addr,
            "--http-token", os.environ.get("DAEMON_TOKEN", "SYFTBOX_DEV_DUMMY_TOKEN_32_CHARS"),
            "--http-swagger"
        ]
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Run the desktop dev app.
[group('dev')]
dev-desktop:
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(["bunx", "@tauri-apps/cli", "dev"], check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Run the frontend dev server.
[group('dev')]
dev-frontend:
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(["bun", "run", "--cwd", "src-frontend", "dev"], check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# -------------------------------------------------- PACKAGE COMMANDS -------------------------------------------------

# Build the frontend, daemon and desktop app and package them into a single installable.
[group('package')]
package TARGET_TRIPLE="":
    #!/usr/bin/env python
    import subprocess
    import sys

    try:
        subprocess.run(["just", "package-frontend", "desktop_build=yes"], check=True)
        subprocess.run(["just", "package-daemon", "{{ TARGET_TRIPLE }}"], check=True)
        subprocess.run(["just", "update-version", "{{ TARGET_TRIPLE }}"], check=True)
        subprocess.run(["just", "package-desktop", "{{ TARGET_TRIPLE }}"], check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

# Build the daemon and package it into a single installable.
[group('package')]
package-daemon TARGET_TRIPLE="":
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
            subprocess.run(['just', '--justfile=src-daemon/justfile', 'build-client-target', 'darwin', 'arm64'], check=True)
        elif target_triple == "x86_64-apple-darwin":
            subprocess.run(['just', '--justfile=src-daemon/justfile', 'build-client-target', 'darwin', 'amd64'], check=True)
        else:
            # The command will automatically determine the target triple
            subprocess.run(['just', '--justfile=src-daemon/justfile', 'build-client-target'], check=True)

        # Determine extension
        extension = '.exe' if platform.system() == 'Windows' else ''

        # Copy the binary
        dst = Path("src-tauri/target/binaries") / f"syftboxd-{target_triple}{extension}"
        dst.parent.mkdir(parents=True, exist_ok=True)

        # Find and copy the client binary
        client_files = list(Path('src-daemon/.out').glob('syftbox_client_*'))
        if not client_files:
            print(f"{{ _red }}No client binary found in src-daemon/.out{{ _nc }}")
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
        cmd = ['bunx', '@tauri-apps/cli', 'build', "--config", "src-tauri/tauri.conf.release-extras.json"]
        if env.get('GITHUB_CI') == '1':
            env['CI'] = 'false'
            env['TAURI_BUNDLER_DMG_IGNORE_CI'] = 'true'
            cmd += ["--ci", "--target", target_triple]
        else:
            env['TAURI_SIGNING_PRIVATE_KEY'] = 'dummy'
            env['TAURI_SIGNING_PRIVATE_KEY_PASSWORD'] = 'dummy'
        subprocess.run(cmd, env=env, check=True)
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

# Generate and upload release.json
[group('utils')]
generate-release-json version upload="no":
    #!/usr/bin/env python
    import json
    import requests
    import subprocess
    import sys
    from typing import Dict, Any

    def run_command(cmd: str) -> str:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error running command: {cmd}")
            print(f"Error: {result.stderr}")
            sys.exit(1)
        return result.stdout.strip()

    version = "{{ version }}"

    release_info = run_command(f"gh release view {version} --json assets,body,createdAt,publishedAt,tagName")
    release_info = json.loads(release_info)
    asset_name_to_url_map = {asset['name']: asset['url'] for asset in release_info['assets']}

    platform_to_assets_map = {
        "darwin-aarch64": {
            "url": "SyftBox-aarch64-apple-darwin.app.tar.gz",
            "signature": "SyftBox-aarch64-apple-darwin.app.tar.gz.sig"
        },
        "darwin-x86_64": {
            "url": "SyftBox-x86_64-apple-darwin.app.tar.gz",
            "signature": "SyftBox-x86_64-apple-darwin.app.tar.gz.sig"
        },
        "windows-x86_64": {
            "url": "SyftBox-x86_64-pc-windows-msvc.msi",
            "signature": "SyftBox-x86_64-pc-windows-msvc.msi.sig"
        },
        "linux-x86_64": {
            "url": "SyftBox-x86_64-unknown-linux-gnu.AppImage",
            "signature": "SyftBox-x86_64-unknown-linux-gnu.AppImage.sig"
        }
    }

    platforms = {}
    for platform, assets in platform_to_assets_map.items():
        # if both url and signature are present, add them to the platforms dict
        if not assets['url'] in asset_name_to_url_map:
            print(f"Skipping {platform} because the URL \"{assets['url']}\" is not present in the release assets.")
        elif not assets['signature'] in asset_name_to_url_map:
            print(f"Skipping {platform} because the signature file \"{assets['signature']}\" is not present in the release assets.")
        else:
            asset_url = asset_name_to_url_map[assets['url']]

            signature_url = asset_name_to_url_map[assets['signature']]
            signature_response = requests.get(signature_url)
            if signature_response.status_code != 200:
                print(f"{{ _red }}Failed to download signature file from {signature_url}. Skipping {platform} from release.json...{{ _nc }}")
                continue
            signature_content = signature_response.text

            platforms[platform] = {
                "signature": signature_content,
                "url": asset_url,
            }

    if len(platforms) == 0:
        print(f"{{ _red }}Generation of release.json failed because no valid platforms were found in the release assets.{{ _nc }}")
        sys.exit(1)

    data = {
        "version": version,
        "notes": release_info['body'],
        "pub_date": release_info.get('publishedAt') or release_info.get('createdAt'),
        "platforms": platforms
    }

    json_data = json.dumps(data, indent=2)
    print(f"{{ _green }}Generated release.json:{{ _nc }}")
    print(json_data)

    with open('release.json', 'w') as f:
        f.write(json_data)

    if "{{ upload }}" == "yes":
        print(f"{{ _green }}Uploading release.json to GitHub...{{ _nc }}")
        run_command(f"gh release upload {version} release.json --clobber")
        print(f"{{ _green }}Release.json uploaded successfully.{{ _nc }}")

        # remove all the .sig files from the release
        sig_files = [asset for asset in release_info['assets'] if asset['name'].endswith('.sig')]
        for sig_file in sig_files:
            run_command(f"gh release delete-asset -y {version} {sig_file['name']}")
            print(f"{{ _green }}Deleted {sig_file['name']} from the release.{{ _nc }}")

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
    daemon_path = next(Path('src-tauri/target/binaries').glob(f'syftboxd-{target_triple}*'))
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
    #!/usr/bin/env python
    import os
    import subprocess
    import shutil
    import sys
    from pathlib import Path

    print("Deinitializing submodules...")

    # Check if all submodules are clean
    result = subprocess.run(['git', 'submodule', 'foreach', '--quiet', '--recursive', 'git', 'status', '--porcelain'],
                           capture_output=True, text=True)

    if result.stdout.strip():
        print(f"{{ _red }}Some submodules have unstaged or staged changes. Unable to deinitialize.{{ _nc }}")
        print("Manually clean the submodules and run 'just reset' again to continue.")
        sys.exit(1)

    # Deinitialize submodules
    subprocess.run(['git', 'submodule', 'deinit', '--all', '--force'],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print("Removing generated files...")
    dirs_to_remove = [
        'src-frontend/.next',
        'src-frontend/node_modules',
        'src-frontend/out',
        'src-frontend/next-env.d.ts',
        'src-frontend/tsconfig.tsbuildinfo',
        'src-tauri/gen',
        'src-tauri/target'
    ]

    for dir_path in dirs_to_remove:
        path = Path(dir_path)
        if path.exists():
            if path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
            else:
                path.unlink()

    print(f"{{ _green }}Reset complete.{{ _nc }} Run {{ _red }}just setup{{ _nc }} to re-setup the dev environment.")

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
                    "curl -fsSL https://bun.sh/install | bash"
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
                    "curl --proto =https --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
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

    # TODO: Install the daemon's toolchain
    # subprocess.run(['just', '--justfile', 'src-daemon/justfile', 'setup-toolchain'], check=True)

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
                        "libwebkit2gtk-4.1-dev", "build-essential", "curl", "wget",
                        "file", "libxdo-dev", "libssl-dev",
                        "libayatana-appindicator3-dev", "librsvg2-dev"
                    ]
                    cmd = ["sudo", "apt", "update", "&&", "sudo", "apt", "install", "-y"] + deps
                    cmd = " ".join(cmd)
                    print(cmd)
                    subprocess.run(cmd, shell=True, check=True)

                elif distro in ['fedora', 'rhel', 'centos']:
                    print(f"{{ _green }}Detected {distro} distribution{{ _nc }}")
                    print(f"{{ _yellow }}Installing Tauri dependencies...{{ _nc }}")
                    deps = [
                        "webkit2gtk4.1-devel", "openssl-devel", "curl", "wget",
                        "file", "libappindicator-gtk3-devel", "librsvg2-devel"
                    ]
                    cmd = ["sudo", "dnf", "install", "-y"] + deps
                    cmd = " ".join(cmd)
                    print(cmd)
                    subprocess.run(cmd, shell=True, check=True)

                elif distro in ['arch', 'manjaro']:
                    print(f"{{ _green }}Detected {distro} distribution{{ _nc }}")
                    print(f"{{ _yellow }}Installing Tauri dependencies...{{ _nc }}")
                    deps = [
                        "webkit2gtk-4.1", "base-devel", "curl", "wget", "file",
                        "openssl", "appmenu-gtk-module", "libappindicator-gtk3",
                        "librsvg"
                    ]
                    cmd = ["sudo", "pacman", "-Syu", "--needed"] + deps
                    cmd = " ".join(cmd)
                    print(cmd)
                    subprocess.run(cmd, shell=True, check=True)

                else:
                    print(f"{{ _red }}Unsupported Linux distribution: {distro}{{ _nc }}")
                    print("Please install Tauri dependencies manually according to:")
                    print("https://tauri.app/start/prerequisites/#linux")

            except Exception as e:
                print(f"{{ _red }}Error installing Linux OS dependencies for Tauri: {e}{{ _nc }}")
                print("Please install Tauri dependencies manually according to:")
                print("https://tauri.app/start/prerequisites/#linux")

        else:
            print(f"{{ _red }}Unsupported operating system: {system}{{ _nc }}")
            print("Please install Tauri dependencies manually according to:")
            print("https://tauri.app/start/prerequisites/#system-dependencies")
            sys.exit(1)
