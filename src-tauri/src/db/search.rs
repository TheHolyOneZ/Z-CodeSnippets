use crate::error::Result;
use crate::models::Snippet;
use rusqlite::{params, Connection};

pub fn search(conn: &Connection, query: &str, limit: usize) -> Result<Vec<Snippet>> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }


    let fts_query = format!("{}*", query.trim().replace('"', "\"\""));

    let mut stmt = conn.prepare(
        "SELECT s.id, s.title, s.body, s.language, s.description, s.pinned,
                s.collection_id, s.created_at, s.updated_at, s.used_at
         FROM snippets s
         JOIN snippets_fts fts ON s.rowid = fts.rowid
         WHERE snippets_fts MATCH ?1
         ORDER BY rank
         LIMIT ?2",
    )?;

    let ids: Vec<String> = stmt
        .query_map(params![fts_query, limit as i64], |r| r.get(0))?
        .collect::<rusqlite::Result<Vec<String>>>()?;

    let mut results = Vec::with_capacity(ids.len());
    for id in &ids {
        if let Some(s) = crate::db::snippets::get(conn, id)? {
            results.push(s);
        }
    }
    Ok(results)
}
