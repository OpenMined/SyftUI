use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use tauri_plugin_shell::ShellExt;

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

            // Spawn the syftbox_client sidecar, but not in dev/debug mode.
            // In dev mode, we run the sidecar externally with hot-reloading from the `just dev` command.
            if cfg!(not(debug_assertions)) {
                app.shell()
                    .sidecar("syftbox_client")
                    .unwrap()
                    .spawn()
                    .expect("Failed to spawn sidecar");
            }

            // Configure the system tray
            let show_dashboard_i =
                MenuItem::with_id(app, "show_dashboard", "Open SyftBox", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_dashboard_i, &quit_i])?;

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
