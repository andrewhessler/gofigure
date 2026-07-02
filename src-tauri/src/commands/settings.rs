use std::sync::Mutex;

use sqlx::{Pool, Sqlite};
use tauri::{Manager, State, Theme};

use crate::{
    queries::{self, settings::AppSettings},
    util::CmdError,
    AppData,
};

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

#[tauri::command]
pub async fn save_settings(
    app_handle: tauri::AppHandle,
    state: State<'_, Mutex<AppData>>,
    pool: State<'_, Pool<Sqlite>>,
    settings: AppSettings,
) -> Result<(), CmdError> {
    let (prev_repeat_behavior, prev_theme) = {
        let st = &mut *state
            .lock()
            .expect("State should be accessible for syncing settings");
        (
            st.settings.no_repeat_behavior.clone(),
            st.settings.theme.clone(),
        )
    };
    queries::settings::populate_settings(&pool, settings.clone()).await?;

    let window = app_handle
        .get_webview_window("main")
        .expect("should be able to access window for theme update");

    if prev_theme != settings.theme {
        window
            .set_theme(get_theme(&settings.theme))
            .expect("should be able to set theme");
    }

    let repeat_cache = {
        let st = &mut *state
            .lock()
            .expect("State should be accessible for syncing settings");
        st.settings = settings;

        if prev_repeat_behavior == st.settings.no_repeat_behavior {
            return Ok(());
        } else if st.settings.no_repeat_behavior == "no-repeat-for-n-images" {
            st.repeat_cache
                .truncate(st.settings.no_repeat_size as usize); // allowed by push_front, pop_back
        } else if st.settings.no_repeat_behavior == "no-repeat-for-session"
            || st.settings.no_repeat_behavior == "allow-repeats-always"
        {
            st.repeat_cache.clear();
        }

        st.repeat_cache.clone()
    };

    queries::repeat_cache::populate_repeat_cache(&pool, Vec::from(repeat_cache)).await?;

    Ok(())
}

pub fn get_theme(theme_string: &str) -> Option<Theme> {
    match theme_string {
        "light" => Some(Theme::Light),
        "dark" => Some(Theme::Dark),
        "system" => None,
        _ => None,
    }
}
