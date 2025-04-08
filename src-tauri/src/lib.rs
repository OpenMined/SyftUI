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

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let hide_show_i = MenuItem::with_id(app, "hide_show", "Hide", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&hide_show_i, &quit_i])?;

            let tray = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)
                .unwrap();

            let hide_show_i_clone = hide_show_i.clone();
            tray.on_menu_event(move |app, event| match event.id.as_ref() {
                "quit" => {
                    println!("quit menu item was clicked");
                    app.exit(0);
                }
                "hide_show" => {
                    let window = app.get_webview_window("main").unwrap();
                    if window.is_visible().unwrap() {
                        // Don't show in taskbar / dock
                        window.set_skip_taskbar(true).unwrap();
                        #[cfg(target_os = "macos")]
                        let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);

                        // Hide the window
                        window.hide().unwrap();
                        hide_show_i_clone.set_text("Show").unwrap();
                    } else {
                        // Show in taskbar / dock
                        window.set_skip_taskbar(false).unwrap();
                        #[cfg(target_os = "macos")]
                        let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);

                        // Show the window
                        window.show().unwrap();
                        window.set_focus().unwrap();
                        hide_show_i_clone.set_text("Hide").unwrap();
                    }
                }
                _ => {
                    println!("menu item {:?} not handled", event.id);
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
