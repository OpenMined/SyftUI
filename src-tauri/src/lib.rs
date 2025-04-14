use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;

#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;

#[cfg(not(debug_assertions))]
use tauri_plugin_updater::UpdaterExt;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;

            app.handle()
                .plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    None,
                ))
                .expect("Failed to initialize autostart plugin");

            // Send the syftbox_client connection args to the frontend.
            #[cfg(debug_assertions)]
            {
                // For dev mode, read the BRIDGE_HOST, BRIDGE_PORT, and BRIDGE_TOKEN environment variables.
                // We always set these in the `just dev` command and later use them both here and
                //  in the `just dev-bridge` command.
                let bridge_host = std::env::var("BRIDGE_HOST")
                    .expect("BRIDGE_HOST environment variable is not set");
                let bridge_port = std::env::var("BRIDGE_PORT")
                    .expect("BRIDGE_PORT environment variable is not set");
                let bridge_token = std::env::var("BRIDGE_TOKEN")
                    .expect("BRIDGE_TOKEN environment variable is not set");
                send_syftbox_client_args_to_frontend(
                    app.handle(),
                    bridge_host,
                    bridge_port,
                    bridge_token,
                );
            }

            #[cfg(not(debug_assertions))]
            {
                // Set up the updater plugin.
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())
                    .expect("Failed to initialize updater plugin");

                // Check for updates
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    update(handle).await.unwrap();
                });

                // Generate the syftbox_client connection args.
                let bridge_host =
                    std::env::var("BRIDGE_HOST").unwrap_or_else(|_| "localhost".to_string());
                let bridge_port = get_random_available_port();
                let bridge_token = generate_secure_token();

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

                // Send the syftbox_client connection args to the frontend.
                send_syftbox_client_args_to_frontend(
                    app.handle(),
                    bridge_host,
                    bridge_port,
                    bridge_token,
                );

                // Spawn the `process-wick` sidecar to kill all sidecars when the main app exits.
                // This prevents orphaned sidecars after the main app is closed.
                app.shell()
                    .sidecar("process-wick")
                    .unwrap()
                    .args(["--targets", &syftbox_client_sidecar.pid().to_string()])
                    .spawn()
                    .expect("Failed to spawn sidecar");
            }

            // Configure the system tray
            let show_dashboard_i =
                MenuItem::with_id(app, "show_dashboard", "Open SyftBox", true, None::<&str>)?;
            let autostart_manager = app.autolaunch();
            let autostart_i = CheckMenuItem::with_id(
                app,
                "autostart",
                "Autostart",
                true,
                autostart_manager.is_enabled().unwrap_or(false),
                None::<&str>,
            )?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_dashboard_i, &autostart_i, &quit_i])?;

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

            let tray = tray_builder.build(app).unwrap();

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
                "quit" => {
                    app.exit(0);
                }
                _ => {
                    println!("menu item {:?} not handled", event.id);
                }
            });
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

#[cfg(not(debug_assertions))]
async fn update(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;

        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    println!("downloaded {downloaded} from {content_length:?}");
                },
                || {
                    println!("download finished");
                },
            )
            .await?;

        println!("update installed");
        app.restart();
    }
    Ok(())
}

fn send_syftbox_client_args_to_frontend(
    handle: &tauri::AppHandle,
    host: String,
    port: String,
    token: String,
) {
    let window = handle.get_webview_window("main").unwrap();
    let mut url = window.url().unwrap();
    let fragment = format!("host={}&port={}&token={}", host, port, token);
    url.set_fragment(Some(&fragment));
    window.navigate(url).unwrap();
}

#[cfg(not(debug_assertions))]
fn get_random_available_port() -> String {
    use std::net::TcpListener;

    let port = TcpListener::bind("127.0.0.1:0").expect("Failed to bind to random port");
    format!("{}", port.local_addr().unwrap().port())
}

#[cfg(not(debug_assertions))]
fn generate_secure_token() -> String {
    use rand::rngs::OsRng;

    let mut key = [0u8; 16];
    OsRng.try_fill_bytes(&mut key).unwrap();
    hex::encode(key)
}
