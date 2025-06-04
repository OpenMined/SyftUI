//! Window creation and management functions

use crate::state::{PendingUpdate, UpdateWindowState, UpdateWindowType};
use crate::version::{
    DAEMON_BUILD, DAEMON_HASH, DAEMON_VERSION, DESKTOP_BUILD, DESKTOP_HASH, DESKTOP_VERSION,
};
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;

#[cfg(target_os = "macos")]
use cocoa::appkit::{NSColor, NSView, NSWindow};
#[cfg(target_os = "macos")]
use cocoa::base::{id, nil, NO, YES};
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

pub fn _setup_main_window(app: &AppHandle, url: WebviewUrl) {
    log::info!("Setting up main window");
    let win_builder = WebviewWindowBuilder::new(app, "main", url)
        .title("")
        .disable_drag_drop_handler()
        .focused(true)
        .maximized(true)
        .min_inner_size(800.0, 600.0)
        .inner_size(1200.0, 720.0);

    #[cfg(target_os = "macos")]
    let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

    let _window = win_builder.build().unwrap();
    log::debug!("Main window created successfully");

    #[cfg(target_os = "macos")]
    {
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

pub fn _show_about_window(app: &AppHandle) {
    log::info!("Showing about window");
    if let Some(window) = app.get_webview_window("about") {
        window.show().unwrap();
        window.set_focus().unwrap();
        log::debug!("Reused existing about window");
    } else {
        let desktop_build_encoded = urlencoding::encode(DESKTOP_BUILD);
        let daemon_build_encoded = urlencoding::encode(DAEMON_BUILD);
        let url_str = format!(
            "about/#desktop_version={}&desktop_hash={}&desktop_build={}&daemon_version={}&daemon_hash={}&daemon_build={}",
            DESKTOP_VERSION, DESKTOP_HASH, desktop_build_encoded, DAEMON_VERSION, DAEMON_HASH, daemon_build_encoded
        );

        let mut about_win_builder =
            WebviewWindowBuilder::new(app, "about", WebviewUrl::App(url_str.into()));

        about_win_builder = about_win_builder
            .title("About SyftBox")
            .inner_size(280.0, 500.0)
            .focused(true)
            .maximizable(false)
            .minimizable(false)
            .resizable(false);

        #[cfg(target_os = "macos")]
        {
            about_win_builder = about_win_builder
                .hidden_title(true)
                .title_bar_style(TitleBarStyle::Transparent);
        }
        let _about_window = about_win_builder.build().unwrap();
        log::debug!("Created new about window");
    }
}

pub fn _show_update_window(
    app: &AppHandle,
    update_window_type: UpdateWindowType,
    version: String,
    current_version: String,
    release_notes: String,
    error: String,
    progress: usize,
) {
    let window_state = UpdateWindowState {
        update_window_type: update_window_type.clone(),
        version: version.clone(),
        current_version: current_version.clone(),
        release_notes: release_notes.clone(),
        error: error.clone(),
        progress,
    };

    let pending_update_state = app.state::<PendingUpdate>();
    *pending_update_state
        .pending_update_window_state
        .lock()
        .unwrap() = Some(window_state.clone());

    if let Some(_window) = app.get_webview_window("updates") {
        app.emit_to("updates", "update-window-state", window_state)
            .unwrap();
    } else {
        let _update_window =
            WebviewWindowBuilder::new(app, "updates", WebviewUrl::App("updates/".into()))
                .title("Updates")
                .inner_size(800.0, 600.0)
                .focused(true)
                .decorations(false)
                .build()
                .unwrap();

        #[cfg(target_os = "macos")]
        {
            let ns_window = _update_window.ns_window().unwrap() as id;
            unsafe {
                ns_window.setOpaque_(NO);
                ns_window.setBackgroundColor_(NSColor::clearColor(nil));
                let content_view: id = ns_window.contentView();
                content_view.setWantsLayer(YES);
                let layer: id = content_view.layer();
                let _: () = msg_send![layer, setCornerRadius: 10.0];
                let _: () = msg_send![layer, setMasksToBounds: true];
            }
        }
        // Emit state after creating, assuming frontend will pick it up or call get_window_state
        app.emit_to("updates", "update-window-state", window_state)
            .unwrap_or_else(|e| {
                log::warn!(
                    "Could not emit initial state to newly created update window: {}",
                    e
                )
            });
    }
}
