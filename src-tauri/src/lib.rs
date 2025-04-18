use serde::Serialize;
use std::time::Duration;
use std::{sync::Mutex, thread};
use tauri::Theme;
use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, TitleBarStyle, WebviewUrl, WebviewWindowBuilder,
};
use tauri::{AppHandle, Emitter};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_updater::{Update, UpdaterExt};

mod version;
use version::{COMMIT_HASH, DAEMON_VERSION, DESKTOP_VERSION, FRONTEND_VERSION};

#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;

#[derive(Default)]
struct AppState {
    prevent_auto_update_check_for_version: String,
}

struct PendingUpdate {
    pending_update: Mutex<Option<Update>>,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::default()
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
            app.manage(Mutex::new(AppState::default()));
            app.manage(PendingUpdate {
                pending_update: Mutex::new(None),
            });

            _setup_main_window(app.handle());

            // Start periodic update checks
            _start_periodic_update_checks(app.handle());

            let (bridge_host, bridge_port, bridge_token) = _generate_syftbox_client_args();

            #[cfg(not(debug_assertions))]
            _setup_sidecars_for_release_builds(
                app.handle(),
                &bridge_host,
                &bridge_port,
                &bridge_token,
            );

            _send_syftbox_client_args_to_frontend(
                app.handle(),
                &bridge_host,
                &bridge_port,
                &bridge_token,
            );

            _setup_system_tray(app.handle());

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
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
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            _check_for_updates(&app_handle, false).await;
            thread::sleep(Duration::from_secs(300)); // Sleep for 5 minutes
        }
    });
}

async fn _check_for_updates(app: &AppHandle, has_user_checked_manually: bool) {
    let handle = app.clone();
    if has_user_checked_manually {
        _show_update_window(
            app,
            UpdateWindowType::Checking,
            "".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
            0,
        );
    }
    let update_result = handle.updater().unwrap().check().await;
    match update_result {
        Ok(Some(update)) => {
            let state = app.state::<Mutex<AppState>>();
            let should_check_for_update = {
                let state = state.lock().unwrap();
                has_user_checked_manually
                    || state.prevent_auto_update_check_for_version != update.version
            };
            if !should_check_for_update {
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
            if has_user_checked_manually {
                _show_update_window(
                    app,
                    UpdateWindowType::None,
                    "".to_string(),
                    "".to_string(),
                    "".to_string(),
                    "".to_string(),
                    0,
                );
            }
        }
        Err(e) => {
            if has_user_checked_manually {
                let error_message = format!(
                    "Failed to check for updates.\nPlease try again later.\n\nError: {}",
                    e
                );
                _show_update_window(
                    app,
                    UpdateWindowType::Error,
                    "".to_string(),
                    "".to_string(),
                    "".to_string(),
                    error_message,
                    0,
                );
            }
        }
    }
}

fn _setup_main_window(app: &AppHandle) {
    let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
        .title("")
        .inner_size(1200.0, 720.0);

    // set transparent title bar only when building for macOS
    #[cfg(target_os = "macos")]
    let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

    let window = win_builder.build().unwrap();

    // set background color only when building for macOS
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window = window.ns_window().unwrap() as id;
        unsafe {
            let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                nil,
                218.0 / 255.0,
                241.0 / 255.0,
                237.0 / 255.0,
                1.0,
            );
            ns_window.setBackgroundColor_(bg_color);
        }
    }
}

fn _show_about_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("about") {
        window.show().unwrap();
        window.set_focus().unwrap();
    } else {
        let url = format!(
            "about/#desktop_version={}&frontend_version={}&daemon_version={}&commit_hash={}",
            DESKTOP_VERSION, FRONTEND_VERSION, DAEMON_VERSION, COMMIT_HASH
        );
        let _about_window = WebviewWindowBuilder::new(app, "about", WebviewUrl::App(url.into()))
            .inner_size(280.0, 450.0)
            .focused(true)
            .hidden_title(true)
            .maximizable(false)
            .minimizable(false)
            .resizable(false);

        // set transparent title bar only when building for macOS
        #[cfg(target_os = "macos")]
        let _about_window = _about_window.title_bar_style(TitleBarStyle::Transparent);
        let _about_window = _about_window.build().unwrap();
    }
}

// declare a type enum for the update window
enum UpdateWindowType {
    Checking,
    Available,
    None,
    Error,
    Failed,
}

impl UpdateWindowType {
    fn as_str(&self) -> &'static str {
        match self {
            UpdateWindowType::Checking => "checking",
            UpdateWindowType::Available => "available",
            UpdateWindowType::None => "none",
            UpdateWindowType::Error => "error",
            UpdateWindowType::Failed => "failed",
        }
    }
}

fn _show_update_window(
    app: &AppHandle,
    update_window_type: UpdateWindowType,
    version: String,
    current_version: String,
    release_notes: String,
    error: String,
    progress: i8,
) {
    let error = urlencoding::encode(&error).into_owned();
    let release_notes = urlencoding::encode(&release_notes).into_owned();

    if let Some(window) = app.get_webview_window("updates") {
        let mut url = window.url().unwrap();
        url.set_query(Some(&format!(
            "type={}&version={}&current_version={}&release_notes={}&error={}&progress={}",
            update_window_type.as_str(),
            version,
            current_version,
            release_notes,
            error,
            progress
        )));
        window.navigate(url).unwrap();
        window.show().unwrap();
        window.set_focus().unwrap();
    } else {
        let _update_window = WebviewWindowBuilder::new(
            app,
            "updates",
            WebviewUrl::App(format!(
                "updates?type={}&version={}&current_version={}&release_notes={}&error={}&progress={}",
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
        .inner_size(800.0, 600.0)
        .focused(true)
        .decorations(false)
        .build()
        .unwrap();

        // Add rounded corners for macOS
        #[cfg(target_os = "macos")]
        {
            use cocoa::appkit::{NSColor, NSView, NSWindow};
            use cocoa::base::{id, nil};
            use objc::{msg_send, sel, sel_impl};

            let ns_window = _update_window.ns_window().unwrap() as id;
            unsafe {
                // Set window to be non-opaque and clear background
                ns_window.setOpaque_(false);
                ns_window.setBackgroundColor_(NSColor::clearColor(nil));

                // Get the content view and set its layer properties
                let content_view: id = ns_window.contentView();
                content_view.setWantsLayer(true);
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

    if let Err(e) = _about_window.set_theme(if is_dark {
        Some(Theme::Dark)
    } else {
        Some(Theme::Light)
    }) {
        println!("Error setting theme: {}", e);
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
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadProgress {
    percent: usize,
}

#[tauri::command]
async fn update_window_response(app: AppHandle, install_update: bool) -> Result<(), String> {
    println!("update_window_response: install_update: {}", install_update);
    let pending_update = app.state::<PendingUpdate>();
    let update = {
        let pending_update = pending_update.pending_update.lock().unwrap();
        pending_update.clone()
    };

    if let Some(update) = update {
        if install_update {
            let mut downloaded_chunks: u64 = 0;
            if let Err(e) = update
                .download_and_install(
                    |chunk_length, content_length| {
                        downloaded_chunks += chunk_length as u64;
                        let percent = (downloaded_chunks as f64
                            / content_length.unwrap_or(downloaded_chunks) as f64)
                            * 100.0;
                        app.emit_to(
                            "updates",
                            "update-progress",
                            DownloadProgress {
                                percent: percent as usize,
                            },
                        )
                        .unwrap();
                    },
                    || {
                        app.restart();
                    },
                )
                .await
            {
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
            let state = app.state::<Mutex<AppState>>();
            let mut state = state.lock().unwrap();
            state.prevent_auto_update_check_for_version = update.version.clone();
        }
    }
    Ok(())
}

fn _generate_syftbox_client_args() -> (String, String, String) {
    #[cfg(debug_assertions)]
    {
        // For dev mode, read the BRIDGE_HOST, BRIDGE_PORT, and BRIDGE_TOKEN environment variables.
        // We always set these in the `just dev` command and later use them both here and
        //  in the `just dev-bridge` command.
        let bridge_host =
            std::env::var("BRIDGE_HOST").expect("BRIDGE_HOST environment variable is not set");
        let bridge_port =
            std::env::var("BRIDGE_PORT").expect("BRIDGE_PORT environment variable is not set");
        let bridge_token =
            std::env::var("BRIDGE_TOKEN").expect("BRIDGE_TOKEN environment variable is not set");
        (bridge_host, bridge_port, bridge_token)
    }
    #[cfg(not(debug_assertions))]
    {
        // Generate the syftbox_client connection args.
        let bridge_host = std::env::var("BRIDGE_HOST").unwrap_or_else(|_| "localhost".to_string());
        let bridge_port = _get_random_available_port();
        let bridge_token = _generate_secure_token();
        (bridge_host, bridge_port, bridge_token)
    }
}

fn _send_syftbox_client_args_to_frontend(handle: &AppHandle, host: &str, port: &str, token: &str) {
    let window = handle.get_webview_window("main").unwrap();
    let mut url = window.url().unwrap();
    let fragment = format!("host={}&port={}&token={}", host, port, token);
    url.set_fragment(Some(&fragment));
    window.navigate(url).unwrap();
}

#[cfg(not(debug_assertions))]
fn _setup_sidecars_for_release_builds(
    app: &AppHandle,
    bridge_host: &str,
    bridge_port: &str,
    bridge_token: &str,
) {
    // Spawn the syftbox_client sidecar with the generated connection args.
    // We do this only in release builds, because in dev mode we run the sidecar
    // externally with hot-reloading from the `just dev` command.
    let (_rx, syftbox_client_sidecar) = app
        .shell()
        .sidecar("syftbox_client")
        .unwrap()
        .args(&[
            "--ui-host",
            &bridge_host,
            "--ui-port",
            &bridge_port,
            "--ui-token",
            &bridge_token,
        ])
        .spawn()
        .expect("Failed to spawn sidecar");

    // Spawn the `process-wick` sidecar to kill all sidecars when the main app exits.
    // This prevents orphaned sidecars after the main app is closed.
    app.shell()
        .sidecar("process-wick")
        .unwrap()
        .args(["--targets", &syftbox_client_sidecar.pid().to_string()])
        .spawn()
        .expect("Failed to spawn sidecar");
}

fn _setup_system_tray(app: &AppHandle) {
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

    // Handle menu events
    tray.on_menu_event(move |app, event| match event.id.as_ref() {
        "show_dashboard" => {
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
            let manager = app.autolaunch();
            if manager.is_enabled().unwrap() {
                let _ = manager.disable();
            } else {
                let _ = manager.enable();
            }
        }
        "check_for_updates" => {
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                _check_for_updates(&app_handle, true).await;
            });
        }
        "about" => {
            _show_about_window(app);
        }
        "quit" => {
            app.exit(0);
        }
        _ => {
            println!("menu item {:?} not handled", event.id);
        }
    });
}

#[cfg(not(debug_assertions))]
fn _get_random_available_port() -> String {
    use std::net::TcpListener;

    let port = TcpListener::bind("127.0.0.1:0").expect("Failed to bind to random port");
    format!("{}", port.local_addr().unwrap().port())
}

#[cfg(not(debug_assertions))]
fn _generate_secure_token() -> String {
    use rand::rngs::OsRng;
    use rand::TryRngCore;

    let mut key = [0u8; 16];
    OsRng.try_fill_bytes(&mut key).unwrap();
    hex::encode(key)
}
