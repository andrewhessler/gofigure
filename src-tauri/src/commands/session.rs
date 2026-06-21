use std::{collections::VecDeque, sync::Mutex};

use rand::seq::IndexedRandom;
use sqlx::{Pool, Sqlite};
use tauri::State;
use walkdir::WalkDir;

use crate::{
    queries::{self, history::HistoryEntryRequest},
    util::CmdError,
    AppData,
};

const REPEAT_CACHE_SIZE: usize = 20;

fn get_new_image(image_pool: &mut Vec<String>, repeat_cache: &mut VecDeque<String>) -> String {
    // might want active_image_pool and image_pool to check if the things being popped off
    // repeat_cache are even part of the current session...
    let mut rng = rand::rng();
    let new_image_path: String;

    if repeat_cache.len() > REPEAT_CACHE_SIZE {
        let freed_image_path = repeat_cache
            .pop_front()
            .expect("Repeat Cache should contain path to pop");
        image_pool.push(freed_image_path);
    }

    if !image_pool.is_empty() {
        new_image_path = image_pool.choose(&mut rng).unwrap().to_owned();
        repeat_cache.push_back(new_image_path.clone());
        image_pool.retain(|v| *v != new_image_path);
    } else if !repeat_cache.is_empty() {
        new_image_path = repeat_cache.pop_front().unwrap();
        repeat_cache.push_back(new_image_path.clone());
    } else {
        panic!(
            "No images to serve from repeat_cache or image_pool, presumably no sources provided"
        );
    }

    println!("repeat cache iter: {:?}", repeat_cache);

    new_image_path
}

#[tauri::command]
pub async fn start_session(
    state: State<'_, Mutex<AppData>>,
    conn: State<'_, Pool<Sqlite>>,
    dirs: Vec<&str>,
) -> Result<(String, u64), CmdError> {
    let repeat_cache = queries::repeat_cache::get_repeat_cache(&conn).await?;

    let st = &mut *state
        .lock()
        .expect("State should be accessible for starting session");
    st.session_running = true;
    st.current_image_idx = 0;
    st.greatest_idx = 0;
    st.path_history = vec![];
    st.image_pool = vec![];
    st.repeat_cache = repeat_cache.into();
    println!("repeat cache: {:?}", st.repeat_cache);

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

    println!("image_pool: {:?}", st.image_pool);
    st.image_pool.retain(|dir| !st.repeat_cache.contains(dir)); // :grimace:
    println!("image_pool: {:?}", st.image_pool);

    let new_image_path = get_new_image(&mut st.image_pool, &mut st.repeat_cache);

    st.path_history.push(new_image_path.clone());

    Ok((new_image_path, 0)) // cheat and return 0 idx for starting session...
}

#[tauri::command]
pub async fn end_session(
    state: State<'_, Mutex<AppData>>,
    conn: State<'_, Pool<Sqlite>>,
    seconds_per_image: u64,
) -> Result<Vec<String>, CmdError> {
    // set session_running to false
    // write repeat cache
    // write session history
    let (images, repeat_cache) = {
        let st = &mut *state
            .lock()
            .expect("State should be accessible for starting session");
        st.session_running = false;
        (st.path_history.clone(), st.repeat_cache.clone())
    };
    println!("end session repeat cache: {:?}", repeat_cache);

    queries::history::save_history_entry(
        &conn,
        HistoryEntryRequest {
            images: images.clone(),
            seconds_per_image,
        },
    )
    .await?;

    let _ = queries::repeat_cache::populate_repeat_cache(&conn, Vec::from(repeat_cache)).await;

    Ok(images)
}

#[tauri::command]
pub fn next_image(state: State<'_, Mutex<AppData>>) -> (String, usize) {
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
pub fn prev_image(state: State<'_, Mutex<AppData>>) -> (String, usize) {
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
pub fn skip_image(state: State<'_, Mutex<AppData>>) -> (String, usize) {
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
