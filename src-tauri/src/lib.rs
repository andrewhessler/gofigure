use std::fs;

use rand::seq::IteratorRandom;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_random_image_from_dir(dir: &str) -> Option<String> {
    let entries = fs::read_dir(dir).ok()?;

    let mut rng = rand::rng();
    let random_path = entries.choose(&mut rng).unwrap().unwrap();

    Some(random_path.path().to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_random_image_from_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
