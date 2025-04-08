use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let show_dashboard_i =
                MenuItem::with_id(app, "show_dashboard", "Open SyftBox", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_dashboard_i, &quit_i])?;
            let tray = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)
                .unwrap();

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
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
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
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
