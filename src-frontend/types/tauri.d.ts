// Tauri API type definitions for window.__TAURI__

export {};

declare global {
  interface Window {
    __TAURI__?: {
      // Core API
      core: {
        invoke: <T = unknown>(
          cmd: string,
          args?: Record<string, unknown>,
        ) => Promise<T>;
        transformCallback: (
          callback?: (response: unknown) => void,
          once?: boolean,
        ) => number;
        Channel: new <T = unknown>() => {
          id: number;
          onmessage: (handler: (response: T) => void) => () => void;
          toJSON: () => string;
        };
      };

      // OS API
      os: {
        platform: () =>
          | "linux"
          | "darwin"
          | "ios"
          | "freebsd"
          | "dragonfly"
          | "netbsd"
          | "openbsd"
          | "solaris"
          | "android"
          | "windows";
        version: () => Promise<string>;
        type: () => Promise<string>;
        arch: () => Promise<string>;
        tempdir: () => Promise<string>;
      };

      // Window API
      window: {
        getCurrent: () => TauriWindow;
        getCurrentWindow: () => TauriWindow;
        getByLabel: (label: string) => TauriWindow | null;
        getCursorPosition: () => Promise<PhysicalPosition>;
        Window: typeof TauriWindow;
        LogicalSize: typeof LogicalSize;
        PhysicalSize: typeof PhysicalSize;
        LogicalPosition: typeof LogicalPosition;
        PhysicalPosition: typeof PhysicalPosition;
      };

      // WebviewWindow API
      webviewWindow: {
        getCurrent: () => TauriWebviewWindow;
        getCurrentWebviewWindow: () => TauriWebviewWindow;
        getByLabel: (label: string) => TauriWebviewWindow | null;
        WebviewWindow: typeof TauriWebviewWindow;
      };

      // Event API
      event: {
        emit: (event: string, payload?: unknown) => Promise<void>;
        emitTo: (
          target: string | TauriWindow,
          event: string,
          payload?: unknown,
        ) => Promise<void>;
        listen: <T = unknown>(
          event: TauriEvent | string,
          handler: (event: TauriEventPayload<T>) => void,
        ) => Promise<() => void>;
        once: <T = unknown>(
          event: TauriEvent | string,
          handler: (event: TauriEventPayload<T>) => void,
        ) => Promise<() => void>;
      };

      // Deep Link API
      deepLink: {
        getCurrent: () => Promise<string[]>;
        onOpenUrl: (handler: (urls: string[]) => void) => Promise<void>;
      };

      // Opener API
      opener: {
        openPath: (path: string) => Promise<void>;
        openUrl: (url: string) => Promise<void>;
      };

      // Log API
      log: {
        debug: (message: string) => Promise<void>;
        error: (message: string) => Promise<void>;
        info: (message: string) => Promise<void>;
        trace: (message: string) => Promise<void>;
        warn: (message: string) => Promise<void>;
      };

      // Path API
      path: {
        appCacheDir: () => Promise<string>;
        appConfigDir: () => Promise<string>;
        appDataDir: () => Promise<string>;
        appLocalDataDir: () => Promise<string>;
        appLogDir: () => Promise<string>;
        audioDir: () => Promise<string>;
        cacheDir: () => Promise<string>;
        configDir: () => Promise<string>;
        dataDir: () => Promise<string>;
        desktopDir: () => Promise<string>;
        documentDir: () => Promise<string>;
        downloadDir: () => Promise<string>;
        executableDir: () => Promise<string>;
        fontDir: () => Promise<string>;
        homeDir: () => Promise<string>;
        localDataDir: () => Promise<string>;
        pictureDir: () => Promise<string>;
        publicDir: () => Promise<string>;
        resourceDir: () => Promise<string>;
        runtimeDir: () => Promise<string>;
        templateDir: () => Promise<string>;
        videoDir: () => Promise<string>;
        resolve: (...paths: string[]) => Promise<string>;
        normalize: (path: string) => Promise<string>;
        join: (...paths: string[]) => Promise<string>;
        dirname: (path: string) => Promise<string>;
        extname: (path: string) => Promise<string>;
        basename: (path: string, ext?: string) => Promise<string>;
        isAbsolute: (path: string) => Promise<boolean>;
      };

      // Process API
      process: {
        exit: (exitCode?: number) => Promise<void>;
        relaunch: () => Promise<void>;
      };

      // Shell API
      shell: {
        open: (path: string, openWith?: string) => Promise<void>;
        Command: typeof Command;
      };

      // App API
      app: {
        getName: () => Promise<string>;
        getVersion: () => Promise<string>;
        getTauriVersion: () => Promise<string>;
        show: () => Promise<void>;
        hide: () => Promise<void>;
      };

      // Clipboard API
      clipboard: {
        readText: () => Promise<string | null>;
        writeText: (text: string) => Promise<void>;
      };

      // Dialog API
      dialog: {
        open: (options?: DialogOptions) => Promise<string | string[] | null>;
        save: (options?: SaveDialogOptions) => Promise<string | null>;
        message: (
          message: string,
          options?: MessageDialogOptions,
        ) => Promise<void>;
        ask: (
          message: string,
          options?: ConfirmDialogOptions,
        ) => Promise<boolean>;
        confirm: (
          message: string,
          options?: ConfirmDialogOptions,
        ) => Promise<boolean>;
      };

      // FS API
      fs: {
        readFile: (path: string) => Promise<Uint8Array>;
        readTextFile: (path: string) => Promise<string>;
        writeFile: (
          path: string,
          contents: string | ArrayBuffer | Uint8Array,
        ) => Promise<void>;
        writeTextFile: (path: string, contents: string) => Promise<void>;
        readDir: (path: string) => Promise<FileEntry[]>;
        createDir: (
          path: string,
          options?: { recursive?: boolean },
        ) => Promise<void>;
        removeDir: (
          path: string,
          options?: { recursive?: boolean },
        ) => Promise<void>;
        copyFile: (source: string, destination: string) => Promise<void>;
        removeFile: (path: string) => Promise<void>;
        renameFile: (oldPath: string, newPath: string) => Promise<void>;
        exists: (path: string) => Promise<boolean>;
      };

      // HTTP API
      http: {
        fetch: <T = unknown>(
          url: string,
          options?: HttpOptions,
        ) => Promise<TauriResponse<T>>;
      };

      // Notification API
      notification: {
        requestPermission: () => Promise<Permission>;
        isPermissionGranted: () => Promise<boolean>;
        sendNotification: (notification: NotificationOptions | string) => void;
      };

      // Global Shortcut API
      globalShortcut: {
        register: (shortcut: string, handler: () => void) => Promise<void>;
        registerAll: (
          shortcuts: string[],
          handler: () => void,
        ) => Promise<void>;
        isRegistered: (shortcut: string) => Promise<boolean>;
        unregister: (shortcut: string) => Promise<void>;
        unregisterAll: () => Promise<void>;
      };

      // Menu API
      menu: {
        new: (items?: MenuItemOptions[]) => Promise<Menu>;
        default: () => Promise<Menu>;
        popup: (menu: Menu, position?: Position) => Promise<void>;
      };

      // Tray API
      tray: {
        new: (options?: TrayOptions) => Promise<TrayIcon>;
      };

      // Updater API
      updater: {
        checkUpdate: () => Promise<UpdateResult>;
        installUpdate: () => Promise<void>;
        onUpdaterEvent: (
          handler: (status: UpdateStatus) => void,
        ) => Promise<UnlistenFn>;
      };
    };
  }

  // Type definitions for Tauri Window
  class TauriWindow {
    label: string;

    constructor(label: string, options?: WindowOptions);

    // Getters
    scaleFactor(): Promise<number>;
    innerPosition(): Promise<PhysicalPosition>;
    outerPosition(): Promise<PhysicalPosition>;
    innerSize(): Promise<PhysicalSize>;
    outerSize(): Promise<PhysicalSize>;
    isFullscreen(): Promise<boolean>;
    isMinimized(): Promise<boolean>;
    isMaximized(): Promise<boolean>;
    isFocused(): Promise<boolean>;
    isDecorated(): Promise<boolean>;
    isResizable(): Promise<boolean>;
    isMaximizable(): Promise<boolean>;
    isMinimizable(): Promise<boolean>;
    isClosable(): Promise<boolean>;
    isVisible(): Promise<boolean>;
    title(): Promise<string>;
    theme(): Promise<Theme | null>;

    // Window operations
    center(): Promise<void>;
    requestUserAttention(requestType: UserAttentionType | null): Promise<void>;
    setResizable(resizable: boolean): Promise<void>;
    setMaximizable(maximizable: boolean): Promise<void>;
    setMinimizable(minimizable: boolean): Promise<void>;
    setClosable(closable: boolean): Promise<void>;
    setTitle(title: string): Promise<void>;
    maximize(): Promise<void>;
    unmaximize(): Promise<void>;
    toggleMaximize(): Promise<void>;
    minimize(): Promise<void>;
    unminimize(): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    close(): Promise<void>;
    destroy(): Promise<void>;
    setDecorations(decorations: boolean): Promise<void>;
    setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;
    setAlwaysOnBottom(alwaysOnBottom: boolean): Promise<void>;
    setContentProtected(protected: boolean): Promise<void>;
    setSize(size: LogicalSize | PhysicalSize): Promise<void>;
    setMinSize(size: LogicalSize | PhysicalSize | null): Promise<void>;
    setMaxSize(size: LogicalSize | PhysicalSize | null): Promise<void>;
    setPosition(position: LogicalPosition | PhysicalPosition): Promise<void>;
    setFullscreen(fullscreen: boolean): Promise<void>;
    setFocus(): Promise<void>;
    setIcon(icon: string | number[]): Promise<void>;
    setSkipTaskbar(skip: boolean): Promise<void>;
    setCursorGrab(grab: boolean): Promise<void>;
    setCursorVisible(visible: boolean): Promise<void>;
    setCursorIcon(icon: CursorIcon): Promise<void>;
    setCursorPosition(
      position: LogicalPosition | PhysicalPosition,
    ): Promise<void>;
    setIgnoreCursorEvents(ignore: boolean): Promise<void>;
    startDragging(): Promise<void>;
    startResizeDragging(direction: ResizeDirection): Promise<void>;
    setProgressBar(progress: ProgressBarStatus): Promise<void>;

    // Event handlers
    listen<T = unknown>(
      event: TauriEvent | string,
      handler: (event: TauriEventPayload<T>) => void,
    ): Promise<UnlistenFn>;
    once<T = unknown>(
      event: TauriEvent | string,
      handler: (event: TauriEventPayload<T>) => void,
    ): Promise<UnlistenFn>;
    emit(event: string, payload?: unknown): Promise<void>;
  }

  // Type definitions for Tauri WebviewWindow
  class TauriWebviewWindow {
    label: string;

    constructor(label: string, options?: WindowOptions);

    // Getters
    scaleFactor(): Promise<number>;
    innerPosition(): Promise<PhysicalPosition>;
    outerPosition(): Promise<PhysicalPosition>;
    innerSize(): Promise<PhysicalSize>;
    outerSize(): Promise<PhysicalSize>;
    isFullscreen(): Promise<boolean>;
    isMinimized(): Promise<boolean>;
    isMaximized(): Promise<boolean>;
    isFocused(): Promise<boolean>;
    isDecorated(): Promise<boolean>;
    isResizable(): Promise<boolean>;
    isMaximizable(): Promise<boolean>;
    isMinimizable(): Promise<boolean>;
    isClosable(): Promise<boolean>;
    isVisible(): Promise<boolean>;
    title(): Promise<string>;
    theme(): Promise<Theme | null>;

    // Window operations
    center(): Promise<void>;
    requestUserAttention(requestType: UserAttentionType | null): Promise<void>;
    setResizable(resizable: boolean): Promise<void>;
    setMaximizable(maximizable: boolean): Promise<void>;
    setMinimizable(minimizable: boolean): Promise<void>;
    setClosable(closable: boolean): Promise<void>;
    setTitle(title: string): Promise<void>;
    maximize(): Promise<void>;
    unmaximize(): Promise<void>;
    toggleMaximize(): Promise<void>;
    minimize(): Promise<void>;
    unminimize(): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    close(): Promise<void>;
    destroy(): Promise<void>;
    setDecorations(decorations: boolean): Promise<void>;
    setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;
    setAlwaysOnBottom(alwaysOnBottom: boolean): Promise<void>;
    setContentProtected(protected: boolean): Promise<void>;
    setSize(size: LogicalSize | PhysicalSize): Promise<void>;
    setMinSize(size: LogicalSize | PhysicalSize | null): Promise<void>;
    setMaxSize(size: LogicalSize | PhysicalSize | null): Promise<void>;
    setPosition(position: LogicalPosition | PhysicalPosition): Promise<void>;
    setFullscreen(fullscreen: boolean): Promise<void>;
    setFocus(): Promise<void>;
    setIcon(icon: string | number[]): Promise<void>;
    setSkipTaskbar(skip: boolean): Promise<void>;
    setCursorGrab(grab: boolean): Promise<void>;
    setCursorVisible(visible: boolean): Promise<void>;
    setCursorIcon(icon: CursorIcon): Promise<void>;
    setCursorPosition(
      position: LogicalPosition | PhysicalPosition,
    ): Promise<void>;
    setIgnoreCursorEvents(ignore: boolean): Promise<void>;
    startDragging(): Promise<void>;
    startResizeDragging(direction: ResizeDirection): Promise<void>;
    setProgressBar(progress: ProgressBarStatus): Promise<void>;

    // Event handlers
    listen<T = unknown>(
      event: TauriEvent | string,
      handler: (event: TauriEventPayload<T>) => void,
    ): Promise<UnlistenFn>;
    once<T = unknown>(
      event: TauriEvent | string,
      handler: (event: TauriEventPayload<T>) => void,
    ): Promise<UnlistenFn>;
    emit(event: string, payload?: unknown): Promise<void>;
  }

  // Position and Size types
  class LogicalSize {
    width: number;
    height: number;
    constructor(width: number, height: number);
  }

  class PhysicalSize {
    width: number;
    height: number;
    constructor(width: number, height: number);
    toLogical(scaleFactor: number): LogicalSize;
  }

  class LogicalPosition {
    x: number;
    y: number;
    constructor(x: number, y: number);
  }

  class PhysicalPosition {
    x: number;
    y: number;
    constructor(x: number, y: number);
    toLogical(scaleFactor: number): LogicalPosition;
  }

  // Event types
  type TauriEvent =
    | "tauri://update-available"
    | "tauri://update-download-progress"
    | "tauri://update-install"
    | "tauri://resize"
    | "tauri://move"
    | "tauri://close-requested"
    | "tauri://destroyed"
    | "tauri://focus"
    | "tauri://blur"
    | "tauri://scale-change"
    | "tauri://menu"
    | "tauri://file-drop"
    | "tauri://file-drop-hover"
    | "tauri://file-drop-cancelled"
    | "tauri://theme-changed";

  interface TauriEventPayload<T = unknown> {
    event: TauriEvent | string;
    windowLabel: string;
    id: number;
    payload: T;
  }

  // Dialog types
  interface DialogOptions {
    title?: string;
    filters?: DialogFilter[];
    defaultPath?: string;
    multiple?: boolean;
    directory?: boolean;
    recursive?: boolean;
  }

  interface SaveDialogOptions {
    title?: string;
    filters?: DialogFilter[];
    defaultPath?: string;
  }

  interface MessageDialogOptions {
    title?: string;
    type?: "info" | "warning" | "error";
    okLabel?: string;
  }

  interface ConfirmDialogOptions {
    title?: string;
    type?: "info" | "warning" | "error";
    okLabel?: string;
    cancelLabel?: string;
  }

  interface DialogFilter {
    name: string;
    extensions: string[];
  }

  // File system types
  interface FileEntry {
    path: string;
    name?: string;
    children?: FileEntry[];
  }

  // HTTP types
  interface HttpOptions {
    method?:
      | "GET"
      | "POST"
      | "PUT"
      | "DELETE"
      | "PATCH"
      | "HEAD"
      | "OPTIONS"
      | "CONNECT"
      | "TRACE";
    headers?: Record<string, string>;
    body?: TauriBody;
    query?: Record<string, string>;
    timeout?: number;
    responseType?: TauriResponseType;
  }

  type TauriBody = string | Uint8Array | FormData | Record<string, unknown>;
  type TauriResponseType = "json" | "text" | "binary";

  interface TauriResponse<T = unknown> {
    url: string;
    status: number;
    ok: boolean;
    headers: Record<string, string>;
    data: T;
  }

  // Notification types
  type Permission = "granted" | "denied" | "default";

  interface NotificationOptions {
    title: string;
    body?: string;
    icon?: string;
  }

  // Menu types
  interface Menu {
    append: (item: MenuItem) => Promise<void>;
    prepend: (item: MenuItem) => Promise<void>;
    insert: (item: MenuItem, position: number) => Promise<void>;
    remove: (item: MenuItem) => Promise<void>;
    removeAt: (position: number) => Promise<void>;
    items: () => Promise<MenuItem[]>;
    get: (id: string) => Promise<MenuItem | null>;
    popup: (window?: TauriWindow, position?: Position) => Promise<void>;
    setAsWindowMenu: (window?: TauriWindow) => Promise<void>;
    setAsAppMenu: () => Promise<void>;
  }

  interface MenuItem {
    id?: string;
    text?: string;
    enabled?: boolean;
    accelerator?: string;
    isNative?: boolean;
    icon?: string;
  }

  interface MenuItemOptions {
    text?: string;
    enabled?: boolean;
    accelerator?: string;
    id?: string;
    icon?: string;
  }

  // Tray types
  interface TrayIcon {
    setIcon: (icon: string | number[]) => Promise<void>;
    setMenu: (menu: Menu | null) => Promise<void>;
    setTooltip: (tooltip: string | null) => Promise<void>;
    setTitle: (title: string | null) => Promise<void>;
    setVisible: (visible: boolean) => Promise<void>;
    setMenuOnLeftClick: (onLeft: boolean) => Promise<void>;
  }

  interface TrayOptions {
    id?: string;
    icon: string | number[];
    menu?: Menu;
    tooltip?: string;
    title?: string;
    menuOnLeftClick?: boolean;
  }

  // Window types
  interface WindowOptions {
    url?: string;
    center?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    resizable?: boolean;
    maximizable?: boolean;
    minimizable?: boolean;
    closable?: boolean;
    title?: string;
    fullscreen?: boolean;
    focus?: boolean;
    transparent?: boolean;
    maximized?: boolean;
    visible?: boolean;
    decorations?: boolean;
    alwaysOnTop?: boolean;
    alwaysOnBottom?: boolean;
    contentProtected?: boolean;
    skipTaskbar?: boolean;
    fileDropEnabled?: boolean;
    theme?: Theme;
    titleBarStyle?: TitleBarStyle;
    hiddenTitle?: boolean;
    acceptFirstMouse?: boolean;
    tabbingIdentifier?: string;
    additionalBrowserArgs?: string;
    userAgent?: string;
  }

  // Shell types
  class Command {
    constructor(program: string, args?: string | string[]);

    spawn(): Promise<Child>;
    execute(): Promise<ChildProcess>;

    // Stdin/stdout/stderr
    stdin(stdin: "inherit" | "piped" | "null"): Command;
    stdout(stdout: "inherit" | "piped" | "null"): Command;
    stderr(stderr: "inherit" | "piped" | "null"): Command;
  }

  interface Child {
    write(data: string | Uint8Array): Promise<void>;
    kill(): Promise<void>;
  }

  interface ChildProcess {
    code: number | null;
    signal: number | null;
    stdout: string;
    stderr: string;
  }

  // Updater types
  interface UpdateResult {
    shouldUpdate: boolean;
    manifest?: UpdateManifest;
  }

  interface UpdateManifest {
    version: string;
    date: string;
    body: string;
  }

  type UpdateStatus =
    | { status: "PENDING" }
    | { status: "ERROR"; error: string }
    | { status: "DONE" }
    | { status: "UPTODATE" }
    | { status: "DOWNLOADED" }
    | { status: "DOWNLOADING"; contentLength?: number; downloaded: number };

  // Utility types
  type Theme = "light" | "dark";
  type TitleBarStyle = "transparent" | "overlay";
  type UserAttentionType = "critical" | "informational";
  type CursorIcon =
    | "default"
    | "crosshair"
    | "hand"
    | "arrow"
    | "move"
    | "text"
    | "wait"
    | "help"
    | "progress"
    | "notAllowed"
    | "contextMenu"
    | "cell"
    | "verticalText"
    | "alias"
    | "copy"
    | "noDrop"
    | "grab"
    | "grabbing"
    | "allScroll"
    | "zoomIn"
    | "zoomOut"
    | "eResize"
    | "nResize"
    | "neResize"
    | "nwResize"
    | "sResize"
    | "seResize"
    | "swResize"
    | "wResize"
    | "ewResize"
    | "nsResize"
    | "neswResize"
    | "nwseResize"
    | "colResize"
    | "rowResize";
  type ResizeDirection =
    | "east"
    | "north"
    | "northeast"
    | "northwest"
    | "south"
    | "southeast"
    | "southwest"
    | "west";

  interface Position {
    x: number;
    y: number;
  }

  interface ProgressBarStatus {
    status?: "none" | "normal" | "indeterminate" | "paused" | "error";
    progress?: number;
  }

  type UnlistenFn = () => void;

  // Close the global declaration block
}
