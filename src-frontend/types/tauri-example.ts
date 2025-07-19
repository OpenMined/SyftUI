// Example usage of Tauri types
// This file demonstrates how to use the Tauri API types
import type {} from "./tauri.d.ts";

// Basic type checking example
if (typeof window !== "undefined" && window.__TAURI__) {
  // OS API - Get platform information
  const platform = window.__TAURI__.os.platform();
  console.log("Platform:", platform);

  // Window API - Get current window
  const currentWindow = window.__TAURI__.window.getCurrentWindow();
  currentWindow.setTitle("My App");

  // WebviewWindow API - Get current webview window
  const webviewWindow =
    window.__TAURI__.webviewWindow.getCurrentWebviewWindow();
  webviewWindow.maximize();

  // Event API - Listen for events
  window.__TAURI__.event.listen("custom-event", (event) => {
    console.log("Event payload:", event.payload);
  });

  // Core API - Invoke backend commands
  window.__TAURI__.core.invoke<string>("get_app_version").then((version) => {
    console.log("App version:", version);
  });

  // Deep Link API - Handle deep links
  window.__TAURI__.deepLink.getCurrent().then((urls) => {
    console.log("Deep link URLs:", urls);
  });

  // Opener API - Open URLs or paths
  window.__TAURI__.opener.openPath("https://example.com");

  // Log API - Log messages
  window.__TAURI__.log.info("Application started");
  window.__TAURI__.log.error("Something went wrong");

  // Dialog API - Show dialogs
  window.__TAURI__.dialog.message("Hello from Tauri!");

  // File System API - File operations
  window.__TAURI__.fs.readTextFile("/path/to/file.txt").then((content) => {
    console.log("File content:", content);
  });
}

// Example of using typed event handlers
function setupEventHandlers() {
  if (typeof window !== "undefined" && window.__TAURI__) {
    // Typed event listener
    window.__TAURI__.event.listen<{ message: string }>(
      "notification",
      (event) => {
        // event.payload is now typed as { message: string }
        console.log("Notification:", event.payload.message);
      },
    );

    // Window event listeners
    const currentWindow = window.__TAURI__.window.getCurrentWindow();
    currentWindow.listen("tauri://resize", () => {
      console.log("Window resized");
    });
  }
}

// Example of using position and size types
function createWindow() {
  if (typeof window !== "undefined" && window.__TAURI__) {
    const { LogicalSize, LogicalPosition } = window.__TAURI__.window;

    // Create typed size and position
    const size = new LogicalSize(800, 600);
    const position = new LogicalPosition(100, 100);

    const currentWindow = window.__TAURI__.window.getCurrentWindow();
    currentWindow.setSize(size);
    currentWindow.setPosition(position);
  }
}

export { setupEventHandlers, createWindow };
