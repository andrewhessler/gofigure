use serde::Serialize;
use sqlx::{Pool, Sqlite};

pub struct ConfigRequest {
    pub seconds_per_image: u64,
    pub image_count: u64,
}

pub struct ConfigReturn {
    pub id: i64,
    pub seconds_per_image: i64,
    pub image_count: i64,
}

#[derive(Serialize)]
pub struct Config {
    pub id: u64,
    pub seconds_per_image: u64,
    pub image_count: u64,
}

pub async fn get_configs(conn: &Pool<Sqlite>) -> anyhow::Result<Vec<Config>> {
    let entries = sqlx::query_as!(
        ConfigReturn,
        r"
        SELECT * FROM saved_config ORDER BY id DESC LIMIT 100
        ",
    )
    .fetch_all(conn)
    .await?;

    let entries = entries
        .into_iter()
        .map(|v| Config {
            id: v.id as u64,
            seconds_per_image: v.seconds_per_image as u64,
            image_count: v.image_count as u64,
        })
        .collect();

    Ok(entries)
}

pub async fn save_config(conn: &Pool<Sqlite>, req: ConfigRequest) -> anyhow::Result<()> {
    let seconds_per_image = req.seconds_per_image as i64;
    let image_count = req.image_count as i64;
    sqlx::query!(
        r"
        INSERT INTO saved_config (seconds_per_image, image_count)
        SELECT ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM saved_config WHERE seconds_per_image = ? AND image_count = ?
        )
        ",
        seconds_per_image,
        image_count,
        seconds_per_image,
        image_count,
    )
    .execute(conn)
    .await?;

    Ok(())
}

pub async fn delete_config(conn: &Pool<Sqlite>, id: u64) -> anyhow::Result<()> {
    let id = id as i64;
    sqlx::query!(
        r"
        DELETE FROM saved_config WHERE id = ?
        ",
        id
    )
    .execute(conn)
    .await?;

    Ok(())
}
