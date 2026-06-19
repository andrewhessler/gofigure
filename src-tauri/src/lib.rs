use std::sync::Mutex;

use rand::seq::IndexedRandom;
use tauri::Manager;
use tauri::State;
use walkdir::WalkDir;

struct AppData {
    session_running: bool,
    current_image_idx: usize,
    greatest_idx: usize,
    path_history: Vec<String>,
    image_pool: Vec<String>,
}

#[tauri::command]
fn start_session(state: State<'_, Mutex<AppData>>, dirs: Vec<&str>) -> (String, usize) {
    let mut st = state.lock().expect("Can get state for starting session");
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

    let mut rng = rand::rng();

    let random_path = st.image_pool.choose(&mut rng).unwrap().to_owned();

    st.path_history.push(random_path.clone());

    (random_path, 0) // cheat and return 0 idx for starting session...
}

#[tauri::command]
fn next_image(state: State<'_, Mutex<AppData>>) -> (String, usize) {
    // Choose the next image
    // Check if new idx, otherwise grab from path_history
    // if new, update idx, grab new path, update history, update greatest

    let mut st = state.lock().expect("Can get state for next image");

    // Check if we're backwards in history
    if st.current_image_idx < st.greatest_idx {
        st.current_image_idx += 1;

        return (
            st.path_history[st.current_image_idx].to_owned(),
            st.current_image_idx,
        );
    }

    // Otherwise grab another image
    let mut rng = rand::rng();
    let random_path = st.image_pool.choose(&mut rng).unwrap().to_owned();

    st.current_image_idx += 1;
    st.greatest_idx += 1;

    st.path_history.push(random_path.clone());

    (random_path, st.current_image_idx)
}

#[tauri::command]
fn previous_image(state: State<'_, Mutex<AppData>>) -> (String, usize) {
    let mut st = state.lock().expect("Can get state for previous image");
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
    let mut st = state.lock().expect("Can read state for previous image");
    if st.current_image_idx == st.greatest_idx {
        // replace last image with a new path, idx stays the same
        st.path_history.pop();
        let mut rng = rand::rng();
        let random_path = st.image_pool.choose(&mut rng).unwrap().to_owned();

        return (random_path, st.current_image_idx);
    }
    // otherwise just move forward like next would
    st.current_image_idx += 1;
    (
        st.path_history[st.current_image_idx].to_owned(),
        st.current_image_idx,
    )
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppData {
                session_running: false,
                current_image_idx: 0,
                greatest_idx: 0,
                path_history: vec![],
                image_pool: vec![],
            }));
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            start_session,
            next_image,
            previous_image,
            skip_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
