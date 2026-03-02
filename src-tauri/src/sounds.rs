use anyhow::{Context, Result};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

pub struct SoundData {
    pub data_url: String,
    pub file_name: String,
}

const SUPPORTED_EXTS: &[&str] = &["mp3", "wav", "ogg", "m4a", "aac"];

fn mime_for_ext(ext: &str) -> &'static str {
    match ext {
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "m4a" | "aac" => "audio/mp4",
        _ => "audio/mpeg",
    }
}

fn sounds_dir(app: &AppHandle) -> Result<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .context("Failed to get app data dir")?
        .join("sounds");
    std::fs::create_dir_all(&dir).context("Failed to create sounds directory")?;
    Ok(dir)
}

fn find_sound_file(dir: &PathBuf, sound_type: &str) -> Option<PathBuf> {
    for ext in SUPPORTED_EXTS {
        let path = dir.join(format!("{}.{}", sound_type, ext));
        if path.exists() {
            return Some(path);
        }
    }
    None
}

pub fn save_sound(app: &AppHandle, sound_type: &str, data: &[u8], file_name: &str) -> Result<()> {
    let dir = sounds_dir(app)?;

    // Delete existing files for this sound type
    for ext in SUPPORTED_EXTS {
        let path = dir.join(format!("{}.{}", sound_type, ext));
        if path.exists() {
            std::fs::remove_file(&path).ok();
        }
    }

    // Determine extension from file_name
    let ext = file_name
        .rsplit('.')
        .next()
        .map(|e| e.to_lowercase())
        .filter(|e| SUPPORTED_EXTS.contains(&e.as_str()))
        .unwrap_or_else(|| "mp3".to_string());

    let dest = dir.join(format!("{}.{}", sound_type, ext));
    std::fs::write(&dest, data).context("Failed to write sound file")?;
    Ok(())
}

pub fn get_sound(app: &AppHandle, sound_type: &str) -> Result<Option<SoundData>> {
    let dir = sounds_dir(app)?;
    let Some(path) = find_sound_file(&dir, sound_type) else {
        return Ok(None);
    };

    let data = std::fs::read(&path).context("Failed to read sound file")?;
    let encoded = STANDARD.encode(&data);

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("mp3")
        .to_lowercase();
    let mime = mime_for_ext(&ext);

    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("sound")
        .to_string();

    Ok(Some(SoundData {
        data_url: format!("data:{};base64,{}", mime, encoded),
        file_name,
    }))
}

pub fn delete_sound(app: &AppHandle, sound_type: &str) -> Result<()> {
    let dir = sounds_dir(app)?;
    if let Some(path) = find_sound_file(&dir, sound_type) {
        std::fs::remove_file(path).context("Failed to delete sound file")?;
    }
    Ok(())
}
