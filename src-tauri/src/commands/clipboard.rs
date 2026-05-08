use crate::db::{snippets as db, DbState};
use crate::error::AppError;
use tauri::State;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub fn clipboard_copy(
    app: tauri::AppHandle,
    state: State<DbState>,
    text: String,
    snippet_id: Option<String>,
) -> Result<(), AppError> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| AppError::Other(e.to_string()))?;

    if let Some(id) = snippet_id {
        let conn = state.0.lock().unwrap();
        let _ = db::touch_used(&conn, &id);
    }

    Ok(())
}
