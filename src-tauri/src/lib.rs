use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_updater::UpdaterExt;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())
                .expect("Failed to initialize updater plugin");

            app.handle()
                .plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    None,
                ))
                .expect("Failed to initialize autostart plugin");

            let autostart_manager = app.autolaunch();

            if cfg!(not(debug_assertions)) {
                // Only check for updates in release builds.
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    update(handle).await.unwrap();
                });

                // Spawn the syftbox_client sidecar, but not in dev/debug mode.
                // In dev mode, we run the sidecar externally with hot-reloading from the `just dev` command.
                let (_rx, syftbox_client_sidecar) = app
                    .shell()
                    .sidecar("syftbox_client")
                    .unwrap()
                    .spawn()
                    .expect("Failed to spawn sidecar");

                // Spawn the process-wick sidecar to kill all sidecars when the main app exits.
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
            if cfg!(target_os = "macos") {
                tray_builder = tray_builder
                    .icon(Image::from_bytes(include_bytes!("../icons/tray.png")).unwrap())
                    .icon_as_template(true);
            } else {
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
