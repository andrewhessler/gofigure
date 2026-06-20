use std::collections::VecDeque;
use std::sync::Mutex;

use rand::seq::IndexedRandom;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::Pool;
use sqlx::Sqlite;
use sqlx::SqlitePool;
use tauri::Manager;
use tauri::State;
use walkdir::WalkDir;

mod queries;

struct AppData {
    session_running: bool,
    current_image_idx: usize,
    greatest_idx: usize,
    path_history: Vec<String>,
    image_pool: Vec<String>,
    repeat_cache: VecDeque<String>,
}

const REPEAT_CACHE_SIZE: usize = 100;

fn get_new_image(image_pool: &mut Vec<String>, repeat_cache: &mut VecDeque<String>) -> String {
    let mut rng = rand::rng();
    let new_image_path: String;

    if repeat_cache.len() >= REPEAT_CACHE_SIZE {
        let freed_image_path = repeat_cache
            .pop_front()
            .expect("Repeat Cache should contain path to pop");
        image_pool.push(freed_image_path);
    }

    if !image_pool.is_empty() {
        println!("Grabbing from image_pool");
        new_image_path = image_pool.choose(&mut rng).unwrap().to_owned();
        repeat_cache.push_back(new_image_path.clone());
        image_pool.retain(|v| *v != new_image_path);
    } else if !repeat_cache.is_empty() {
        println!("Grabbing from repeat_cache");
        new_image_path = repeat_cache.pop_front().unwrap();
        repeat_cache.push_back(new_image_path.clone());
    } else {
        panic!(
            "No images to serve from repeat cache or image_pool, presumably no sources provided"
        );
    }

    new_image_path
}

#[tauri::command]
fn start_session(state: State<'_, Mutex<AppData>>, dirs: Vec<&str>) -> (String, usize) {
    let st = &mut *state
        .lock()
        .expect("State should be accessible for starting session");
    st.session_running = true;
    st.current_image_idx = 0;
    st.greatest_idx = 0;
    st.path_history = vec![];
    st.image_pool = vec![];

    for dir in dirs {
        st.image_pool.extend(
            WalkDir::new(dir)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().is_file())
                .map(|e| e.path().to_string_lossy().to_string())
                .collect::<Vec<String>>(),
        );
    }

    let new_image_path = get_new_image(&mut st.image_pool, &mut st.repeat_cache);

    st.path_history.push(new_image_path.clone());

    (new_image_path, 0) // cheat and return 0 idx for starting session...
}

#[tauri::command]
fn next_image(state: State<'_, Mutex<AppData>>) -> (String, usize) {
    // Choose the next image
    // Check if new idx, otherwise grab from path_history
    // if new, update idx, grab new path, update history, update greatest

    let st = &mut *state
        .lock()
        .expect("State should be accessible for next image");

    // Check if we're backwards in history
    if st.current_image_idx < st.greatest_idx {
        st.current_image_idx += 1;

        return (
            st.path_history[st.current_image_idx].to_owned(),
            st.current_image_idx,
        );
    }

    // Otherwise grab another image
    let new_image_path = get_new_image(&mut st.image_pool, &mut st.repeat_cache);

    st.current_image_idx += 1;
    st.greatest_idx += 1;

    st.path_history.push(new_image_path.clone());

    (new_image_path, st.current_image_idx)
}

#[tauri::command]
fn previous_image(state: State<'_, Mutex<AppData>>) -> (String, usize) {
    let mut st = state
        .lock()
        .expect("State should be accessible for previous image");
    if st.current_image_idx > 0 {
        st.current_image_idx -= 1;
        return (
            st.path_history[st.current_image_idx].to_owned(),
            st.current_image_idx,
        );
    }

    (
        st.path_history[st.current_image_idx].to_owned(),
        st.current_image_idx,
    )
}

#[tauri::command]
fn skip_image(state: State<'_, Mutex<AppData>>) -> (String, usize) {
    let st = &mut *state
        .lock()
        .expect("State should be accessible for skip image");
    if st.current_image_idx == st.greatest_idx {
        // replace last image with a new path, idx stays the same
        st.path_history.pop();
        let new_image_path = get_new_image(&mut st.image_pool, &mut st.repeat_cache);

        return (new_image_path, st.current_image_idx);
    }
    // otherwise just move forward like next would
    st.current_image_idx += 1;
    (
        st.path_history[st.current_image_idx].to_owned(),
        st.current_image_idx,
    )
}

#[tauri::command]
async fn get_sources(pool: State<'_, Pool<Sqlite>>) -> Result<Vec<String>, CmdError> {
    let dirs = queries::get_sources(&pool).await?;
    Ok(dirs)
}

#[tauri::command]
async fn add_sources(
    pool: State<'_, Pool<Sqlite>>,
    dirs: Vec<&str>,
) -> Result<Vec<String>, CmdError> {
    queries::add_sources(&pool, &dirs).await?;
    Ok(dirs.iter().map(|dir| dir.to_string()).collect())
}

#[tauri::command]
async fn delete_sources(
    pool: State<'_, Pool<Sqlite>>,
    dirs: Vec<&str>,
) -> Result<Vec<String>, CmdError> {
    queries::delete_sources(&pool, &dirs).await?;
    Ok(dirs.iter().map(|dir| dir.to_string()).collect())
}

#[derive(Debug, thiserror::Error)]
#[error(transparent)]
struct CmdError(#[from] anyhow::Error);

impl serde::Serialize for CmdError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.0.to_string())
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app
                .handle()
                .path()
                .app_data_dir()
                .expect("Data dir should be accessible");

            std::fs::create_dir_all(&app_dir).expect("App data dir should be creatable");

            let connection_options = SqliteConnectOptions::new()
                .filename(app_dir.join("gofigure.db"))
                .create_if_missing(true);

            let pool = tauri::async_runtime::block_on(SqlitePool::connect_with(connection_options))
                .expect("Sqlite connection should be successful");

            tauri::async_runtime::block_on(sqlx::migrate!("./migrations").run(&pool))
                .expect("migrations should be able to run");

            // Allow accessing images in source directories
            let sources: Vec<String> = tauri::async_runtime::block_on(
                sqlx::query_scalar("SELECT path FROM image_sources").fetch_all(&pool),
            )
            .expect("image sources should be queryable");

            let scope = app.asset_protocol_scope();
            for dir in &sources {
                scope
                    .allow_directory(dir, true)
                    .expect("source directory should be allowable");
            }
            // ---

            app.manage(pool);
            app.manage(Mutex::new(AppData {
                session_running: false,
                current_image_idx: 0,
                greatest_idx: 0,
                path_history: vec![],
                image_pool: vec![],
                repeat_cache: VecDeque::new(),
            }));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_session,
            next_image,
            previous_image,
            skip_image,
            get_sources,
            add_sources,
            delete_sources,
        ])
        .run(tauri::generate_context!())
        .expect("Tauri application should successfully start");
}
