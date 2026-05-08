use crate::error::Result;
use rusqlite::Connection;

pub fn migrate(conn: &Connection) -> Result<()> {
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS collections (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL UNIQUE,
            color      TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS snippets (
            id            TEXT PRIMARY KEY,
            title         TEXT NOT NULL,
            body          TEXT NOT NULL,
            language      TEXT NOT NULL DEFAULT 'plaintext',
            description   TEXT NOT NULL DEFAULT '',
            pinned        INTEGER NOT NULL DEFAULT 0,
            collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL,
            created_at    TEXT NOT NULL,
            updated_at    TEXT NOT NULL,
            used_at       TEXT
        );

        CREATE TABLE IF NOT EXISTS tags (
            snippet_id TEXT NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
            tag        TEXT NOT NULL,
            PRIMARY KEY (snippet_id, tag)
        );

        CREATE INDEX IF NOT EXISTS idx_tags_tag
            ON tags(tag);
        CREATE INDEX IF NOT EXISTS idx_snippets_pinned
            ON snippets(pinned, used_at DESC);
        CREATE INDEX IF NOT EXISTS idx_snippets_collection
            ON snippets(collection_id);

        CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
            title, body, description,
            content='snippets',
            content_rowid='rowid',
            tokenize='porter unicode61'
        );

        CREATE TRIGGER IF NOT EXISTS snippets_ai
        AFTER INSERT ON snippets BEGIN
            INSERT INTO snippets_fts(rowid, title, body, description)
            VALUES (new.rowid, new.title, new.body, new.description);
        END;

        CREATE TRIGGER IF NOT EXISTS snippets_ad
        AFTER DELETE ON snippets BEGIN
            INSERT INTO snippets_fts(snippets_fts, rowid, title, body, description)
            VALUES ('delete', old.rowid, old.title, old.body, old.description);
        END;

        CREATE TRIGGER IF NOT EXISTS snippets_au
        AFTER UPDATE ON snippets BEGIN
            INSERT INTO snippets_fts(snippets_fts, rowid, title, body, description)
            VALUES ('delete', old.rowid, old.title, old.body, old.description);
            INSERT INTO snippets_fts(rowid, title, body, description)
            VALUES (new.rowid, new.title, new.body, new.description);
        END;
        ",
    )?;

    Ok(())
}
