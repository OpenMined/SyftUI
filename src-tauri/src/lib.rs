//! Main application entry point and setup

use std::sync::Mutex;
use tauri::Manager;

// Modules for application logic
mod commands;
mod state;
mod updates;
mod utils;
mod version;
mod windows;

pub fn run() {
    log::info!("Starting SyftBox application");

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_decorum::init())
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
                        path: dirs::home_dir()
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
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            commands::update_about_window_titlebar_color,
            commands::update_theme,
            commands::update_window_response,
            commands::get_window_state,
        ])
        .setup(|app| {
            log::info!("Setting up application");
            // Initialize state
            app.manage(Mutex::new(state::AppState::default()));
            app.manage(state::PendingUpdate {
                pending_update: Mutex::new(None),
                pending_update_window_state: Mutex::new(None),
            });

            // Generate daemon client arguments
            let (daemon_host, daemon_port, daemon_token) = utils::_generate_daemon_client_args();
            log::debug!(
                "Generated daemon connection args - host: {}, port: {}",
                daemon_host,
                daemon_port
            );

            // Setup sidecars for release builds
            #[cfg(not(debug_assertions))]
            utils::_setup_sidecars_for_release_builds(
                app.handle(),
                &daemon_host,
                &daemon_port,
                &daemon_token,
                utils::_is_app_updated(app.handle()),
            );

            // Generate main URL and setup main window
            let url = utils::_generate_main_url(&daemon_host, &daemon_port, &daemon_token);
            windows::_setup_main_window(app.handle(), url);

            // Start periodic update checks
            updates::_start_periodic_update_checks(app.handle());

            // Setup system tray
            utils::_setup_system_tray(app.handle());

            log::info!("Application setup completed");
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    log::info!("Main window close requested - hiding window");
                    api.prevent_close();
                    window.hide().unwrap();
                    window.set_skip_taskbar(true).unwrap();
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
