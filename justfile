# Guidelines for new commands
# - Start with a verb
# - Keep it short (max. 3 words in a command)
# - Group commands by context. Include group name in the command name.
# - Mark things private that are util functions with [private] or _var
# - Don't over-engineer, keep it simple.
# - Don't break existing commands
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

# Check the code quality of the frontend, bridge and desktop app.
[group('code-quality:check')]
check:
    #!/usr/bin/env bash
    set -eu

    just check-frontend
    # just check-bridge
    just check-desktop

    echo -e "\n{{ _inverse }}{{ _green }}All code quality checks completed successfully.{{ _nc }}\n"

# Check the bridge server code quality.
[group('code-quality:check')]
check-bridge:
    #!/usr/bin/env bash
    set -eu

    just --justfile=src-syftgo/justfile run-checks
    echo -e "\n{{ _green }}SyftGo bridge server code quality check completed successfully.{{ _nc }}\n"

# Check the desktop app code quality.
[group('code-quality:check')]
check-desktop:
    #!/usr/bin/env bash
    set -eu

    cargo clippy --manifest-path ./src-tauri/Cargo.toml
    cargo fmt --manifest-path ./src-tauri/Cargo.toml --check

    echo -e "\n{{ _green }}Desktop app code quality check completed successfully.{{ _nc }}\n"

# Check the frontend code quality.
[group('code-quality:check')]
check-frontend:
    #!/usr/bin/env bash
    set -eu

    bun run --cwd src-frontend prettier --check .
    bun run --cwd src-frontend lint

    # TODO: Uncomment this once the type errors are fixed.
    # bun run --cwd src-frontend tsc --noEmit

    echo -e "\n{{ _green }}Frontend code quality check completed successfully.{{ _nc }}\n"

# ------------------------------------------------ CODE QUALITY FIXES -------------------------------------------------

# Tidy up the code of the frontend, bridge and desktop app.
[group('code-quality:tidy')]
tidy:
    #!/usr/bin/env bash
    set -eu

    just tidy-frontend
    # just tidy-bridge
    just tidy-desktop

    just --fmt --unstable  # Format the justfile as well
    echo -e "\n{{ _green }}Justfile formatted successfully.{{ _nc }}\n"
    echo -e "\n{{ _inverse }}{{ _green }}Code tidied up successfully.{{ _nc }}\n"

# Tidy up the bridge server code.
[group('code-quality:tidy')]
tidy-bridge:
    #!/usr/bin/env bash
    set -eu

    just --justfile=src-syftgo/justfile run-checks-and-fix
    echo -e "\n{{ _green }}SyftGo bridge server code tidied up successfully.{{ _nc }}\n"

# Tidy up the desktop app code.
[group('code-quality:tidy')]
tidy-desktop:
    #!/usr/bin/env bash
    set -eu

    cargo clippy --manifest-path ./src-tauri/Cargo.toml --fix --allow-staged
    cargo fmt --manifest-path ./src-tauri/Cargo.toml

    echo -e "\n{{ _green }}Desktop app code tidied up successfully.{{ _nc }}\n"

# Tidy up the frontend code.
[group('code-quality:tidy')]
tidy-frontend:
    #!/usr/bin/env bash
    set -eu

    bun run --cwd src-frontend prettier --write .
    bun run --cwd src-frontend lint --fix

    echo -e "\n{{ _green }}Frontend code tidied up successfully.{{ _nc }}\n"

# ---------------------------------------------------- DEV COMMANDS ---------------------------------------------------

# Run the frontend, bridge and desktop app concurrently.
[group('dev')]
dev:
    #!/usr/bin/env bash
    set -eu

    bunx concurrently \
        --kill-others \
        --success first \
        --prefix name \
        --names "  BRIDGE  , FRONTEND ,  DESKTOP " \
        --prefix-colors "red,yellow,green" \
        "just dev-bridge" "just dev-frontend" "just dev-desktop"

[group('dev')]
dev-bridge:
    #!/usr/bin/env bash
    set -eu

    # Need to use realpath due to a bug in air (https://github.com/air-verse/air/pull/742).
    cd $(realpath src-syftgo) && air -- --ui-port 8000 --ui-swagger

# Run the desktop dev app.
[group('dev')]
dev-desktop:
    #!/usr/bin/env bash
    set -eu

    bunx @tauri-apps/cli dev

# Run the frontend dev server.
[group('dev')]
dev-frontend:
    #!/usr/bin/env bash
    set -eu

    bun run --cwd src-frontend dev

# -------------------------------------------------- PACKAGE COMMANDS -------------------------------------------------

# Build the frontend, bridge and desktop app and package them into a single installable.
[group('package')]
package:
    #!/usr/bin/env bash
    set -eu

    just package-frontend desktop_build="yes"
    # just package-bridge
    just package-desktop

# Build the bridge and package it into a single installable.
[group('package')]
package-bridge:
    #!/usr/bin/env bash
    set -eu

    just --justfile=src-syftgo/justfile build-client-target

    # Copy the client binary to the bundle directory with the correct name.
    TARGET_TRIPLE=$(rustc -Vv | grep host | cut -f2 -d' ')
    if [[ -z "${TARGET_TRIPLE}" ]]; then
        echo -e "Failed to determine the target triple. Please check the Rust installation."
        exit 1
    fi

    EXTENSION=$(if [[ "$OSTYPE" == "win32" ]]; then echo ".exe"; else echo ""; fi)
    dst="src-tauri/target/binaries/syftbox_client-${TARGET_TRIPLE}${EXTENSION}"
    mkdir -p $(dirname "${dst}")
    cp src-syftgo/.out/syftbox_client_* "${dst}"

# Build the desktop app and package it into a single installable.
[group('package')]
package-desktop:
    #!/usr/bin/env bash
    set -eu

    # If this is github ci
    if [[ "${GITHUB_CI:-}" == "1" ]]; then
        CI=false TAURI_BUNDLER_DMG_IGNORE_CI=true bunx @tauri-apps/cli build
    else
        export TAURI_SIGNING_PRIVATE_KEY=dummy
        export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=dummy
        bunx @tauri-apps/cli build
        open ./src-tauri/target/release/bundle/dmg/
    fi

# Build the frontend and package it as a static site export.
[group('package')]
package-frontend desktop_build="no":
    #!/usr/bin/env bash
    set -eu

    if [[ "{{ desktop_build }}" != "no" ]]; then
        IS_DESKTOP_BUILD=1 bun run --cwd src-frontend build
    else
        bun run --cwd src-frontend build
    fi

# -------------------------------------------------- UTILITY COMMANDS -------------------------------------------------

# Reset the dev environment.
[group('utils')]
reset:
    #!/usr/bin/env bash
    set -eu

    # Deinit the submodules.
    echo "Deinitializing submodules..."

    # Check if all submodules are clean (no unstaged or staged changes)
    while IFS= read -r path; do
        if [[ -n "$(git -C "$path" status --porcelain)" ]]; then
        echo -e "Submodule {{ _red }}$path{{ _nc }} has unstaged or staged changes. Unable to deinitialize."
        echo -e "Manually clean the submodule and run {{ _red }}just reset{{ _nc }} again to continue.\n"
        exit 1
        fi
    done < <(git submodule --quiet foreach --recursive 'echo $sm_path')

    # All submodules are clean, deinitialize them
    git submodule deinit --all --force > /dev/null 2>&1

    echo "Removing generated files..."
    rm -rf src-frontend/.next
    rm -rf src-frontend/node_modules
    rm -rf src-frontend/out
    rm -rf src-frontend/next-env.d.ts
    rm -rf src-frontend/tsconfig.tsbuildinfo
    rm -rf src-tauri/gen
    rm -rf src-tauri/target

    echo -e "{{ _green }}Reset complete.{{ _nc }} Run {{ _red }}just setup{{ _nc }} to re-setup the dev environment."

# Configure the dev environment. Adds a symlink to your local SyftGo repo for ease in development.
[group('utils')]
setup skip_prerequisites="no":
    #!/usr/bin/env bash
    set -eu

    just _install-os-pre-requisites {{ skip_prerequisites }}

    echo -e "\nInitializing submodules..."
    git submodule update --init --recursive --remote

    if ! command -v bun &> /dev/null; then
        echo "Installing Bun"
        curl -fsSL https://bun.sh/install | bash
    fi

    if ! command -v rustup &> /dev/null; then
        echo "Installing Rust"
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    fi

    echo -e "Installing dependencies..."
    $HOME/.bun/bin/bun install --cwd src-frontend

    echo -e "Setting up pre-commit hooks..."
    $HOME/.bun/bin/bunx husky

    echo -e "\n{{ _green }}Setup complete!{{ _nc }}\nYou can now run {{ _red }}just dev{{ _nc }} to start the frontend, server, and desktop app — all at once with hot-reloading."

_install-os-pre-requisites skip_prerequisites="no":
    #!/usr/bin/env bash
    set -eu

    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [[ $(xcode-select -p &> /dev/null; echo $?) -ne 0 ]]; then
            echo "Installing Xcode Command Line Tools"
            touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress;
            PROD=$(softwareupdate -l | grep "\*.*Command Line" | tail -n 1 | sed 's/^[^C]* //')
            softwareupdate -i "$PROD" --verbose;
        fi
    elif [[ "{{ skip_prerequisites }}" == "no" ]]; then
        # KEEP THIS AT THE TOP OF THIS BLOCK. This gets the current line number.
        line_number=$(grep -n 'UNIQUE_WORD_TO_MATCH_MYSELF_HERE_IN_GREP_COMMAND' justfile | cut -d: -f1 | head -n 1)

        echo "Your OS is not supported by this script at the moment. Please manually install the"
        echo -e "OS dependencies for Tauri from" \
             "{{ _blue }}https://tauri.app/start/prerequisites/#system-dependencies{{ _nc }}."
        echo -e "After that run the {{ _red }}just setup skip_prerequisites=yes{{ _nc }} command."

        echo -e "Also, please add it to the {{ _red }}justfile:$((line_number - 2)){{ _nc }} as well for future use.\n"
        exit 1
    fi

_create-syftgo-symlink path_to_syftgo_repo="":
    #!/usr/bin/env bash
    set -eu

    if [[ -n "{{ path_to_syftgo_repo }}" ]]; then
        dir_path="{{ path_to_syftgo_repo }}"
    else
        while true; do
            read -e -p "Do you already have a SyftGo repo cloned locally? (y/n): " already_cloned
            if [[ "$already_cloned" == "y" ]]; then
                echo "Please enter the path to your local SyftGo repo:"
            read -e -p "SyftGo path: " dir_path
        elif [[ "$already_cloned" == "n" ]]; then
            # Clone the SyftGo repo
            dir_path="../syftgo"
            git clone git@github.com:yashgorana/syftgo.git $dir_path
            echo -e "Cloned SyftGo repo at {{ _green }}$(realpath ${dir_path}){{ _nc }}"
        else
                echo "Invalid input. Please enter 'y' or 'n'."
                continue
            fi
        done
    fi

    # Resolve the absolute path
    dir_path=$(realpath "${dir_path/#\~/$HOME}")

    # Validate that the directory exists
    if [ ! -d "$dir_path" ]; then
        echo "Error: The specified directory does not exist." >&2
        exit 1
    fi

    # Check that the directory is a git repository
    if [ ! -d "$dir_path/.git" ]; then
        echo "Error: The specified directory is not a git repository." >&2
        exit 1
    fi

    # Check that the directory is the SyftGo repository
    remote_url=$(git -C "$dir_path" config --get remote.origin.url)
    if [[ "${remote_url}" != "git@github.com:yashgorana/syftgo.git" ]] && \
       [[ "${remote_url}" != "https://github.com/yashgorana/syftgo.git" ]]; then
        echo "Error: The specified directory is not the SyftGo repository." >&2
        exit 1
    fi

    # convert the path to a relative path (using perl one-liner, as it is available almost everywhere)
    dir_path=$(perl -le 'use File::Spec; print File::Spec->abs2rel(@ARGV)' `realpath "$dir_path"` .)

    # Create a symlink at 'src-syftgo' directory
    ln -snf "$dir_path" src-syftgo

    echo -e "Symlink created successfully at {{ _green }}src-syftgo{{ _nc }} pointing to {{ _green }}$dir_path/{{ _nc }}"
