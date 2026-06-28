use sqlx::{Pool, Sqlite};
use tauri::State;

use crate::{
    queries::{
        self,
        saved_config::{Config, ConfigRequest},
    },
    util::CmdError,
};

#[tauri::command]
pub async fn get_configs(conn: State<'_, Pool<Sqlite>>) -> Result<Vec<Config>, CmdError> {
    let result = queries::saved_config::get_configs(&conn).await?;
    Ok(result)
}

#[tauri::command]
pub async fn save_config(
    conn: State<'_, Pool<Sqlite>>,
    seconds_per_image: u64,
    image_count: u64,
) -> Result<(), CmdError> {
    queries::saved_config::save_config(
        &conn,
        ConfigRequest {
            image_count,
            seconds_per_image,
        },
    )
    .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_config(conn: State<'_, Pool<Sqlite>>, id: u64) -> Result<(), CmdError> {
    queries::saved_config::delete_config(&conn, id).await?;

    Ok(())
}
