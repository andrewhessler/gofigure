use sqlx::{Pool, QueryBuilder, Sqlite};

pub async fn populate_repeat_cache(conn: &Pool<Sqlite>, dirs: Vec<String>) -> anyhow::Result<()> {
    sqlx::query!(
        r"
        DELETE FROM repeat_cache
        "
    )
    .execute(conn)
    .await?;

    if dirs.is_empty() {
        return Ok(());
    }

    let mut qb = QueryBuilder::new("INSERT INTO repeat_cache (path, sort) ");
    qb.push_values(dirs.iter().enumerate(), |mut b, (idx, dir)| {
        b.push_bind(dir);
        b.push_bind(idx as i64);
    });

    qb.build().execute(conn).await?;

    Ok(())
}

pub async fn get_repeat_cache(conn: &Pool<Sqlite>) -> anyhow::Result<Vec<String>> {
    let cache = sqlx::query_scalar!(
        r"
        SELECT path FROM repeat_cache ORDER BY sort ASC
        "
    )
    .fetch_all(conn)
    .await?;

    Ok(cache)
}
