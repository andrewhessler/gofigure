use std::collections::VecDeque;
use std::sync::Mutex;

use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use tauri::Manager;

use crate::queries::settings::AppSettings;

mod commands;
mod queries;
mod util;

struct AppData {
    session_running: bool,
    current_image_idx: usize,
    greatest_idx: usize,
    path_history: Vec<String>,
    image_pool: Vec<String>,
    repeat_cache: VecDeque<String>,
    settings: AppSettings,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app
                .handle()
                .path()
                .app_data_dir()
                .expect("Data dir should be accessible");

            std::fs::create_dir_all(&app_dir).expect("App data dir should be creatable");

            let connection_options = SqliteConnectOptions::new()
                .filename(app_dir.join("gofigure.db"))
                .create_if_missing(true);

            let pool = tauri::async_runtime::block_on(SqlitePool::connect_with(connection_options))
                .expect("Sqlite connection should be successful");

            tauri::async_runtime::block_on(sqlx::migrate!("./migrations").run(&pool))
                .expect("migrations should be able to run");

            // Allow accessing images in source directories
            let sources: Vec<String> = tauri::async_runtime::block_on(
                sqlx::query_scalar("SELECT path FROM image_sources").fetch_all(&pool),
            )
            .expect("image sources should be queryable");

            let scope = app.asset_protocol_scope();
            for dir in &sources {
                scope
                    .allow_directory(dir, true)
                    .expect("source directory should be allowable");
            }
            // ---

            app.manage(pool);
            app.manage(Mutex::new(AppData {
                session_running: false,
                current_image_idx: 0,
                greatest_idx: 0,
                path_history: vec![],
                image_pool: vec![],
                repeat_cache: VecDeque::new(),
                settings: AppSettings {
                    no_repeat_behavior: "no_repeat_for_n_images".to_string(),
                    ..Default::default()
                },
            }));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // session
            commands::session::start_session,
            commands::session::end_session,
            commands::session::next_image,
            commands::session::prev_image,
            commands::session::skip_image,
            // sources
            commands::source::get_sources,
            commands::source::add_sources,
            commands::source::delete_sources,
            // history
            commands::history::get_history,
            // settings
            commands::settings::get_settings,
            commands::settings::save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("Tauri application should successfully start");
}
