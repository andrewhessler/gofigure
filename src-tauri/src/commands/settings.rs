use std::sync::Mutex;

use sqlx::{Pool, Sqlite};
use tauri::State;

use crate::{
    queries::{self, settings::AppSettings},
    util::CmdError,
    AppData,
};

#[tauri::command]
pub async fn save_settings(
    state: State<'_, Mutex<AppData>>,
    pool: State<'_, Pool<Sqlite>>,
    settings: AppSettings,
) -> Result<(), CmdError> {
    queries::settings::populate_settings(&pool, settings.clone()).await?;
    let st = &mut *state
        .lock()
        .expect("State should be accessible for syncing settings");
    st.settings = settings;
    Ok(())
}

#[tauri::command]
pub async fn get_settings(
    state: State<'_, Mutex<AppData>>,
    pool: State<'_, Pool<Sqlite>>,
) -> Result<AppSettings, CmdError> {
    let settings = queries::settings::get_settings(&pool).await?;
    let st = &mut *state
        .lock()
        .expect("State should be accessible for syncing settings");
    st.settings = settings.clone();
    Ok(settings)
}
