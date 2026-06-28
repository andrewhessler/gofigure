use sqlx::{Pool, QueryBuilder, Sqlite};

pub async fn get_sources(conn: &Pool<Sqlite>) -> anyhow::Result<Vec<String>> {
    let dirs = sqlx::query_scalar(
        r"
        SELECT path FROM image_sources
        ",
    )
    .fetch_all(conn)
    .await?;

    Ok(dirs)
}

pub async fn add_sources(conn: &Pool<Sqlite>, dirs: &Vec<&str>) -> anyhow::Result<()> {
    if dirs.is_empty() {
        return Ok(());
    }

    let mut qb = QueryBuilder::new("INSERT INTO image_sources (path) ");
    qb.push_values(dirs.iter(), |mut b, dir| {
        b.push_bind(dir);
    });

    qb.build().execute(conn).await?;

    Ok(())
}

pub async fn delete_sources(conn: &Pool<Sqlite>, dirs: &Vec<&str>) -> anyhow::Result<()> {
    if dirs.is_empty() {
        return Ok(());
    }
    let mut qb = QueryBuilder::new("DELETE FROM image_sources WHERE path IN (");
    let mut separated = qb.separated(", ");
    for dir in dirs.iter() {
        separated.push_bind(dir);
    }
    separated.push_unseparated(") ");

    qb.build().execute(conn).await?;

    Ok(())
}
