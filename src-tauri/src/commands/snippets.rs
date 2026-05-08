use crate::db::{snippets as db, DbState};
use crate::error::AppError;
use crate::models::{NewSnippet, Snippet, SnippetListFilter, UpdateSnippet};
use tauri::State;

#[tauri::command]
pub fn snippet_list(
    state: State<DbState>,
    filter: Option<SnippetListFilter>,
) -> Result<Vec<Snippet>, AppError> {
    let conn = state.0.lock().unwrap();
    db::list(&conn, &filter.unwrap_or(SnippetListFilter {
        collection_id: None,
        tag: None,
        pinned_only: None,
    }))
}

#[tauri::command]
pub fn snippet_get(state: State<DbState>, id: String) -> Result<Snippet, AppError> {
    let conn = state.0.lock().unwrap();
    db::get(&conn, &id)?.ok_or(AppError::NotFound)
}

#[tauri::command]
pub fn snippet_create(state: State<DbState>, input: NewSnippet) -> Result<Snippet, AppError> {
    let conn = state.0.lock().unwrap();
    db::create(&conn, input)
}

#[tauri::command]
pub fn snippet_update(state: State<DbState>, input: UpdateSnippet) -> Result<Snippet, AppError> {
    let conn = state.0.lock().unwrap();
    db::update(&conn, input)
}

#[tauri::command]
pub fn snippet_delete(state: State<DbState>, id: String) -> Result<(), AppError> {
    let conn = state.0.lock().unwrap();
    db::delete(&conn, &id)
}

#[tauri::command]
pub fn snippet_toggle_pin(state: State<DbState>, id: String) -> Result<Snippet, AppError> {
    let conn = state.0.lock().unwrap();
    db::toggle_pin(&conn, &id)
}

#[tauri::command]
pub fn snippet_touch_used(state: State<DbState>, id: String) -> Result<(), AppError> {
    let conn = state.0.lock().unwrap();
    db::touch_used(&conn, &id)
}

#[tauri::command]
pub fn snippet_duplicate(state: State<DbState>, id: String) -> Result<Snippet, AppError> {
    let conn = state.0.lock().unwrap();
    db::duplicate(&conn, &id)
}
