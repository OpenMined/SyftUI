//! Utility functions and helpers

use log;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
};
use tauri::{AppHandle, Manager, WebviewUrl};
use tauri_plugin_autostart::ManagerExt;

#[cfg(not(debug_assertions))]
use {
    command_group::CommandGroup,
    std::process::Command as StdCommand,
    std::{thread, time::Duration},
    tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind},
    tauri_plugin_shell::ShellExt,
};

#[cfg(target_os = "macos")]
use tauri::image::Image;

pub fn _generate_daemon_client_args() -> (String, String, String) {
    #[cfg(debug_assertions)]
    {
        log::debug!("Generating daemon client args for debug mode");
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
        let daemon_host = std::env::var("DAEMON_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let daemon_port = "7938".to_string(); // Fixed port for release
        let daemon_token = _generate_secure_token();
        (daemon_host, daemon_port, daemon_token)
    }
}

pub fn _generate_main_url(host: &str, port: &str, token: &str) -> WebviewUrl {
    log::debug!("Generating main URL with host: {}, port: {}", host, port);
    let url = format!("#host={}&port={}&token={}", host, port, token);
    WebviewUrl::App(url.into())
}

#[cfg(not(debug_assertions))]
pub fn _is_app_updated(app: &AppHandle) -> bool {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app directory");
    std::fs::create_dir_all(&app_data_dir).unwrap_or_else(|e| {
        log::error!(
            "Failed to create app data dir {}: {}",
            app_data_dir.display(),
            e
        )
    });
    let path = app_data_dir.join("desktop_version.txt");

    let previous_version = std::fs::read_to_string(&path).unwrap_or_else(|_| "0.0.0".to_string());
    let current_version = app.package_info().version.to_string();
    let result = previous_version != current_version;
    if result {
        if let Err(e) = std::fs::write(&path, current_version.clone()) {
            log::error!(
                "Failed to write version information to {}: {}",
                path.display(),
                e
            );
        }
    }
    log::debug!("Is updated: {}", result);
    result
}

#[cfg(not(debug_assertions))]
pub fn _setup_sidecars_for_release_builds(
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

    let mut daemon_sidecar = sidecar_cmd.group_spawn().expect("Failed to spawn sidecar");
    let daemon_group_id = daemon_sidecar.id();
    log::info!("Daemon sidecar spawned with Group ID: {}", daemon_group_id);

    let app_handle_clone = app.app_handle().clone();
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
        app_handle_clone
            .dialog()
            .message(
                "SyftBox daemon exited unexpectedly. Please check the logs for more information.",
            )
            .kind(MessageDialogKind::Error)
            .title("Error")
            .blocking_show();

        app_handle_clone.exit(exit_code);
    });

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

pub fn _setup_system_tray(app: &AppHandle) {
    log::info!("Setting up system tray");
    let autostart_manager = app.autolaunch();

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

    let mut tray_builder = TrayIconBuilder::new().menu(&menu);

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

    let tray = tray_builder.build(app).unwrap();
    log::debug!("System tray created successfully");

    let app_handle_clone = app.clone(); // Clone AppHandle for the event handler
    tray.on_menu_event(move |event_app, event| match event.id.as_ref() {
        "show_dashboard" => {
            log::info!("Show dashboard menu item clicked");
            let window = event_app.get_webview_window("main").unwrap();
            window.set_skip_taskbar(false).unwrap();
            #[cfg(target_os = "macos")]
            event_app
                .set_activation_policy(tauri::ActivationPolicy::Regular)
                .unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
        }
        "autostart" => {
            log::info!("Autostart menu item clicked");
            let manager = event_app.autolaunch();
            if manager.is_enabled().unwrap_or(false) {
                if let Err(e) = manager.disable() {
                    log::error!("Failed to disable autostart: {}", e);
                } else {
                    log::debug!("Autostart disabled");
                }
            } else {
                if let Err(e) = manager.enable() {
                    log::error!("Failed to enable autostart: {}", e);
                } else {
                    log::debug!("Autostart enabled");
                }
            }
        }
        "check_for_updates" => {
            log::info!("Check for updates menu item clicked");
            let app_for_updates = app_handle_clone.clone(); // Use the cloned AppHandle
            tauri::async_runtime::spawn(async move {
                crate::updates::_check_for_updates(&app_for_updates, true).await;
            });
        }
        "about" => {
            log::info!("About menu item clicked");
            crate::windows::_show_about_window(&app_handle_clone); // Use the cloned AppHandle
        }
        "quit" => {
            log::info!("Quit menu item clicked - exiting application");
            event_app.exit(0);
        }
        _ => {
            log::warn!("Unhandled menu item: {:?}", event.id);
        }
    });
}

#[cfg(not(debug_assertions))]
pub fn _is_port_in_use(port_str: &str) -> bool {
    log::debug!("Checking if port {} is in use", port_str);
    use std::net::TcpStream;
    let port_num = match port_str.parse::<u16>() {
        Ok(num) => num,
        Err(e) => {
            log::error!("Failed to parse port number '{}': {}", port_str, e);
            return true; // Assume in use if parsing fails
        }
    };
    match TcpStream::connect(("127.0.0.1", port_num)) {
        Ok(_) => {
            log::debug!("Port {} is in use (connection successful)", port_str);
            true
        }
        Err(e) => {
            if e.kind() == std::io::ErrorKind::ConnectionRefused {
                log::debug!("Port {} is available (connection refused)", port_str);
                false
            } else {
                log::debug!("Port {} appears to be in use (error: {})", port_str, e);
                true
            }
        }
    }
}

#[cfg(not(debug_assertions))]
pub fn _get_random_available_port() -> String {
    log::debug!("Getting random available port");
    use std::net::TcpListener;
    let listener = TcpListener::bind("127.0.0.1:0").expect("Failed to bind to random port");
    let port_num = listener.local_addr().unwrap().port();
    log::debug!("Selected random port: {}", port_num);
    format!("{}", port_num)
}

#[cfg(not(debug_assertions))]
pub fn _generate_secure_token() -> String {
    log::debug!("Generating secure token");
    use rand::rngs::OsRng;
    use rand::TryRngCore;
    let mut key = [0u8; 16];
    OsRng
        .try_fill_bytes(&mut key)
        .expect("Failed to generate secure token key");
    hex::encode(key)
}
