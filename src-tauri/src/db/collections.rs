use crate::error::{AppError, Result};
use crate::models::{Collection, NewCollection};
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn list(conn: &Connection) -> Result<Vec<Collection>> {
    let mut stmt =
        conn.prepare("SELECT id, name, color, created_at FROM collections ORDER BY name")?;
    let rows = stmt
        .query_map([], |r| {
            Ok(Collection {
                id: r.get(0)?,
                name: r.get(1)?,
                color: r.get(2)?,
                created_at: r.get(3)?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(rows)
}

pub fn create(conn: &Connection, input: NewCollection) -> Result<Collection> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO collections (id, name, color, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, input.name, input.color, now],
    )?;
    get(conn, &id)?.ok_or(AppError::NotFound)
}

pub fn rename(conn: &Connection, id: &str, name: &str) -> Result<Collection> {
    let rows = conn.execute(
        "UPDATE collections SET name=?1 WHERE id=?2",
        params![name, id],
    )?;
    if rows == 0 {
        return Err(AppError::NotFound);
    }
    get(conn, id)?.ok_or(AppError::NotFound)
}

pub fn delete(conn: &Connection, id: &str) -> Result<()> {
    let rows = conn.execute("DELETE FROM collections WHERE id=?", params![id])?;
    if rows == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

fn get(conn: &Connection, id: &str) -> Result<Option<Collection>> {
    let mut stmt =
        conn.prepare("SELECT id, name, color, created_at FROM collections WHERE id=?")?;
    let mut rows = stmt.query(params![id])?;
    if let Some(row) = rows.next()? {
        Ok(Some(Collection {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            created_at: row.get(3)?,
        }))
    } else {
        Ok(None)
    }
}
