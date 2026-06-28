use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;
use sqlx::{Pool, Sqlite};

pub struct HistoryEntryRequest {
    pub seconds_per_image: u64,
    pub images: Vec<String>,
}

pub struct HistoryReturn {
    pub id: i64,
    pub completed_timestamp: i64,
    pub seconds_per_image: i64,
    pub images: String,
}

#[derive(Serialize)]
pub struct HistoryEntry {
    pub id: u64,
    pub completed_timestamp: u64,
    pub seconds_per_image: u64,
    pub images: Vec<String>,
}

pub async fn get_history(conn: &Pool<Sqlite>) -> anyhow::Result<Vec<HistoryEntry>> {
    let entries = sqlx::query_as!(
        HistoryReturn,
        r"
        SELECT * FROM session_history ORDER BY completed_timestamp DESC LIMIT 100
        ",
    )
    .fetch_all(conn)
    .await?;

    let entries = entries
        .into_iter()
        .map(|v| HistoryEntry {
            id: v.id as u64,
            completed_timestamp: v.completed_timestamp as u64,
            seconds_per_image: v.seconds_per_image as u64,
            images: v
                .images
                .split("|")
                .map(|v| v.to_string())
                .collect::<Vec<String>>(),
        })
        .collect();

    Ok(entries)
}

pub async fn save_history_entry(
    conn: &Pool<Sqlite>,
    entry: HistoryEntryRequest,
) -> anyhow::Result<i64> {
    let time_now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("System time should be accessible")
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
