//! Small JSON stores for user-managed data.
//!
//! Files live in the app data dir and are written atomically (temp file +
//! rename), matching `vocabulary.rs`. Unit tests use a process-specific temp
//! directory so they never touch real user data.

use anyhow::{Context, Result};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

const MAX_RAIDERS: usize = 500;

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CommandAllow {
    Broadcaster,
    Mod,
    Vip,
    #[default]
    Everyone,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRecord {
    #[serde(default)]
    pub id: String,
    pub command: String,
    pub body: String,
    #[serde(default)]
    pub memo: String,
    #[serde(default)]
    pub allow: CommandAllow,
    #[serde(default)]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoRecord {
    #[serde(default)]
    pub id: String,
    pub username: String,
    #[serde(default)]
    pub nickname: String,
    #[serde(default)]
    pub memo: String,
    #[serde(default)]
    pub created_at: String,
    #[serde(default)]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RaiderRecord {
    #[serde(default)]
    pub id: String,
    pub channel: String,
    pub username: String,
    pub display_name: String,
    pub viewers: u64,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    /// "system" | "en" | "ja"
    #[serde(default = "default_locale")]
    pub locale: String,
    #[serde(default = "default_true")]
    pub notifications_enabled: bool,
    #[serde(default = "default_shoutout_message")]
    pub shoutout_message: String,
    #[serde(default = "default_shoutout_not_found")]
    pub shoutout_not_found: String,
    #[serde(default = "default_shoutout_failed")]
    pub shoutout_failed: String,
    #[serde(default = "default_info_length")]
    pub shoutout_info_length: u64,
    #[serde(default)]
    pub discord_webhook: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            locale: default_locale(),
            notifications_enabled: true,
            shoutout_message: default_shoutout_message(),
            shoutout_not_found: default_shoutout_not_found(),
            shoutout_failed: default_shoutout_failed(),
            shoutout_info_length: default_info_length(),
            discord_webhook: String::new(),
        }
    }
}

fn default_locale() -> String {
    "system".to_string()
}

fn default_true() -> bool {
    true
}

fn default_shoutout_message() -> String {
    "Please check this Recommended Streamer \"%username%\". %url% The last streaming was \"%category%\".".to_string()
}

fn default_shoutout_not_found() -> String {
    "Target user \"%user_id%\" wasn't found, please check again.".to_string()
}

fn default_shoutout_failed() -> String {
    "Failed to get Channel information of \"%username%\" channel, please try again later."
        .to_string()
}

fn default_info_length() -> u64 {
    8
}

/// Directory for user-managed JSON data. Tests use a temp dir.
fn store_dir() -> PathBuf {
    #[cfg(test)]
    {
        std::env::temp_dir().join(format!("streaid-store-test-{}", std::process::id()))
    }
    #[cfg(not(test))]
    {
        crate::app_data_dir()
    }
}

fn commands_path() -> PathBuf {
    store_dir().join("commands.json")
}

fn memos_path() -> PathBuf {
    store_dir().join("memos.json")
}

fn raiders_path() -> PathBuf {
    store_dir().join("raiders.json")
}

fn settings_path() -> PathBuf {
    store_dir().join("settings.json")
}

fn now_rfc3339() -> String {
    chrono::Utc::now().to_rfc3339()
}

static ID_COUNTER: AtomicU64 = AtomicU64::new(0);

fn new_id(prefix: &str) -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let counter = ID_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("{}-{}-{}", prefix, nanos, counter)
}

fn load_json<T: DeserializeOwned + Default>(path: &Path) -> T {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|json| serde_json::from_str(&json).ok())
        .unwrap_or_default()
}

fn save_json<T: Serialize>(path: &Path, value: &T) -> Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).context("creating store directory")?;
    }
    let tmp = path.with_extension("json.tmp");
    let json = serde_json::to_string_pretty(value).context("serializing store")?;
    std::fs::write(&tmp, json).context("writing store temp file")?;
    std::fs::rename(&tmp, path).context("renaming store file")?;
    Ok(())
}

// ── Commands ────────────────────────────────────────────────────────────────

pub fn list_commands() -> Vec<CommandRecord> {
    let mut records: Vec<CommandRecord> = load_json(&commands_path());
    records.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    records
}

pub fn save_command(mut record: CommandRecord) -> Result<Vec<CommandRecord>> {
    let mut records = list_commands();
    if record.id.is_empty() {
        record.id = new_id("cmd");
        record.command = record.command.trim().trim_start_matches('!').to_string();
        record.created_at = now_rfc3339();
        records.push(record);
    } else if let Some(existing) = records.iter_mut().find(|item| item.id == record.id) {
        record.command = record.command.trim().trim_start_matches('!').to_string();
        record.created_at = existing.created_at.clone();
        *existing = record;
    } else {
        record.command = record.command.trim().trim_start_matches('!').to_string();
        record.created_at = now_rfc3339();
        records.push(record);
    }
    records.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    save_json(&commands_path(), &records)?;
    Ok(records)
}

pub fn delete_command(id: &str) -> Result<Vec<CommandRecord>> {
    let mut records = list_commands();
    records.retain(|record| record.id != id);
    save_json(&commands_path(), &records)?;
    Ok(records)
}

// ── User memos ──────────────────────────────────────────────────────────────

pub fn list_memos() -> Vec<MemoRecord> {
    let mut records: Vec<MemoRecord> = load_json(&memos_path());
    records.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    records
}

/// Upsert by username (matching the Electron app).
pub fn save_memo(mut record: MemoRecord) -> Result<Vec<MemoRecord>> {
    let mut records = list_memos();
    let now = now_rfc3339();
    let existing_index = if record.id.is_empty() {
        records
            .iter()
            .position(|item| item.username == record.username)
    } else {
        records.iter().position(|item| item.id == record.id)
    };

    if let Some(index) = existing_index {
        let existing = &mut records[index];
        record.id = existing.id.clone();
        record.created_at = existing.created_at.clone();
        record.updated_at = now;
        *existing = record;
    } else {
        record.id = new_id("memo");
        record.created_at = now.clone();
        record.updated_at = now;
        records.push(record);
    }

    records.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    save_json(&memos_path(), &records)?;
    Ok(records)
}

pub fn delete_memo(id: &str) -> Result<Vec<MemoRecord>> {
    let mut records = list_memos();
    records.retain(|record| record.id != id);
    save_json(&memos_path(), &records)?;
    Ok(records)
}

// ── Raiders ─────────────────────────────────────────────────────────────────

pub fn list_raiders() -> Vec<RaiderRecord> {
    load_json(&raiders_path())
}

pub fn add_raider(
    channel: &str,
    username: &str,
    display_name: &str,
    viewers: u64,
    timestamp: &str,
) -> Result<()> {
    let mut records: Vec<RaiderRecord> = list_raiders();
    records.insert(
        0,
        RaiderRecord {
            id: new_id("raid"),
            channel: channel.to_string(),
            username: username.to_string(),
            display_name: display_name.to_string(),
            viewers,
            timestamp: timestamp.to_string(),
        },
    );
    records.truncate(MAX_RAIDERS);
    save_json(&raiders_path(), &records)
}

pub fn delete_raider(id: &str) -> Result<Vec<RaiderRecord>> {
    let mut records = list_raiders();
    records.retain(|record| record.id != id);
    save_json(&raiders_path(), &records)?;
    Ok(records)
}

// ── Settings ────────────────────────────────────────────────────────────────

pub fn load_settings() -> Settings {
    load_json(&settings_path())
}

pub fn save_settings(settings: &Settings) -> Result<()> {
    save_json(&settings_path(), settings)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    static TEST_LOCK: Mutex<()> = Mutex::new(());

    fn reset() -> std::sync::MutexGuard<'static, ()> {
        let guard = TEST_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        for path in [
            commands_path(),
            memos_path(),
            raiders_path(),
            settings_path(),
        ] {
            let _ = std::fs::remove_file(path);
        }
        guard
    }

    #[test]
    fn store_dir_is_isolated_from_app_data() {
        assert_ne!(store_dir(), crate::app_data_dir());
    }

    #[test]
    fn command_crud_roundtrip() {
        let _guard = reset();
        let saved = save_command(CommandRecord {
            id: String::new(),
            command: "!hello".to_string(),
            body: "Hi!".to_string(),
            memo: "greeting".to_string(),
            allow: CommandAllow::Everyone,
            created_at: String::new(),
        })
        .unwrap();
        assert_eq!(saved.len(), 1);
        assert_eq!(saved[0].command, "hello");

        let updated = save_command(CommandRecord {
            id: saved[0].id.clone(),
            command: "hello".to_string(),
            body: "Hello!".to_string(),
            memo: String::new(),
            allow: CommandAllow::Mod,
            created_at: String::new(),
        })
        .unwrap();
        assert_eq!(updated.len(), 1);
        assert_eq!(updated[0].body, "Hello!");
        assert_eq!(updated[0].allow, CommandAllow::Mod);

        let deleted = delete_command(&updated[0].id).unwrap();
        assert!(deleted.is_empty());
    }

    #[test]
    fn memo_upserts_by_username() {
        let _guard = reset();
        save_memo(MemoRecord {
            id: String::new(),
            username: "alice".to_string(),
            nickname: "Alice".to_string(),
            memo: "first".to_string(),
            created_at: String::new(),
            updated_at: String::new(),
        })
        .unwrap();
        let saved = save_memo(MemoRecord {
            id: String::new(),
            username: "alice".to_string(),
            nickname: "Alice".to_string(),
            memo: "second".to_string(),
            created_at: String::new(),
            updated_at: String::new(),
        })
        .unwrap();
        assert_eq!(saved.len(), 1);
        assert_eq!(saved[0].memo, "second");
    }

    #[test]
    fn raider_add_and_delete() {
        let _guard = reset();
        add_raider("chan", "raider", "Raider", 42, "2026-01-01T00:00:00Z").unwrap();
        let records = list_raiders();
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].viewers, 42);
        let deleted = delete_raider(&records[0].id).unwrap();
        assert!(deleted.is_empty());
    }

    #[test]
    fn settings_roundtrip_and_defaults() {
        let _guard = reset();
        let defaults = load_settings();
        assert_eq!(defaults.locale, "system");
        assert!(defaults.notifications_enabled);
        assert_eq!(defaults.shoutout_info_length, 8);

        let mut settings = defaults.clone();
        settings.locale = "ja".to_string();
        settings.discord_webhook = "https://example.com/hook".to_string();
        save_settings(&settings).unwrap();

        let loaded = load_settings();
        assert_eq!(loaded.locale, "ja");
        assert_eq!(loaded.discord_webhook, "https://example.com/hook");
    }
}
