use crate::db::{search as db, DbState};
use crate::error::AppError;
use crate::models::Snippet;
use tauri::State;

#[tauri::command]
pub fn search_snippets(
    state: State<DbState>,
    q: String,
    limit: Option<usize>,
) -> Result<Vec<Snippet>, AppError> {
    let conn = state.0.lock().unwrap();
    db::search(&conn, &q, limit.unwrap_or(50))
}
