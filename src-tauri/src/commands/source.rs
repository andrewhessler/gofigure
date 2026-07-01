use sqlx::{Pool, Sqlite};
use tauri::State;

use crate::{
    queries::{self, source::Source},
    util::CmdError,
};

#[tauri::command]
pub async fn get_sources(conn: State<'_, Pool<Sqlite>>) -> Result<Vec<Source>, CmdError> {
    let srcs = queries::source::get_sources(&conn).await?;
    Ok(srcs)
}

#[tauri::command]
pub async fn add_sources(
    conn: State<'_, Pool<Sqlite>>,
    dirs: Vec<&str>,
) -> Result<Vec<Source>, CmdError> {
    queries::source::add_sources(&conn, &dirs).await?;
    Ok(dirs
        .iter()
        .map(|dir| Source {
            path: dir.to_string(),
            active: true,
        })
        .collect())
}

#[tauri::command]
pub async fn enable_source(conn: State<'_, Pool<Sqlite>>, path: &str) -> Result<(), CmdError> {
    queries::source::set_active(&conn, path, true).await?;
    Ok(())
}

#[tauri::command]
pub async fn disable_source(conn: State<'_, Pool<Sqlite>>, path: &str) -> Result<(), CmdError> {
    queries::source::set_active(&conn, path, false).await?;
    Ok(())
}

#[tauri::command]
pub async fn delete_sources(
    conn: State<'_, Pool<Sqlite>>,
    dirs: Vec<&str>,
) -> Result<Vec<String>, CmdError> {
    queries::source::delete_sources(&conn, &dirs).await?;
    Ok(dirs.iter().map(|dir| dir.to_string()).collect())
}
