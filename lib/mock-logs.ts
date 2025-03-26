interface Log {
    timestamp: string
    app: string
    level: "debug" | "info" | "warning" | "error"
    message: string
}



export const mockLogs: Log[] = [
    {
        timestamp: "2025-03-26T07:50:40.790Z",
        app: "System",
        level: "info",
        message: `Client metadata
{
  "client_config": {
    "data_dir": "/Users/tauquir/SyftBoxStage",
    "server_url": "https://syftboxstage.openmined.org/",
    "client_url": "http://127.0.0.1:8080/",
    "email": "tauquir@openmined.org",
    "token": "0",
    "client_timeout": 5.0
  },
  "client_syftbox_version": "0.3.5",
  "python_version": "3.13.0 (main, Oct 16 2024, 08:05:40) [Clang 18.1.8 ]",
  "platform": "macOS-15.3.2-arm64-arm-64bit-Mach-O",
  "timestamp": "2025-03-26T02:33:06.316365Z",
  "env": {
    "DISABLE_ICONS": false,
    "CLIENT_CONFIG_PATH": "/Users/tauquir/.syftbox/config.json"
  }
}`
    },
    {
        timestamp: "2025-03-26T07:50:41.963Z",
        app: "system",
        level: "info",
        message: "Started SyftBox"
    },
    {
        timestamp: "2025-03-26T07:50:42.040Z",
        app: "System",
        level: "info",
        message: "Sync started, syncing every 1 seconds"
    },
    {
        timestamp: "2025-03-26T07:50:42.040Z",
        app: "system",
        level: "info",
        message: "Starting local server on http://127.0.0.1:8080/"
    },
    {
        timestamp: "2025-03-26T07:50:42.040Z",
        app: "System",
        level: "info",
        message: "Default apps directory not found: /Users/tauquir/.local/share/uv/tools/syftbox/lib/python3.13/site-packages/default_apps"
    },
    {
        timestamp: "2025-03-26T07:50:42.690Z",
        app: "System",
        level: "debug",
        message: "Health check succeeded, server is available."
    },
    {
        timestamp: "2025-03-26T07:50:44.077Z",
        app: "System",
        level: "debug",
        message: "Syncing 142 datasites"
    },
    {
        timestamp: "2025-03-26T07:50:44.101Z",
        app: "System",
        level: "info",
        message: "Downloading 0 files in batch"
    },
    {
        timestamp: "2025-03-26T07:50:46.386Z",
        app: "System",
        level: "debug",
        message: "Syncing 142 datasites"
    }
]
