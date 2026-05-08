pub mod collections;
pub mod schema;
pub mod search;
pub mod snippets;
pub mod tags;

use rusqlite::Connection;
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);
