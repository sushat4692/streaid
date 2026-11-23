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

/// Current slot names replaced the old `first` / `remaining` names. Keep
/// reading the old files so existing users do not lose their sounds.
fn legacy_alias(sound_type: &str) -> Option<&'static str> {
    match sound_type {
        "chatter" => Some("first"),
        "chat" => Some("remaining"),
        _ => None,
    }
}

fn find_sound_file_with_alias(dir: &Path, sound_type: &str) -> Option<PathBuf> {
    find_sound_file(dir, sound_type)
        .or_else(|| legacy_alias(sound_type).and_then(|alias| find_sound_file(dir, alias)))
}

fn remove_sound_files(dir: &Path, sound_type: &str) {
    for ext in SUPPORTED_EXTS {
        let path = dir.join(format!("{}.{}", sound_type, ext));
        if path.exists() {
            std::fs::remove_file(&path).ok();
        }
    }
}

pub fn save_sound(sound_type: &str, data: &[u8], file_name: &str) -> Result<()> {
    let dir = sounds_dir()?;

    // Delete existing files for this sound type (including the legacy alias).
    remove_sound_files(&dir, sound_type);
    if let Some(alias) = legacy_alias(sound_type) {
        remove_sound_files(&dir, alias);
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
    let Some(path) = find_sound_file_with_alias(&dir, sound_type) else {
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
    remove_sound_files(&dir, sound_type);
    if let Some(alias) = legacy_alias(sound_type) {
        remove_sound_files(&dir, alias);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_legacy_aliases() {
        assert_eq!(legacy_alias("chatter"), Some("first"));
        assert_eq!(legacy_alias("chat"), Some("remaining"));
        assert_eq!(legacy_alias("raid"), None);
    }
}
