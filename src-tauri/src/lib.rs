use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, TitleBarStyle, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_updater::UpdaterExt;

#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            #[cfg(debug_assertions)]
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;

            _setup_main_window(app.handle());

            _check_for_updates(app.handle(), false);

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
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn _check_for_updates(app: &tauri::AppHandle, has_user_checked_manually: bool) {
    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let update_result = handle.updater().unwrap().check().await;
        match update_result {
            Ok(Some(update)) => {
                let message = format!(
                    "SyftBox {} is available!\n\nRelease notes:\n\n{}",
                    update.current_version,
                    update
                        .body
                        .as_ref()
                        .unwrap_or(&"No release notes available".to_string())
                );

                let ans = handle
                    .dialog()
                    .message(message)
                    .kind(MessageDialogKind::Info)
                    .title("SyftBox Update Available")
                    .buttons(MessageDialogButtons::OkCancelCustom(
                        "Update".to_string(),
                        "Later".to_string(),
                    ))
                    .blocking_show();

                if ans {
                    if let Err(e) = update.download_and_install(|_, _| {}, || {}).await {
                        handle
                            .dialog()
                            .message(format!(
                                "Failed to download and install update.\nPlease try again later.\n\nError: {}",
                                e
                            ))
                            .kind(MessageDialogKind::Error)
                            .title("Update Failed")
                            .buttons(MessageDialogButtons::Ok)
                            .blocking_show();
                        return;
                    }
                    handle.restart();
                }
            }
            Ok(None) => {
                if has_user_checked_manually {
                    handle
                        .dialog()
                        .message("You are on the latest version. Stay awesome!")
                        .kind(MessageDialogKind::Info)
                        .title("No Update Available")
                        .buttons(MessageDialogButtons::Ok)
                        .blocking_show();
                }
            }
            Err(e) => {
                if has_user_checked_manually {
                    handle
                        .dialog()
                        .message(format!(
                            "Failed to check for updates.\nPlease try again later.\n\nError: {}",
                            e
                        ))
                        .kind(MessageDialogKind::Error)
                        .title("Update Check Failed")
                        .buttons(MessageDialogButtons::Ok)
                        .blocking_show();
                }
            }
        }
    });
}

fn _setup_main_window(app: &tauri::AppHandle) {
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

fn _send_syftbox_client_args_to_frontend(
    handle: &tauri::AppHandle,
    host: &str,
    port: &str,
    token: &str,
) {
    let window = handle.get_webview_window("main").unwrap();
    let mut url = window.url().unwrap();
    let fragment = format!("host={}&port={}&token={}", host, port, token);
    url.set_fragment(Some(&fragment));
    window.navigate(url).unwrap();
}

#[cfg(not(debug_assertions))]
fn _setup_sidecars_for_release_builds(
    app: &tauri::AppHandle,
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

fn _setup_system_tray(app: &tauri::AppHandle) {
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
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)
        .expect("Failed to create Quit menu item");

    // Create the menu
    let menu = Menu::with_items(
        app,
        &[
            &show_dashboard_i,
            &autostart_i,
            &check_for_updates_i,
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
            _check_for_updates(app, true);
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
