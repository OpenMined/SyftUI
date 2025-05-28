use dirs::home_dir;
use serde::Serialize;
use std::{sync::Mutex, thread, time::Duration};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, Theme, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_updater::{Update, UpdaterExt};

mod version;
use version::{
    DAEMON_BUILD, DAEMON_HASH, DAEMON_VERSION, DESKTOP_BUILD, DESKTOP_HASH, DESKTOP_VERSION,
};

#[cfg(not(debug_assertions))]
use {
    command_group::CommandGroup,
    std::process::Command as StdCommand,
    tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind},
    tauri_plugin_shell::ShellExt,
};

#[cfg(target_os = "macos")]
use tauri::{image::Image, TitleBarStyle};

#[derive(Default)]
struct AppState {
    prevent_auto_update_check_for_version: String,
}

struct PendingUpdate {
    pending_update: Mutex<Option<Update>>,
    pending_update_window_state: Mutex<Option<UpdateWindowState>>,
}

pub fn run() {
    log::info!("Starting SyftBox application");
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .clear_targets()
                .format(|out, message, record| {
                    let format = time_macros::format_description!(
                        "[[[year]-[month]-[day]][[[hour]:[minute]:[second]]"
                    );

                    let time_now = tauri_plugin_log::TimezoneStrategy::UseUtc
                        .get_now()
                        .format(&format)
                        .unwrap();

                    out.finish(format_args!(
                        "{}[{}][{}] {}",
                        time_now,
                        record.target(),
                        record.level(),
                        message
                    ))
                })
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Folder {
                        path: home_dir()
                            .expect("Failed to get home directory")
                            .join(".syftbox")
                            .join("logs"),
                        file_name: Some("SyftBoxDesktop".to_string()),
                    },
                ))
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            update_about_window_titlebar_color,
            update_theme,
            update_window_response,
            get_window_state,
        ])
        .setup(|app| {
            log::info!("Setting up application");
            app.manage(Mutex::new(AppState::default()));
            app.manage(PendingUpdate {
                pending_update: Mutex::new(None),
                pending_update_window_state: Mutex::new(None),
            });

            let (daemon_host, daemon_port, daemon_token) = _generate_daemon_client_args();
            log::debug!(
                "Generated daemon connection args - host: {}, port: {}",
                daemon_host,
                daemon_port
            );

            #[cfg(not(debug_assertions))]
            _setup_sidecars_for_release_builds(
                app.handle(),
                &daemon_host,
                &daemon_port,
                &daemon_token,
                _is_app_updated(app.handle()),
            );

            let url = _generate_main_url(&daemon_host, &daemon_port, &daemon_token);
            _setup_main_window(app.handle(), url);
            _start_periodic_update_checks(app.handle());

            _setup_system_tray(app.handle());
            log::info!("Application setup completed");

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    log::info!("Main window close requested - hiding window");
                    // Prevent the window from being closed
                    api.prevent_close();

                    // Hide the window
                    window.hide().unwrap();

                    // Hide from taskbar / dock
                    window.set_skip_taskbar(true).unwrap(); // For windows and Linux

                    #[cfg(target_os = "macos")]
                    let _ = window
                        .app_handle()
                        .set_activation_policy(tauri::ActivationPolicy::Accessory);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn _start_periodic_update_checks(app: &AppHandle) {
    log::info!("Starting periodic update checks");
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            _check_for_updates(&app_handle, false).await;
            thread::sleep(Duration::from_secs(3600)); // Sleep for 1 hour
        }
    });
}

async fn _check_for_updates(app: &AppHandle, has_user_checked_manually: bool) {
    log::info!(
        "Checking for updates (manual check: {})",
        has_user_checked_manually
    );
    let handle = app.clone();
    let current_version = handle.package_info().version.to_string();

    if has_user_checked_manually {
        _show_update_window(
            app,
            UpdateWindowType::Checking,
            "".to_string(),
            current_version.clone(),
            "".to_string(),
            "".to_string(),
            0,
        );
    }
    let update_result = handle.updater().unwrap().check().await;
    match update_result {
        Ok(Some(update)) => {
            log::info!(
                "Update available: {} (current: {})",
                update.version,
                update.current_version
            );
            let state = app.state::<Mutex<AppState>>();
            let should_check_for_update = {
                let state = state.lock().unwrap();
                has_user_checked_manually
                    || state.prevent_auto_update_check_for_version != update.version
            };
            if !should_check_for_update {
                log::debug!(
                    "Skipping update check as it was already shown for version {}",
                    update.version
                );
                return;
            }

            _show_update_window(
                app,
                UpdateWindowType::Available,
                update.version.clone(),
                update.current_version.clone(),
                update
                    .body
                    .as_ref()
                    .unwrap_or(&"No release notes available".to_string())
                    .to_string(),
                "".to_string(),
                0,
            );

            let pending_update = app.state::<PendingUpdate>();
            *pending_update.pending_update.lock().unwrap() = Some(update);
        }
        Ok(None) => {
            log::info!("No updates available");
            if has_user_checked_manually {
                _show_update_window(
                    app,
                    UpdateWindowType::None,
                    "".to_string(),
                    current_version.clone(),
                    "".to_string(),
                    "".to_string(),
                    0,
                );
            }
        }
        Err(e) => {
            log::error!("Failed to check for updates: {}", e);
            if has_user_checked_manually {
                let error_message = format!(
                    "Failed to check for updates.\nPlease try again later.\n\nError: {}",
                    e
                );
                _show_update_window(
                    app,
                    UpdateWindowType::Error,
                    "".to_string(),
                    current_version.clone(),
                    "".to_string(),
                    error_message,
                    0,
                );
            }
        }
    }
}

fn _setup_main_window(app: &AppHandle, url: WebviewUrl) {
    log::info!("Setting up main window");
    let win_builder = WebviewWindowBuilder::new(app, "main", url)
        .title("")
        .disable_drag_drop_handler()
        .focused(true)
        .maximized(true)
        .min_inner_size(800.0, 600.0)
        .inner_size(1200.0, 720.0);

    // set transparent title bar only when building for macOS
    #[cfg(target_os = "macos")]
    let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

    let _window = win_builder.build().unwrap();
    log::debug!("Main window created successfully");

    // set background color only when building for macOS
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window = _window.ns_window().unwrap() as id;
        unsafe {
            let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                nil,
                218.0 / 255.0,
                241.0 / 255.0,
                237.0 / 255.0,
                1.0,
            );
            ns_window.setBackgroundColor_(bg_color);
            log::debug!("Set macOS window background color");
        }
    }
}

fn _show_about_window(app: &AppHandle) {
    log::info!("Showing about window");
    if let Some(window) = app.get_webview_window("about") {
        window.show().unwrap();
        window.set_focus().unwrap();
        log::debug!("Reused existing about window");
    } else {
        let desktop_build = urlencoding::encode(DESKTOP_BUILD);
        let daemon_build = urlencoding::encode(DAEMON_BUILD);
        let url = format!(
            "about/#desktop_version={}&desktop_hash={}&desktop_build={}&daemon_version={}&daemon_hash={}&daemon_build={}",
            DESKTOP_VERSION, DESKTOP_HASH, desktop_build, DAEMON_VERSION, DAEMON_HASH, daemon_build
        );
        let _about_window = WebviewWindowBuilder::new(app, "about", WebviewUrl::App(url.into()))
            .title("About SyftBox")
            .inner_size(280.0, 500.0)
            .focused(true)
            .maximizable(false)
            .minimizable(false)
            .resizable(false);

        // set transparent title bar only when building for macOS
        #[cfg(target_os = "macos")]
        let _about_window = _about_window
            .hidden_title(true)
            .title_bar_style(TitleBarStyle::Transparent);
        let _about_window = _about_window.build().unwrap();
        log::debug!("Created new about window");
    }
}

// declare a type enum for the update window
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
enum UpdateWindowType {
    Checking,
    None,
    Available,
    Downloading,
    Error,
    Failed,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateWindowState {
    update_window_type: UpdateWindowType,
    version: String,
    current_version: String,
    release_notes: String,
    error: String,
    progress: usize,
}

fn _show_update_window(
    app: &AppHandle,
    update_window_type: UpdateWindowType,
    version: String,
    current_version: String,
    release_notes: String,
    error: String,
    progress: usize,
) {
    // Create the window state
    let window_state = UpdateWindowState {
        update_window_type: update_window_type.clone(),
        version: version.clone(),
        current_version: current_version.clone(),
        release_notes: release_notes.clone(),
        error: error.clone(),
        progress,
    };

    // Save the window state
    let pending_update = app.state::<PendingUpdate>();
    *pending_update.pending_update_window_state.lock().unwrap() = Some(window_state.clone());

    if let Some(window) = app.get_webview_window("updates") {
        // Window already exists, so we update the state by emitting events
        app.emit_to("updates", "update-window-state", window_state)
            .unwrap();
        window.show().unwrap();
        window.set_focus().unwrap();
    } else {
        // We'll just create the "updates" window here. Since we can't be certain when the frontend will
        // be ready to receive `emit_to` events, we don't emit the initial state from the backend right away.
        // Instead, the frontend is responsible for invoking the `get_window_state` command once it's mounted
        // and ready.
        let _update_window =
            WebviewWindowBuilder::new(app, "updates", WebviewUrl::App("updates/".into()))
                .title("Updates")
                .inner_size(800.0, 600.0)
                .focused(true)
                .decorations(false)
                .build()
                .unwrap();

        // Add rounded corners for macOS
        #[cfg(target_os = "macos")]
        {
            use cocoa::appkit::{NSColor, NSView, NSWindow};
            use cocoa::base::{id, nil, NO, YES};
            use objc::{msg_send, sel, sel_impl};

            let ns_window = _update_window.ns_window().unwrap() as id;
            unsafe {
                // Set window to be non-opaque and clear background
                ns_window.setOpaque_(NO);
                ns_window.setBackgroundColor_(NSColor::clearColor(nil));

                // Get the content view and set its layer properties
                let content_view: id = ns_window.contentView();
                content_view.setWantsLayer(YES);
                let layer: id = content_view.layer();
                let _: () = msg_send![layer, setCornerRadius: 10.0];
                let _: () = msg_send![layer, setMasksToBounds: true];
            }
        }
    }
}

#[tauri::command]
fn update_theme(app: AppHandle, is_dark: bool) {
    for (_, window) in app.webview_windows() {
        if let Err(e) = window.set_theme(if is_dark {
            Some(Theme::Dark)
        } else {
            Some(Theme::Light)
        }) {
            log::error!("Error setting theme: {}", e);
        }
    }
}

#[tauri::command]
fn update_about_window_titlebar_color(app: AppHandle, r: f64, g: f64, b: f64) {
    let _about_window = app.get_webview_window("about").unwrap();
    log::debug!(
        "Updating about window titlebar color: r: {}, g: {}, b: {}",
        r,
        g,
        b
    );

    // set background color only when building for macOS
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window = _about_window.ns_window().unwrap() as id;
        unsafe {
            let bg_color =
                NSColor::colorWithRed_green_blue_alpha_(nil, r / 255.0, g / 255.0, b / 255.0, 1.0);
            ns_window.setBackgroundColor_(bg_color);
            log::debug!("Updated macOS window background and titlebar color");
        }
    }
}

#[tauri::command]
async fn update_window_response(app: AppHandle, install_update: bool) -> Result<(), String> {
    log::info!(
        "Update window response received - install: {}",
        install_update
    );
    let pending_update = app.state::<PendingUpdate>();
    let update = {
        let pending_update = pending_update.pending_update.lock().unwrap();
        pending_update.clone()
    };

    if let Some(update) = update {
        if install_update {
            log::info!(
                "Starting update installation for version {}",
                update.version
            );
            let mut downloaded_chunks: u64 = 0;
            let mut last_shown_percent: i32 = -1; // Track last shown percentage
            if let Err(e) = update
                .download_and_install(
                    |chunk_length, content_length| {
                        downloaded_chunks += chunk_length as u64;
                        let percent = (downloaded_chunks as f64
                            / content_length.unwrap_or(downloaded_chunks) as f64)
                            * 100.0;

                        // Casting to i32 to convert to integer percentage so that
                        // we update the progress bar on 1% increments
                        let current_percent = percent as i32;

                        if current_percent > last_shown_percent {
                            log::debug!("Update download progress: {:.1}%", percent);
                            _show_update_window(
                                &app,
                                UpdateWindowType::Downloading,
                                update.version.clone(),
                                update.current_version.clone(),
                                "".to_string(),
                                "".to_string(),
                                current_percent as usize,
                            );
                            last_shown_percent = current_percent;
                        }
                    },
                    || {},
                )
                .await
            {
                log::error!("Failed to download and install update: {}", e);
                let error_message = format!(
                    "Failed to download and install update.\nPlease try again later.\n\nError: {}",
                    e
                );
                _show_update_window(
                    &app,
                    UpdateWindowType::Failed,
                    update.version.clone(),
                    update.current_version.clone(),
                    "".to_string(),
                    error_message,
                    0,
                );
            } else {
                log::info!("Update installation complete - restarting application");
                app.restart();
            }
        } else {
            log::info!("User declined update for version {}", update.version);
            let state = app.state::<Mutex<AppState>>();
            let mut state = state.lock().unwrap();
            state.prevent_auto_update_check_for_version = update.version.clone();
        }
    }
    Ok(())
}

#[tauri::command]
fn get_window_state(app: AppHandle) -> UpdateWindowState {
    let pending_update = app.state::<PendingUpdate>();
    let update_window_state = pending_update.pending_update_window_state.lock().unwrap();

    update_window_state.clone().unwrap_or(UpdateWindowState {
        update_window_type: UpdateWindowType::Checking,
        version: "".to_string(),
        current_version: app.package_info().version.to_string(),
        release_notes: "".to_string(),
        error: "".to_string(),
        progress: 0,
    })
}

fn _generate_daemon_client_args() -> (String, String, String) {
    #[cfg(debug_assertions)]
    {
        log::debug!("Generating daemon client args for debug mode");
        // For dev mode, read the DAEMON_HOST, DAEMON_PORT, and DAEMON_TOKEN environment variables.
        // We always set these in the `just dev` command and later use them both here and
        // in the `just dev-daemon` command.
        let daemon_host =
            std::env::var("DAEMON_HOST").expect("DAEMON_HOST environment variable is not set");
        let daemon_port =
            std::env::var("DAEMON_PORT").expect("DAEMON_PORT environment variable is not set");
        let daemon_token =
            std::env::var("DAEMON_TOKEN").expect("DAEMON_TOKEN environment variable is not set");
        (daemon_host, daemon_port, daemon_token)
    }
    #[cfg(not(debug_assertions))]
    {
        log::debug!("Generating daemon client args for release mode");
        // Generate the daemon connection args.
        let daemon_host = std::env::var("DAEMON_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        // let daemon_port = _get_random_available_port();
        let daemon_port = "7938".to_string();
        let daemon_token = _generate_secure_token();
        (daemon_host, daemon_port, daemon_token)
    }
}

fn _generate_main_url(host: &str, port: &str, token: &str) -> WebviewUrl {
    log::debug!("Generating main URL with host: {}, port: {}", host, port);
    let url = format!("#host={}&port={}&token={}", host, port, token);
    WebviewUrl::App(url.into())
}

#[cfg(not(debug_assertions))]
fn _is_app_updated(app: &AppHandle) -> bool {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app directory");
    std::fs::create_dir_all(&app_data_dir).unwrap();
    let path = app_data_dir.join("desktop_version.txt");
    let path_clone = path.clone();

    let previous_version = std::fs::read_to_string(&path).unwrap_or_else(|_| "0.0.0".to_string());
    let current_version = app.package_info().version.to_string();
    let result = previous_version != current_version;
    if result {
        std::fs::write(&path, current_version.clone()).unwrap_or_else(|_| {
            log::error!(
                "Failed to write version information to {}",
                path_clone.to_str().unwrap()
            )
        });
    }
    log::debug!("Is updated: {}", result);
    result
}

#[cfg(not(debug_assertions))]
fn _setup_sidecars_for_release_builds(
    app: &AppHandle,
    daemon_host: &str,
    daemon_port: &str,
    daemon_token: &str,
    is_app_updated: bool,
) {
    log::info!("Setting up sidecars");

    if is_app_updated && _is_port_in_use(daemon_port) {
        log::info!("App was just updated and port is still in use, silently waiting for clean up");
        for i in 0..10 {
            thread::sleep(Duration::from_secs(1));
            if !_is_port_in_use(daemon_port) {
                break;
            }
            log::debug!("Port is in use, waiting for 1 second ({} / 10)", i + 1);
        }
    }

    while _is_port_in_use(daemon_port) {
        if is_app_updated {
            log::info!("Port is still in use after waiting, showing dialog");
        } else {
            log::info!("Port is in use, showing dialog");
        }
        let quit_selected = app.dialog()
            .message(format!(
                "Syftbox daemon port {} is already in use. Please close the app that is using it and try again.",
                daemon_port
            ))
            .kind(MessageDialogKind::Error)
            .title("SyftBox daemon port in use")
            .buttons(MessageDialogButtons::OkCancelCustom(
                "Quit".to_string(),
                "Try Again".to_string(),
            ))
            .blocking_show();
        if quit_selected {
            log::debug!("User chose to quit, exiting");
            app.exit(0);
            return;
        } else {
            log::debug!("User chose to try again, continuing");
        }
    }

    // Spawn the daemon sidecar with the generated args.
    let mut sidecar_cmd: StdCommand = app
        .shell()
        .sidecar("syftboxd")
        .unwrap()
        .args([
            "daemon",
            "--http-addr",
            &format!("{}:{}", daemon_host, daemon_port),
            "--http-token",
            &daemon_token,
        ])
        // Set the SYFTBOX_DESKTOP_BINARIES_PATH environment variable to the directory
        // of the current executable. In syftbox daemon, syftbox apps are run using the
        // system's default shell (bash, zsh, fish, sh, git-bash.exe, etc).
        // We source the appropriate shell rc/init files to initialize the environment.
        // After the setup, we append the current executable's directory (via
        // $SYFTBOX_DESKTOP_BINARIES_PATH) to the end of the PATH variable.
        // This ensures bundled executables (like `uv`) are available to the shell,
        // but with the lowest precedence — so if the user already has `uv` installed,
        // their version will take priority.
        .env(
            "SYFTBOX_DESKTOP_BINARIES_PATH",
            std::env::current_exe()
                .unwrap()
                .parent()
                .unwrap()
                .to_str()
                .unwrap(),
        )
        .into();

    // Important to use group_spawn() here so the entire process tree can be killed when the daemon sidecar exits.
    // This helps prevent orphaned SyftBox apps (launched using run.sh) after SyftBox daemon exits.
    let mut daemon_sidecar = sidecar_cmd.group_spawn().expect("Failed to spawn sidecar");
    let daemon_group_id = daemon_sidecar.id();
    log::info!("Daemon sidecar spawned with Group ID: {}", daemon_group_id);

    // Listen for the daemon sidecar to exit and kill the main app if it does.
    let app_handle = app.app_handle().clone();
    tauri::async_runtime::spawn(async move {
        let exit_code = daemon_sidecar
            .wait()
            .ok()
            .and_then(|status| status.code())
            .unwrap_or_else(|| {
                log::warn!("Daemon sidecar exited without a status code");
                1
            });

        log::error!(
            "Daemon sidecar exited unexpectedly with code: {}",
            exit_code
        );
        app_handle
            .dialog()
            .message(
                "SyftBox daemon exited unexpectedly. Please check the logs for more information.",
            )
            .kind(MessageDialogKind::Error)
            .title("Error")
            .blocking_show();

        app_handle.exit(exit_code);
    });

    // Spawn the `process-wick` sidecar to kill all sidecars when the main app exits.
    // This prevents orphaned sidecars after the main app is closed.
    let (_, process_wick_sidecar) = app
        .shell()
        .sidecar("process-wick")
        .unwrap()
        .args(["--targets", &daemon_group_id.to_string()])
        .spawn()
        .expect("Failed to spawn sidecar");
    log::info!(
        "Process wick sidecar spawned with PID: {}",
        process_wick_sidecar.pid()
    );
}

fn _setup_system_tray(app: &AppHandle) {
    log::info!("Setting up system tray");
    let autostart_manager = app.autolaunch();

    // Create the menu items
    let show_dashboard_i =
        MenuItem::with_id(app, "show_dashboard", "Open SyftBox", true, None::<&str>)
            .expect("Failed to create Show Dashboard menu item");
    let autostart_i = CheckMenuItem::with_id(
        app,
        "autostart",
        "Autostart",
        true,
        autostart_manager.is_enabled().unwrap_or(false),
        None::<&str>,
    )
    .expect("Failed to create Autostart menu item");
    let check_for_updates_i = MenuItem::with_id(
        app,
        "check_for_updates",
        "Check for Updates",
        true,
        None::<&str>,
    )
    .expect("Failed to create Check for Updates menu item");
    let about_i = MenuItem::with_id(app, "about", "About SyftBox", true, None::<&str>)
        .expect("Failed to create About menu item");
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)
        .expect("Failed to create Quit menu item");

    // Create the menu
    let menu = Menu::with_items(
        app,
        &[
            &show_dashboard_i,
            &autostart_i,
            &check_for_updates_i,
            &about_i,
            &quit_i,
        ],
    )
    .expect("Failed to create menu");

    // Create the tray icon
    let mut tray_builder = TrayIconBuilder::new().menu(&menu);

    // Platform-specific icon configuration
    #[cfg(target_os = "macos")]
    {
        tray_builder = tray_builder
            .icon(Image::from_bytes(include_bytes!("../icons/tray.png")).unwrap())
            .icon_as_template(true);
    }
    #[cfg(not(target_os = "macos"))]
    {
        tray_builder = tray_builder.icon(app.default_window_icon().unwrap().clone());
    }

    // Build the tray icon
    let tray = tray_builder.build(app).unwrap();
    log::debug!("System tray created successfully");

    // Handle menu events
    tray.on_menu_event(move |app, event| match event.id.as_ref() {
        "show_dashboard" => {
            log::info!("Show dashboard menu item clicked");
            let window = app.get_webview_window("main").unwrap();

            // Show in taskbar / dock
            window.set_skip_taskbar(false).unwrap(); // For Windows and Linux
            #[cfg(target_os = "macos")]
            let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);

            // Show the window
            window.show().unwrap();
            window.set_focus().unwrap();
        }
        "autostart" => {
            log::info!("Autostart menu item clicked");
            let manager = app.autolaunch();
            if manager.is_enabled().unwrap() {
                let _ = manager.disable();
                log::debug!("Autostart disabled");
            } else {
                let _ = manager.enable();
                log::debug!("Autostart enabled");
            }
        }
        "check_for_updates" => {
            log::info!("Check for updates menu item clicked");
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                _check_for_updates(&app_handle, true).await;
            });
        }
        "about" => {
            log::info!("About menu item clicked");
            _show_about_window(app);
        }
        "quit" => {
            log::info!("Quit menu item clicked - exiting application");
            app.exit(0);
        }
        _ => {
            log::warn!("Unhandled menu item: {:?}", event.id);
        }
    });
}

#[cfg(not(debug_assertions))]
fn _is_port_in_use(port: &str) -> bool {
    log::debug!("Checking if port {} is in use", port);
    use std::net::TcpStream;

    // Try to parse the port string to a number
    let port_num = match port.parse::<u16>() {
        Ok(num) => num,
        Err(e) => {
            log::error!("Failed to parse port number: {}", e);
            return false;
        }
    };

    // Try to connect to the port
    match TcpStream::connect(format!("127.0.0.1:{}", port_num)) {
        Ok(_) => {
            log::debug!("Port {} is in use (connection successful)", port);
            true
        }
        Err(e) => {
            // If we get "Connection refused", it means nothing is listening on that port
            if e.kind() == std::io::ErrorKind::ConnectionRefused {
                log::debug!("Port {} is available (connection refused)", port);
                false
            } else {
                // For other errors, we'll assume the port is in use
                // This handles cases like "Address already in use" or other system-specific errors
                log::debug!("Port {} appears to be in use (error: {})", port, e);
                true
            }
        }
    }
}

#[cfg(not(debug_assertions))]
fn _get_random_available_port() -> String {
    log::debug!("Getting random available port");
    use std::net::TcpListener;

    let port = TcpListener::bind("127.0.0.1:0").expect("Failed to bind to random port");
    let port_num = port.local_addr().unwrap().port();
    log::debug!("Selected random port: {}", port_num);
    format!("{}", port_num)
}

#[cfg(not(debug_assertions))]
fn _generate_secure_token() -> String {
    log::debug!("Generating secure token");
    use rand::rngs::OsRng;
    use rand::TryRngCore;

    let mut key = [0u8; 16];
    OsRng.try_fill_bytes(&mut key).unwrap();
    let token = hex::encode(key);
    log::debug!("Generated secure token");
    token
}
