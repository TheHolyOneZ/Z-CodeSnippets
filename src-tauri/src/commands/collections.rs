use crate::db::{collections as db, DbState};
use crate::error::AppError;
use crate::models::{Collection, NewCollection};
use tauri::State;

#[tauri::command]
pub fn collection_list(state: State<DbState>) -> Result<Vec<Collection>, AppError> {
    let conn = state.0.lock().unwrap();
    db::list(&conn)
}

#[tauri::command]
pub fn collection_create(
    state: State<DbState>,
    input: NewCollection,
) -> Result<Collection, AppError> {
    let conn = state.0.lock().unwrap();
    db::create(&conn, input)
}

#[tauri::command]
pub fn collection_rename(
    state: State<DbState>,
    id: String,
    name: String,
) -> Result<Collection, AppError> {
    let conn = state.0.lock().unwrap();
    db::rename(&conn, &id, &name)
}

#[tauri::command]
pub fn collection_delete(state: State<DbState>, id: String) -> Result<(), AppError> {
    let conn = state.0.lock().unwrap();
    db::delete(&conn, &id)
}
