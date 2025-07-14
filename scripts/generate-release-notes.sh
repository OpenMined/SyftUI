#!/bin/bash

# Get the latest tag
v=$(git tag --list | sort -V | tail -n 1)

# Get the previous tag
prev_v=$(git tag --list | sort -V | tail -n 2 | head -n 1)

# Collect SyftUI commits
syftui_commits=$(git --no-pager log --pretty=format:'%B' "$prev_v".."$v")

# Collect Daemon commit hashes and logs
daemon_diff=$(git --no-pager diff "$prev_v".."$v" -- src-daemon)
if [ -n "$daemon_diff" ]; then
    read h1 h2 < <(echo "$daemon_diff" | tail -n 2 | awk '{print $3}')
    daemon_commits=$(cd src-daemon && git --no-pager log --pretty=format:'%B' "$h1".."$h2")
else
    daemon_commits=""
fi

# Compose the full prompt
prompt_template=$(cat << EOM
You are a release note generator for a desktop application project called SyftBox.

Here are the commit messages since the last version ($prev_v):

$syftui_commits

$daemon_commits

Write a concise, user-friendly release note for $v with:
- A high-level overview of the release.
- Grouped and bulleted highlights under clear sections.
- Plain English; minimal jargon.
- Emojis or unicode icons per section title.
- Keep it in the same tone and style as these past examples:

---

### 🌙 Release Notes — Version [0.1.14]

This update delivers a smoother, more polished experience with dynamic theming, smarter binary packaging, and critical fixes across the client and server stack.

#### 🎨 UI & Theming

* **Dynamic theme switching is here!** The window now responds to theme changes from within the interface.
* **Added SyftBox directory icon on macOS** for a more native feel.

#### 🛠️ Platform & Runtime Improvements

* **Daemon sidecar now launched in its own process group**, preventing orphaned child processes on shutdown.
* **No more extra console windows on Windows** in release builds—SyftBox is now cleaner and more seamless.
* **Platform-specific binaries now downloaded during packaging**, reducing repository bloat and keeping build outputs lean.

#### 🧱 SyftBox Daemon & Sync Fixes

* **Fixed full remote delete bug** in sync logic—preventing unintended data loss in edge cases.
* **Old configs now handled gracefully**, improving backward compatibility.
* **Cleaner config loading and validation**, including proper detection and version dumping.

#### 🌐 Server Fixes & Enhancements

* **Fixed CSV parse error** during app install.
* **Resolved CSP (Content Security Policy) issue** affecting embedded interfaces.

---
EOM
)

echo -e "\033[1;36mGenerating release notes for the below new commits since $prev_v\033[0m" >&2

echo -e "\n\033[1;33m=== SyftUI commits ===\033[0m" >&2
if [ -n "$syftui_commits" ]; then
    echo "$syftui_commits" >&2
else
    echo "<No SyftUI commits>" >&2
fi

echo -e "\n\033[1;33m=== Daemon commits ===\033[0m" >&2
if [ -n "$daemon_commits" ]; then
    echo "$daemon_commits" >&2
else
    echo "<No Daemon commits>" >&2
fi

# Ensure OPENROUTER_API_KEY is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "Error: Please set OPENROUTER_API_KEY environment variable." >&2
    exit 1
fi

# Call OpenRouter API with prompt
# Create a temporary file for the JSON payload to avoid escaping issues
json_payload=$(cat << EOF
{
    "model": "openai/gpt-4-turbo",
    "messages": [
        {
            "role": "system",
            "content": "You are a release note generator for a desktop application project called SyftBox."
        },
        {
            "role": "user",
            "content": $(echo "$prompt_template" | jq -Rs .)
        }
    ]
}
EOF
)

response=$(curl -s https://openrouter.ai/api/v1/chat/completions \
    -H "Authorization: Bearer $OPENROUTER_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$json_payload")

# Extract and print content
echo -e "\n\033[1;36mGenerated release notes:\033[0m" >&2

# Debug: Check if response is valid JSON
if ! echo "$response" | jq empty 2>/dev/null; then
    echo "Error: Invalid JSON response from API" >&2
    echo "Response: $response" >&2
    exit 1
fi

# Check if there's an error in the response
if echo "$response" | jq -e '.error' >/dev/null 2>&1; then
    echo "API Error: $(echo "$response" | jq -r '.error.message')" >&2
    exit 1
fi

# Extract and print content
content=$(echo "$response" | jq -r '.choices[0].message.content // empty')
if [ -z "$content" ]; then
    echo "Error: No content in API response" >&2
    echo "Full response: $response" >&2
    exit 1
fi

echo "$content"
