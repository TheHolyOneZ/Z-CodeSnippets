use crate::error::Result;
use rusqlite::Connection;

pub fn list_all(conn: &Connection) -> Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT DISTINCT tag FROM tags ORDER BY tag")?;
    let tags = stmt
        .query_map([], |r| r.get(0))?
        .collect::<rusqlite::Result<Vec<String>>>()?;
    Ok(tags)
}
