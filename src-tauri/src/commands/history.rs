use sqlx::{Pool, Sqlite};
use tauri::State;

use crate::{
    queries::{self, history::HistoryEntry},
    util::CmdError,
};

#[tauri::command]
pub async fn get_history(pool: State<'_, Pool<Sqlite>>) -> Result<Vec<HistoryEntry>, CmdError> {
    let entries = queries::history::get_history(&pool).await?;
    Ok(entries)
}
