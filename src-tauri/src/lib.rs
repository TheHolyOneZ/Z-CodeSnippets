mod commands;
mod db;
mod error;
mod models;

use db::{schema, DbState};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir().expect("no app data dir");
            std::fs::create_dir_all(&data_dir)?;
            let db_path = data_dir.join("zcode-snippets.db");
            let conn = Connection::open(&db_path).expect("failed to open database");
            schema::migrate(&conn).expect("failed to run migrations");
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::snippets::snippet_list,
            commands::snippets::snippet_get,
            commands::snippets::snippet_create,
            commands::snippets::snippet_update,
            commands::snippets::snippet_delete,
            commands::snippets::snippet_toggle_pin,
            commands::snippets::snippet_touch_used,
            commands::snippets::snippet_duplicate,
            commands::collections::collection_list,
            commands::collections::collection_create,
            commands::collections::collection_rename,
            commands::collections::collection_delete,
            commands::tags::tag_list_all,
            commands::search::search_snippets,
            commands::clipboard::clipboard_copy,
            commands::files::read_file_as_text,
            commands::files::export_snippets,
            commands::files::import_snippets,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
