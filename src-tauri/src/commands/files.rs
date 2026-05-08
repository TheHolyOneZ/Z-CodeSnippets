use crate::db::{snippets as db, DbState};
use crate::error::AppError;
use crate::models::{NewSnippet, Snippet, SnippetListFilter};
use tauri::State;

#[tauri::command]
pub fn read_file_as_text(path: String) -> Result<String, AppError> {
    const MAX_BYTES: u64 = 2 * 1024 * 1024;
    let meta = std::fs::metadata(&path).map_err(|e| AppError::Io(e.to_string()))?;
    if meta.len() > MAX_BYTES {
        return Err(AppError::Other(format!(
            "File too large ({} KB). Max 2 MB.",
            meta.len() / 1024
        )));
    }
    std::fs::read_to_string(&path)
        .map_err(|e| AppError::Io(format!("Cannot read as text: {}", e)))
}

#[tauri::command]
pub fn export_snippets(state: State<DbState>, path: String) -> Result<(), AppError> {
    let conn = state.0.lock().unwrap();
    let snippets = db::list(
        &conn,
        &SnippetListFilter {
            collection_id: None,
            tag: None,
            pinned_only: None,
        },
    )?;
    let json =
        serde_json::to_string_pretty(&snippets).map_err(|e| AppError::Json(e.to_string()))?;
    std::fs::write(&path, json).map_err(|e| AppError::Io(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub fn import_snippets(state: State<DbState>, path: String) -> Result<usize, AppError> {
    let text = std::fs::read_to_string(&path).map_err(|e| AppError::Io(e.to_string()))?;
    let snippets: Vec<Snippet> =
        serde_json::from_str(&text).map_err(|e| AppError::Json(e.to_string()))?;
    let conn = state.0.lock().unwrap();
    let count = snippets.len();
    for s in snippets {
        let input = NewSnippet {
            title: s.title,
            body: s.body,
            language: Some(s.language),
            description: Some(s.description),
            collection_id: None,
            tags: Some(s.tags),
        };
        db::create(&conn, input)?;
    }
    Ok(count)
}
