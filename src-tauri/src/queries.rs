use sqlx::{Pool, QueryBuilder, Sqlite};

pub fn add_sources(conn: &Pool<Sqlite>, dirs: &Vec<&str>) -> anyhow::Result<()> {
    if dirs.is_empty() {
        return Ok(());
    }
    pollster::block_on(async {
        let mut qb = QueryBuilder::new("INSERT INTO image_sources (path) ");
        qb.push_values(dirs.iter(), |mut b, dir| {
            b.push_bind(dir);
        });

        qb.build().execute(conn).await?;

        Ok(())
    })
}

pub fn get_sources(conn: &Pool<Sqlite>) -> anyhow::Result<Vec<String>> {
    pollster::block_on(async {
        let dirs = sqlx::query!(
            r"
            SELECT path FROM image_sources
            "
        );
        Ok(vec![])
    })
}
