use dirs::home_dir;
use serde::Serialize;
use std::time::Duration;
use std::{sync::Mutex, thread};
use tauri::Theme;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri::{AppHandle, Emitter};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_updater::{Update, UpdaterExt};

mod version;
use version::{COMMIT_HASH, DAEMON_VERSION, DESKTOP_VERSION, FRONTEND_VERSION};

#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;

#[cfg(target_os = "macos")]
use tauri::{image::Image, TitleBarStyle};

#[derive(Default)]
struct AppState {
    prevent_auto_update_check_for_version: String,
}

struct PendingUpdate {
    pending_update: Mutex<Option<Update>>,
}

pub fn run() {
    log::info!("Starting SyftBox application");
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
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
            update_window_response
        ])
        .setup(|app| {
            log::info!("Setting up application");
            app.manage(Mutex::new(AppState::default()));
            app.manage(PendingUpdate {
                pending_update: Mutex::new(None),
            });

            let (daemon_host, daemon_port, daemon_token) = _generate_daemon_client_args();
            log::debug!(
                "Generated daemon connection args - host: {}, port: {}",
                daemon_host,
                daemon_port
            );
            let url = _generate_main_url(&daemon_host, &daemon_port, &daemon_token);
            _setup_main_window(app.handle(), url);
            _start_periodic_update_checks(app.handle());

            #[cfg(not(debug_assertions))]
            _setup_sidecars_for_release_builds(
                app.handle(),
                &daemon_host,
                &daemon_port,
                &daemon_token,
            );

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
        let url = format!(
            "about/#desktop_version={}&frontend_version={}&daemon_version={}&commit_hash={}",
            DESKTOP_VERSION, FRONTEND_VERSION, DAEMON_VERSION, COMMIT_HASH
        );
        let _about_window = WebviewWindowBuilder::new(app, "about", WebviewUrl::App(url.into()))
            .title("About SyftBox")
            .inner_size(280.0, 450.0)
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

impl UpdateWindowType {
    fn as_str(&self) -> &'static str {
        match self {
            UpdateWindowType::Checking => "checking",
            UpdateWindowType::None => "none",
            UpdateWindowType::Available => "available",
            UpdateWindowType::Downloading => "downloading",
            UpdateWindowType::Error => "error",
            UpdateWindowType::Failed => "failed",
        }
    }
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
    let error = urlencoding::encode(&error).into_owned();
    let release_notes = urlencoding::encode(&release_notes).into_owned();

    if let Some(window) = app.get_webview_window("updates") {
        // Window already exists, so we update the state by emitting events
        app.emit_to(
            "updates",
            "update-window-state",
            UpdateWindowState {
                update_window_type,
                version,
                current_version,
                release_notes,
                error,
                progress,
            },
        )
        .unwrap();
        window.show().unwrap();
        window.set_focus().unwrap();
    } else {
        let _update_window = WebviewWindowBuilder::new(
            app,
            "updates",
            WebviewUrl::App(format!(
                "updates/?type={}&version={}&current_version={}&release_notes={}&error={}&progress={}",
                update_window_type.as_str(),
                version,
                current_version,
                release_notes,
                error,
                progress
            )
            .into()
            )
        )
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
fn update_about_window_titlebar_color(app: AppHandle, is_dark: bool, r: f64, g: f64, b: f64) {
    let _about_window = app.get_webview_window("about").unwrap();
    log::debug!(
        "Updating about window titlebar color: is_dark: {}, r: {}, g: {}, b: {}",
        is_dark,
        r,
        g,
        b
    );

    if let Err(e) = _about_window.set_theme(if is_dark {
        Some(Theme::Dark)
    } else {
        Some(Theme::Light)
    }) {
        log::error!("Error setting theme: {}", e);
    }

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
            if let Err(e) = update
                .download_and_install(
                    |chunk_length, content_length| {
                        downloaded_chunks += chunk_length as u64;
                        let percent = (downloaded_chunks as f64
                            / content_length.unwrap_or(downloaded_chunks) as f64)
                            * 100.0;
                        log::debug!("Update download progress: {:.1}%", percent);
                        _show_update_window(
                            &app,
                            UpdateWindowType::Downloading,
                            update.version.clone(),
                            update.current_version.clone(),
                            "".to_string(),
                            "".to_string(),
                            percent as usize,
                        );
                    },
                    || {
                        log::info!("Update installation complete - restarting application");
                        app.restart();
                    },
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
        let daemon_port = _get_random_available_port();
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
fn _setup_sidecars_for_release_builds(
    app: &AppHandle,
    daemon_host: &str,
    daemon_port: &str,
    daemon_token: &str,
) {
    log::info!("Setting up sidecars for release build");
    // Spawn the daemon sidecar with the generated connection args.
    // We do this only in release builds, because in dev mode we run the sidecar
    // externally with hot-reloading from the `just dev` command.
    let (_rx, daemon_sidecar) = app
        .shell()
        .sidecar("syftboxd")
        .unwrap()
        .args(&[
            "daemon",
            "--http-addr",
            &format!("{}:{}", daemon_host, daemon_port),
            "--http-token",
            &daemon_token,
        ])
        .spawn()
        .expect("Failed to spawn sidecar");
    log::debug!("Daemon sidecar spawned with PID: {}", daemon_sidecar.pid());

    // Spawn the `process-wick` sidecar to kill all sidecars when the main app exits.
    // This prevents orphaned sidecars after the main app is closed.
    app.shell()
        .sidecar("process-wick")
        .unwrap()
        .args(["--targets", &daemon_sidecar.pid().to_string()])
        .spawn()
        .expect("Failed to spawn sidecar");
    log::debug!("Process wick sidecar spawned");
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
