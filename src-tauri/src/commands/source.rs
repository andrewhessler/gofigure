use sqlx::{Pool, Sqlite};
use tauri::State;

use crate::{queries, util::CmdError};

#[tauri::command]
pub async fn get_sources(pool: State<'_, Pool<Sqlite>>) -> Result<Vec<String>, CmdError> {
    let dirs = queries::source::get_sources(&pool).await?;
    Ok(dirs)
}

#[tauri::command]
pub async fn add_sources(
    pool: State<'_, Pool<Sqlite>>,
    dirs: Vec<&str>,
) -> Result<Vec<String>, CmdError> {
    queries::source::add_sources(&pool, &dirs).await?;
    Ok(dirs.iter().map(|dir| dir.to_string()).collect())
}

#[tauri::command]
pub async fn delete_sources(
    pool: State<'_, Pool<Sqlite>>,
    dirs: Vec<&str>,
) -> Result<Vec<String>, CmdError> {
    queries::source::delete_sources(&pool, &dirs).await?;
    Ok(dirs.iter().map(|dir| dir.to_string()).collect())
}
