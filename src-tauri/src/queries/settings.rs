use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite};

#[derive(sqlx::FromRow, Serialize, Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub sound_at_15: bool,
    pub sound_at_60: bool,
    pub sound_at_half: bool,
    pub sound_on_next_image: bool,

    // no-repeat-for-n-images, no-repeat-for-session, allow-repeats-always
    // change this to an enum or something some day
    pub no_repeat_behavior: String,

    #[sqlx(try_from = "i64")]
    pub no_repeat_size: u64,
    pub review_after_session: bool,
}

pub async fn get_settings(conn: &Pool<Sqlite>) -> anyhow::Result<AppSettings> {
    let settings = sqlx::query_as(
        r"
        SELECT * FROM settings
        ",
    )
    .fetch_one(conn)
    .await?;

    Ok(settings)
}

pub async fn populate_settings(conn: &Pool<Sqlite>, settings: AppSettings) -> anyhow::Result<()> {
    sqlx::query!(
        r"
        DELETE FROM settings
        "
    )
    .execute(conn)
    .await?;

    let no_repeat_size = settings.no_repeat_size as i64;

    sqlx::query!(
        r"
        INSERT INTO settings (
            sound_at_15, 
            sound_at_60, 
            sound_at_half, 
            sound_on_next_image,
            no_repeat_behavior, 
            no_repeat_size,
            review_after_session
            )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ",
        settings.sound_at_15,
        settings.sound_at_60,
        settings.sound_at_half,
        settings.sound_on_next_image,
        settings.no_repeat_behavior,
        no_repeat_size,
        settings.review_after_session,
    )
    .execute(conn)
    .await?;

    Ok(())
}
