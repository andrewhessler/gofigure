use std::time::{SystemTime, UNIX_EPOCH};

use sqlx::{Pool, Sqlite};

pub struct HistoryEntryRequest {
    pub seconds_per_image: u64,
    pub images: Vec<String>,
}

pub async fn save_history_entry(
    conn: &Pool<Sqlite>,
    entry: HistoryEntryRequest,
) -> anyhow::Result<i64> {
    let time_now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;
    let seconds_per_image = entry.seconds_per_image as i64;
    let images = entry.images.join("|");

    let result = sqlx::query!(
        r"
        INSERT INTO session_history (completed_timestamp, seconds_per_image, images)
        VALUES (?, ?, ?)
        ",
        time_now,
        seconds_per_image,
        images,
    )
    .execute(conn)
    .await?;

    Ok(result.last_insert_rowid())
}
