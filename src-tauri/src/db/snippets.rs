use crate::error::{AppError, Result};
use crate::models::{NewSnippet, Snippet, SnippetListFilter, UpdateSnippet};
use rusqlite::{params, Connection};
use uuid::Uuid;

fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn row_to_snippet(row: &rusqlite::Row, tags: Vec<String>) -> rusqlite::Result<Snippet> {
    Ok(Snippet {
        id: row.get(0)?,
        title: row.get(1)?,
        body: row.get(2)?,
        language: row.get(3)?,
        description: row.get(4)?,
        pinned: row.get::<_, i64>(5)? != 0,
        collection_id: row.get(6)?,
        tags,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
        used_at: row.get(9)?,
    })
}

fn load_tags(conn: &Connection, snippet_id: &str) -> Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT tag FROM tags WHERE snippet_id = ? ORDER BY tag")?;
    let tags = stmt
        .query_map(params![snippet_id], |r| r.get(0))?
        .collect::<rusqlite::Result<Vec<String>>>()?;
    Ok(tags)
}

pub fn list(conn: &Connection, filter: &SnippetListFilter) -> Result<Vec<Snippet>> {
    let mut sql = String::from(
        "SELECT id, title, body, language, description, pinned, collection_id,
                created_at, updated_at, used_at FROM snippets WHERE 1=1",
    );
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![];

    if let Some(cid) = &filter.collection_id {
        sql.push_str(" AND collection_id = ?");
        params_vec.push(Box::new(cid.clone()));
    }
    if filter.pinned_only == Some(true) {
        sql.push_str(" AND pinned = 1");
    }

    sql.push_str(" ORDER BY pinned DESC, COALESCE(used_at, created_at) DESC");

    let mut stmt = conn.prepare(&sql)?;
    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();

    let ids: Vec<String> = stmt
        .query_map(params_refs.as_slice(), |r| r.get(0))?
        .collect::<rusqlite::Result<Vec<String>>>()?;


    let filtered_ids: Vec<String> = if let Some(tag) = &filter.tag {
        let mut tag_stmt =
            conn.prepare("SELECT snippet_id FROM tags WHERE tag = ? AND snippet_id IN (SELECT id FROM snippets)")?;
        let tagged: std::collections::HashSet<String> = tag_stmt
            .query_map(params![tag], |r| r.get(0))?
            .collect::<rusqlite::Result<std::collections::HashSet<String>>>()?;
        ids.into_iter().filter(|id| tagged.contains(id)).collect()
    } else {
        ids
    };

    let mut snippets = Vec::with_capacity(filtered_ids.len());
    for id in &filtered_ids {
        if let Some(s) = get(conn, id)? {
            snippets.push(s);
        }
    }
    Ok(snippets)
}

pub fn get(conn: &Connection, id: &str) -> Result<Option<Snippet>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, body, language, description, pinned, collection_id,
                created_at, updated_at, used_at FROM snippets WHERE id = ?",
    )?;
    let mut rows = stmt.query(params![id])?;
    if let Some(row) = rows.next()? {
        let tags = load_tags(conn, id)?;
        Ok(Some(row_to_snippet(row, tags)?))
    } else {
        Ok(None)
    }
}

pub fn create(conn: &Connection, input: NewSnippet) -> Result<Snippet> {
    let id = Uuid::new_v4().to_string();
    let now = now();
    let lang = input.language.unwrap_or_else(|| "plaintext".into());
    let desc = input.description.unwrap_or_default();

    conn.execute(
        "INSERT INTO snippets (id, title, body, language, description, pinned, collection_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?7, ?7)",
        params![id, input.title, input.body, lang, desc, input.collection_id, now],
    )?;

    if let Some(tags) = &input.tags {
        set_tags_inner(conn, &id, tags)?;
    }

    get(conn, &id)?.ok_or(AppError::NotFound)
}

pub fn update(conn: &Connection, input: UpdateSnippet) -> Result<Snippet> {
    let existing = get(conn, &input.id)?.ok_or(AppError::NotFound)?;
    let now = now();

    let title = input.title.unwrap_or(existing.title);
    let body = input.body.unwrap_or(existing.body);
    let lang = input.language.unwrap_or(existing.language);
    let desc = input.description.unwrap_or(existing.description);
    let coll = match input.collection_id {
        Some(v) => v,
        None => existing.collection_id,
    };

    conn.execute(
        "UPDATE snippets SET title=?1, body=?2, language=?3, description=?4,
         collection_id=?5, updated_at=?6 WHERE id=?7",
        params![title, body, lang, desc, coll, now, input.id],
    )?;

    if let Some(tags) = &input.tags {
        set_tags_inner(conn, &input.id, tags)?;
    }

    get(conn, &input.id)?.ok_or(AppError::NotFound)
}

pub fn delete(conn: &Connection, id: &str) -> Result<()> {
    let rows = conn.execute("DELETE FROM snippets WHERE id = ?", params![id])?;
    if rows == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

pub fn toggle_pin(conn: &Connection, id: &str) -> Result<Snippet> {
    let existing = get(conn, id)?.ok_or(AppError::NotFound)?;
    let new_pinned = if existing.pinned { 0i64 } else { 1i64 };
    conn.execute(
        "UPDATE snippets SET pinned=?1, updated_at=?2 WHERE id=?3",
        params![new_pinned, now(), id],
    )?;
    get(conn, id)?.ok_or(AppError::NotFound)
}

pub fn touch_used(conn: &Connection, id: &str) -> Result<()> {
    conn.execute(
        "UPDATE snippets SET used_at=?1 WHERE id=?2",
        params![now(), id],
    )?;
    Ok(())
}

pub fn duplicate(conn: &Connection, id: &str) -> Result<Snippet> {
    let existing = get(conn, id)?.ok_or(AppError::NotFound)?;
    let new_id = Uuid::new_v4().to_string();
    let now = now();
    let title = format!("Copy of {}", existing.title);

    conn.execute(
        "INSERT INTO snippets (id, title, body, language, description, pinned, collection_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?7, ?7)",
        params![new_id, title, existing.body, existing.language, existing.description, existing.collection_id, now],
    )?;

    if !existing.tags.is_empty() {
        set_tags_inner(conn, &new_id, &existing.tags)?;
    }

    get(conn, &new_id)?.ok_or(AppError::NotFound)
}

fn set_tags_inner(conn: &Connection, snippet_id: &str, tags: &[String]) -> Result<()> {
    conn.execute("DELETE FROM tags WHERE snippet_id = ?", params![snippet_id])?;
    for tag in tags {
        let tag = tag.trim().to_lowercase();
        if !tag.is_empty() {
            conn.execute(
                "INSERT OR IGNORE INTO tags (snippet_id, tag) VALUES (?1, ?2)",
                params![snippet_id, tag],
            )?;
        }
    }
    Ok(())
}
