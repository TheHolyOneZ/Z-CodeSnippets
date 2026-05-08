use crate::db::{tags as db, DbState};
use crate::error::AppError;
use tauri::State;

#[tauri::command]
pub fn tag_list_all(state: State<DbState>) -> Result<Vec<String>, AppError> {
    let conn = state.0.lock().unwrap();
    db::list_all(&conn)
}
