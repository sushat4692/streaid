use anyhow::{Context, Result};
use std::path::{Path, PathBuf};

#[derive(serde::Serialize)]
pub struct SoundFile {
    pub path: PathBuf,
    pub file_name: String,
}

const SUPPORTED_EXTS: &[&str] = &["mp3", "wav", "ogg", "m4a", "aac"];

fn sounds_dir() -> Result<PathBuf> {
    let dir = crate::app_data_dir().join("sounds");
    std::fs::create_dir_all(&dir).context("Failed to create sounds directory")?;
    Ok(dir)
}

fn find_sound_file(dir: &Path, sound_type: &str) -> Option<PathBuf> {
    for ext in SUPPORTED_EXTS {
        let path = dir.join(format!("{}.{}", sound_type, ext));
        if path.exists() {
            return Some(path);
        }
    }
    None
}

pub fn save_sound(sound_type: &str, data: &[u8], file_name: &str) -> Result<()> {
    let dir = sounds_dir()?;

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

pub fn get_sound(sound_type: &str) -> Result<Option<SoundFile>> {
    let dir = sounds_dir()?;
    let Some(path) = find_sound_file(&dir, sound_type) else {
        return Ok(None);
    };

    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("sound")
        .to_string();

    Ok(Some(SoundFile { path, file_name }))
}

pub fn delete_sound(sound_type: &str) -> Result<()> {
    let dir = sounds_dir()?;
    if let Some(path) = find_sound_file(&dir, sound_type) {
        std::fs::remove_file(path).context("Failed to delete sound file")?;
    }
    Ok(())
}
