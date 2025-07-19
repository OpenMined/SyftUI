# Type Definitions

This directory contains TypeScript type definitions for the project dependencies.

## Files

- `tauri.d.ts` - Main TypeScript declarations for all Tauri APIs
- `tauri-example.ts` - Example usage demonstrating how to use the types
- `react-grid-layout.d.ts` - Type definitions for react-grid-layout library
- `react-syntax-highlighter.d.ts` - Type definitions for react-syntax-highlighter library
- `css.d.ts` - Type definitions for CSS modules
- `README.md` - This documentation file

## Overview

The `tauri.d.ts` file provides comprehensive TypeScript type definitions for the Tauri framework's JavaScript API. It extends the global `Window` interface to include the `__TAURI__` property with all its associated APIs.

## Features

The type definitions cover all major Tauri APIs:

### Core APIs

- **Core API**: `window.__TAURI__.core` - For invoking backend commands
- **OS API**: `window.__TAURI__.os` - For operating system information
- **Window API**: `window.__TAURI__.window` - For window management
- **WebviewWindow API**: `window.__TAURI__.webviewWindow` - For webview window management
- **Event API**: `window.__TAURI__.event` - For event handling

### Utility APIs

- **Deep Link API**: `window.__TAURI__.deepLink` - For handling deep links
- **Opener API**: `window.__TAURI__.opener` - For opening paths and URLs
- **Log API**: `window.__TAURI__.log` - For logging messages

### System APIs

- **Path API**: `window.__TAURI__.path` - For path operations
- **Process API**: `window.__TAURI__.process` - For process management
- **Shell API**: `window.__TAURI__.shell` - For shell operations
- **App API**: `window.__TAURI__.app` - For app-level operations

### UI APIs

- **Clipboard API**: `window.__TAURI__.clipboard` - For clipboard operations
- **Dialog API**: `window.__TAURI__.dialog` - For system dialogs
- **Notification API**: `window.__TAURI__.notification` - For notifications
- **Global Shortcut API**: `window.__TAURI__.globalShortcut` - For global shortcuts
- **Menu API**: `window.__TAURI__.menu` - For menu management
- **Tray API**: `window.__TAURI__.tray` - For system tray

### Data APIs

- **File System API**: `window.__TAURI__.fs` - For file system operations
- **HTTP API**: `window.__TAURI__.http` - For HTTP requests
- **Updater API**: `window.__TAURI__.updater` - For app updates

## Usage

The types are automatically available in your TypeScript/JavaScript files when using the project's build system. The `window.__TAURI__` property is typed as optional since it's only available in Tauri environments.

### Basic Usage

```typescript
// Check if Tauri is available
if (typeof window !== "undefined" && window.__TAURI__) {
  // All Tauri APIs are now available with full type support
  const platform = window.__TAURI__.os.platform();
  console.log("Platform:", platform);
}
```

### Typed Events

```typescript
// Listen for typed events
window.__TAURI__.event.listen<{ message: string }>("notification", (event) => {
  // event.payload is typed as { message: string }
  console.log("Notification:", event.payload.message);
});
```

### Window Management

```typescript
// Window operations with type safety
const currentWindow = window.__TAURI__.window.getCurrentWindow();
await currentWindow.setTitle("My App");
await currentWindow.maximize();
```

### Backend Communication

```typescript
// Type-safe backend communication
const result = await window.__TAURI__.core.invoke<string>("get_user_data", {
  userId: 123,
});
// result is typed as string
```

## Type Safety

The type definitions provide:

- **Optional API Access**: `window.__TAURI__` is optional, preventing errors in non-Tauri environments
- **Generic Support**: Many APIs support generics for type-safe data handling
- **Comprehensive Coverage**: All major Tauri APIs are covered
- **IDE Support**: Full autocomplete and type checking in supported editors

## Examples

See `tauri-example.ts` for comprehensive examples of how to use the various APIs with proper typing.

## Development

When adding new Tauri APIs or updating existing ones:

1. Update the main `tauri.d.ts` file
2. Add examples to `tauri-example.ts`
3. Update this README if needed
4. Test the types work correctly with the build system

## Notes

- The types are designed to work with the project's TypeScript configuration
- All APIs are properly typed for development-time safety
- The definitions are compatible with the Tauri framework's JavaScript API
- Types are automatically included in the project's build process
