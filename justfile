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

_red := '\033[1;31m'
_cyan := '\033[1;36m'
_green := '\033[1;32m'
_yellow := '\033[1;33m'
_nc := '\033[0m'

# ---------------------------------------------------------------------------------------------------------------------

# List all commands.
default:
    just --list

# ---------------------------------------------------------------------------------------------------------------------

# Configure the dev environment. Enables building the app with source code from your local SyftBox repo using symlinks.
[group('utils')]
setup path_to_syftbox_repo="":
    #!/usr/bin/env bash
    set -e

    if [[ -n "{{ path_to_syftbox_repo }}" ]]; then
        dir_path="{{ path_to_syftbox_repo }}"
    else
        echo "Please enter the path to your local SyftBox repo:"
        read -e -p "SyftBox path: " dir_path
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

    # Check that the directory is the SyftBox repository
    remote_url=$(git -C "$dir_path" config --get remote.origin.url)
    if [[ "${remote_url}" != "git@github.com:OpenMined/syft.git" ]] && \
       [[ "${remote_url}" != "https://github.com/OpenMined/syft.git" ]]; then
        echo "Error: The specified directory is not the SyftBox repository." >&2
        exit 1
    fi

    # Create a symlink in the 'src' directory
    ln -snf "$dir_path/syftbox" src/syftbox

    echo -e "Symlink created successfully at ${_green}src/syftbox${_nc} pointing to ${_green}$dir_path/syftbox${_nc}"

    echo "Setup complete. You can now run 'just build' to build the project."
