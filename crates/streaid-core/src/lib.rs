pub mod auth;
pub mod bonsai;
pub mod chat;
pub mod dictionary;
pub mod overlay;
pub mod platform;
pub mod sounds;
pub mod translate;
pub mod vocabulary;

use auth::{shared_state, InnerState};
use chat::{
    connect_to_irc, extract_dictionary_word, extract_translate_text, is_dictionary_command,
    is_translate_command, parse_irc_privmsg, WsStream,
};
use dictionary::lookup_word;
use futures_util::{SinkExt, StreamExt};
use once_cell::sync::Lazy;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::{mpsc as std_mpsc, OnceLock};
use std::time::{Duration, Instant};
use tokio::sync::{mpsc, Notify};
use tokio::time::sleep;
use tokio_tungstenite::tungstenite::Message;
use translate::{detect_language, translate_text, Language, TranslationSuggestion};

static AUTH_STATE: Lazy<Arc<std::sync::Mutex<InnerState>>> = Lazy::new(shared_state);

// Chat state
struct ChatState {
    is_running: bool,
    is_enabled: bool,
    channel_name: Option<String>,
    bot_username: Option<String>,
    /// True between a dropped IRC connection and a successful reconnect.
    reconnecting: bool,
}

impl ChatState {
    fn new() -> Self {
        ChatState {
            is_running: false,
            is_enabled: true,
            channel_name: None,
            bot_username: None,
            reconnecting: false,
        }
    }
}

static CHAT_STATE: Lazy<Arc<std::sync::Mutex<ChatState>>> =
    Lazy::new(|| Arc::new(std::sync::Mutex::new(ChatState::new())));

/// Wakes the IRC read loop so stop takes effect immediately, even when the
/// socket is idle or dead (no inbound messages to trip the loop's stop check).
static CHAT_STOP_NOTIFY: Lazy<Notify> = Lazy::new(Notify::new);

// Bonsai (local model sidecar) state
/// One MLX model server instance managed as a sidecar.
struct BonsaiModel {
    name: &'static str, // "8b" | "4b" — used by the frontend and logs
    port: u16,
    dir: &'static str, // directory under bonsai/models/mlx/
}

const BONSAI_MODELS: [BonsaiModel; 2] = [
    BonsaiModel {
        name: "8b",
        port: 4243,
        dir: "Ternary-Bonsai-8B-mlx-2bit",
    },
    BonsaiModel {
        name: "4b",
        port: 4244,
        dir: "Ternary-Bonsai-4B-mlx-2bit",
    },
];

struct BonsaiChild {
    model_name: &'static str,
    child: std::process::Child,
}

struct BonsaiState {
    enabled: bool,
    /// Model used for actual !ts / !d chat replies ("8b" or "4b").
    active_model: String,
    children: Vec<BonsaiChild>,
}

impl BonsaiState {
    fn new() -> Self {
        BonsaiState {
            enabled: false,
            active_model: load_local_model_variant(),
            children: Vec::new(),
        }
    }
}

fn local_model_variant_path() -> Option<PathBuf> {
    Some(app_data_dir().join("local_model_variant"))
}

fn load_local_model_variant() -> String {
    let variant = local_model_variant_path()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .map(|s| s.trim().to_string());
    match variant.as_deref() {
        Some("4b") | Some("8b") => variant.unwrap(),
        _ => "8b".to_string(),
    }
}

fn save_local_model_variant(model: &str) {
    if let Some(path) = local_model_variant_path() {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = std::fs::write(&path, model);
    }
}

static BONSAI_STATE: Lazy<Arc<std::sync::Mutex<BonsaiState>>> =
    Lazy::new(|| Arc::new(std::sync::Mutex::new(BonsaiState::new())));

fn get_auth_state() -> std::sync::Arc<std::sync::Mutex<InnerState>> {
    AUTH_STATE.clone()
}

fn get_chat_state() -> Arc<std::sync::Mutex<ChatState>> {
    CHAT_STATE.clone()
}

/// Directory name under the OS config dir. Matches the bundle identifier
/// (`im.sush.streaid`) and the pre-rewrite (Tauri) location, so existing Bonsai
/// models, sounds and logs keep working.
pub const APP_DIR_NAME: &str = "im.sush.streaid";

/// App data directory (`~/Library/Application Support/im.sush.streaid` on
/// macOS, `%APPDATA%\im.sush.streaid` on Windows).
/// Holds the app log, the Bonsai sidecar, and the uploaded sound files.
pub fn app_data_dir() -> PathBuf {
    dirs::config_dir()
        .map(|d| d.join(APP_DIR_NAME))
        .unwrap_or_else(|| PathBuf::from("."))
}

// ── Events from the IRC listener to the UI ──────────────────────────────────

#[derive(serde::Serialize, Clone, Debug)]
pub struct ChatStatus {
    pub connected: bool,
    pub is_running: bool,
    pub is_enabled: bool,
    pub reconnecting: bool,
    pub channel: Option<String>,
    pub last_target_channel: Option<String>,
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct TranslationEvent {
    pub original_user: String,
    pub original_message: String,
    pub suggestions: Vec<TranslationSuggestion>,
    pub points: Vec<String>,
    pub timestamp: String,
    pub source_lang: String,
    pub target_lang: String,
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct DictionaryEvent {
    pub original_user: String,
    pub original_word: String,
    pub word: String,
    pub meaning: String,
    pub examples: Vec<String>,
    pub similar_words: Vec<String>,
    pub timestamp: String,
    pub source_lang: String,
    pub target_lang: String,
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct ChatMessageEvent {
    pub username: String,
    pub message: String,
    pub channel: String,
    pub timestamp: String,
}

/// A word looked up with `!d` during this app session, newest first.
/// Surfaced on the OBS overlay (chip list) for the duration of the stream.
#[derive(serde::Serialize, Clone, Debug)]
pub struct SessionLookup {
    pub word: String,
    pub timestamp: String,
}

/// Session lookup history (reset on app start); the overlay fetches this
/// when a browser source connects so pre-connection lookups are shown too.
static SESSION_LOOKUPS: Lazy<std::sync::Mutex<Vec<SessionLookup>>> =
    Lazy::new(|| std::sync::Mutex::new(Vec::new()));

const SESSION_LOOKUPS_MAX: usize = 50;

pub fn record_session_lookup(word: &str) {
    let mut list = SESSION_LOOKUPS.lock().unwrap_or_else(|e| e.into_inner());
    list.insert(
        0,
        SessionLookup {
            word: word.to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        },
    );
    list.truncate(SESSION_LOOKUPS_MAX);
}

pub fn session_lookups() -> Vec<SessionLookup> {
    SESSION_LOOKUPS
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .clone()
}

/// Events emitted by the chat listener, drained by the UI.
#[derive(serde::Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum AppEvent {
    ChatMessage(ChatMessageEvent),
    Translation(TranslationEvent),
    Dictionary(DictionaryEvent),
}

static EVENT_TX: OnceLock<std_mpsc::Sender<AppEvent>> = OnceLock::new();
static EVENT_RX: OnceLock<std::sync::Mutex<std_mpsc::Receiver<AppEvent>>> = OnceLock::new();

fn init_events() {
    let (tx, rx) = std_mpsc::channel();
    let _ = EVENT_TX.set(tx);
    let _ = EVENT_RX.set(std::sync::Mutex::new(rx));
}

/// Receiver side of the event channel, polled by the UI loop.
pub fn event_receiver() -> &'static std::sync::Mutex<std_mpsc::Receiver<AppEvent>> {
    EVENT_RX.get().expect("event channel not initialized")
}

fn emit_event(event: AppEvent) {
    if let Some(tx) = EVENT_TX.get() {
        let _ = tx.send(event);
    }
}

// ── Gemini rate limiting & resilience ────────────────────────────────────────

/// Token bucket that caps Gemini API calls (free tier is ~10 requests/minute,
/// so stay below it). Applies to chat replies AND the Model Test page.
struct TokenBucket {
    capacity: f64,
    tokens: f64,
    refill_per_sec: f64,
    last_refill: std::time::Instant,
}

impl TokenBucket {
    fn new(capacity: f64, refill_per_sec: f64) -> Self {
        TokenBucket {
            capacity,
            tokens: capacity,
            refill_per_sec,
            last_refill: std::time::Instant::now(),
        }
    }

    fn try_take(&mut self) -> bool {
        let now = std::time::Instant::now();
        let elapsed = now.duration_since(self.last_refill).as_secs_f64();
        self.tokens = (self.tokens + elapsed * self.refill_per_sec).min(self.capacity);
        self.last_refill = now;
        if self.tokens >= 1.0 {
            self.tokens -= 1.0;
            true
        } else {
            false
        }
    }
}

/// Max Gemini requests per minute. Set below the free-tier RPM (~10).
pub(crate) const GEMINI_RPM_LIMIT: f64 = 8.0;

/// Monotonic counter of Gemini API calls (for quota diagnostics).
static GEMINI_CALL_COUNTER: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

/// Log every Gemini call with its source so quota usage can be audited
/// (one command should produce exactly one call).
fn log_gemini_call(source: &str) {
    let n = GEMINI_CALL_COUNTER.fetch_add(1, std::sync::atomic::Ordering::Relaxed) + 1;
    append_app_log(&format!("Gemini API call #{} ({})", n, source));
}

static GEMINI_RATE_LIMIT: Lazy<std::sync::Mutex<TokenBucket>> = Lazy::new(|| {
    std::sync::Mutex::new(TokenBucket::new(GEMINI_RPM_LIMIT, GEMINI_RPM_LIMIT / 60.0))
});

pub(crate) fn gemini_budget_try_take() -> bool {
    GEMINI_RATE_LIMIT
        .lock()
        .map(|mut b| b.try_take())
        .unwrap_or(true) // never block the app if the lock is poisoned
}

/// Append a line to the app log (app data dir / streaid.log) for diagnosing
/// quota errors that are otherwise only visible in the terminal.
fn append_app_log(msg: &str) {
    let path = app_data_dir().join("streaid.log");
    use std::io::Write;
    if let Ok(file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
    {
        let mut file = file;
        let _ = writeln!(file, "[{}] {}", chrono::Utc::now().to_rfc3339(), msg);
    }
}

/// Provider call outcome for the chat listener: Skipped means "do not reply
/// to this command" (rate-limited and no local model available).
enum ProviderError {
    Skipped,
    Failed(String),
}

/// True when the selected local model's server is up.
async fn local_model_running() -> bool {
    bonsai::server_ready_at(active_bonsai_url()).await
}

/// Translate via the local Bonsai model (used as a fallback).
async fn fallback_translate(
    text: &str,
    source_lang: Language,
) -> Result<translate::TranslationResult, ProviderError> {
    eprintln!("[fallback] using local model");
    append_app_log("Gemini unavailable (429 or rate limit) - answered with the local model");
    bonsai::translate_at(active_bonsai_url(), text, source_lang)
        .await
        .map_err(|e| ProviderError::Failed(e.to_string()))
}

async fn fallback_lookup(
    word: &str,
    source_lang: Language,
) -> Result<dictionary::DictionaryResult, ProviderError> {
    eprintln!("[fallback] using local model");
    append_app_log("Gemini unavailable (429 or rate limit) - answered with the local model");
    bonsai::lookup_word_at(active_bonsai_url(), word, source_lang)
        .await
        .map_err(|e| ProviderError::Failed(e.to_string()))
}

/// Gemini translate with rate limiting + automatic local fallback on 429.
async fn gemini_translate(
    text: &str,
    source_lang: Language,
) -> Result<translate::TranslationResult, ProviderError> {
    if !gemini_budget_try_take() {
        eprintln!(
            "[rate-limit] Gemini budget exhausted (max {}/min), using local model",
            GEMINI_RPM_LIMIT
        );
        append_app_log(&format!(
            "Gemini rate limit reached (max {}/min)",
            GEMINI_RPM_LIMIT
        ));
        if local_model_running().await {
            return fallback_translate(text, source_lang).await;
        }
        return Err(ProviderError::Skipped);
    }
    let api_key = get_gemini_api_key().map_err(ProviderError::Failed)?;
    log_gemini_call("chat !ts");
    match translate_text(text, &api_key, source_lang).await {
        Ok(r) => Ok(r),
        Err(e) if e.to_string().contains("429") => {
            append_app_log(&format!("Gemini 429: {}", e));
            if local_model_running().await {
                fallback_translate(text, source_lang).await
            } else {
                Err(ProviderError::Failed(format!("Gemini 429: {}", e)))
            }
        }
        Err(e) => Err(ProviderError::Failed(format!("Gemini error: {}", e))),
    }
}

/// Gemini dictionary lookup with rate limiting + automatic local fallback on 429.
async fn gemini_lookup(
    word: &str,
    source_lang: Language,
) -> Result<dictionary::DictionaryResult, ProviderError> {
    if !gemini_budget_try_take() {
        eprintln!(
            "[rate-limit] Gemini budget exhausted (max {}/min), using local model",
            GEMINI_RPM_LIMIT
        );
        append_app_log(&format!(
            "Gemini rate limit reached (max {}/min)",
            GEMINI_RPM_LIMIT
        ));
        if local_model_running().await {
            return fallback_lookup(word, source_lang).await;
        }
        return Err(ProviderError::Skipped);
    }
    let api_key = get_gemini_api_key().map_err(ProviderError::Failed)?;
    log_gemini_call("chat !d");
    match lookup_word(word, &api_key, source_lang).await {
        Ok(r) => Ok(r),
        Err(e) if e.to_string().contains("429") => {
            append_app_log(&format!("Gemini 429: {}", e));
            if local_model_running().await {
                fallback_lookup(word, source_lang).await
            } else {
                Err(ProviderError::Failed(format!("Gemini 429: {}", e)))
            }
        }
        Err(e) => Err(ProviderError::Failed(format!("Gemini error: {}", e))),
    }
}

// Gemini API key is read from the keyring once and cached in memory, so
// !ts / !d requests don't trigger repeated keychain access prompts.
static GEMINI_KEY_CACHE: Lazy<std::sync::Mutex<Option<String>>> =
    Lazy::new(|| std::sync::Mutex::new(None));

pub(crate) fn get_gemini_api_key() -> Result<String, String> {
    if let Ok(cache) = GEMINI_KEY_CACHE.lock() {
        if let Some(key) = cache.as_ref() {
            return Ok(key.clone());
        }
    }
    let key = keyring::Entry::new("streaid", "gemini_api_key")
        .get_password()
        .map_err(|_| "No Gemini API key configured".to_string())?;
    if let Ok(mut cache) = GEMINI_KEY_CACHE.lock() {
        *cache = Some(key.clone());
    }
    Ok(key)
}

pub fn set_gemini_api_key(api_key: &str) -> Result<(), String> {
    keyring::Entry::new("streaid", "gemini_api_key")
        .set_password(api_key)
        .map_err(|e| format!("Failed to save Gemini API key: {}", e))?;
    if let Ok(mut cache) = GEMINI_KEY_CACHE.lock() {
        *cache = Some(api_key.to_string());
    }
    Ok(())
}

/// Masked key for display ("abcd...wxyz"), or None when not configured.
pub fn get_gemini_api_key_masked() -> Option<String> {
    let key = match get_gemini_api_key() {
        Ok(k) => k,
        Err(_) => return None,
    };
    if key.len() > 8 {
        Some(format!("{}...{}", &key[..4], &key[key.len() - 4..]))
    } else {
        Some("***".to_string())
    }
}

pub fn has_gemini_api_key() -> bool {
    get_gemini_api_key().is_ok()
}

fn sanitize_channel_name(raw: &str) -> Result<String, String> {
    let s = raw.trim().to_lowercase();
    let s = s.trim_start_matches('#').to_string();
    if s.contains(' ') {
        return Err("Channel name cannot contain spaces".to_string());
    }
    if s.len() > 25 {
        return Err("Channel name is too long (max 25 characters)".to_string());
    }
    if !s.is_empty() && !s.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err("Channel name can only contain letters, numbers, and underscores".to_string());
    }
    Ok(s)
}

fn truncate_utf8(s: &str, max_bytes: usize) -> &str {
    let safe_len = s.floor_char_boundary(max_bytes.min(s.len()));
    &s[..safe_len]
}

fn last_channel_file_path() -> Option<PathBuf> {
    Some(app_data_dir().join("last_channel"))
}

/// Save last used target channel to disk
pub fn save_last_channel(channel: &str) -> Result<(), String> {
    if let Some(path) = last_channel_file_path() {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        std::fs::write(&path, channel).map_err(|e| format!("Failed to save last channel: {}", e))
    } else {
        Err("Could not determine config directory".to_string())
    }
}

/// Load last used target channel from disk
pub fn load_last_channel() -> Result<Option<String>, String> {
    if let Some(path) = last_channel_file_path() {
        match std::fs::read_to_string(&path) {
            Ok(s) => Ok(Some(s.trim().to_string())),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(format!("Failed to load last channel: {}", e)),
        }
    } else {
        Ok(None)
    }
}

pub fn get_chat_status() -> ChatStatus {
    let state = get_chat_state();
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    ChatStatus {
        connected: s.is_running,
        is_running: s.is_running,
        is_enabled: s.is_enabled,
        reconnecting: s.reconnecting,
        channel: s.channel_name.clone(),
        last_target_channel: load_last_channel().ok().flatten(),
    }
}

pub fn toggle_translation(enabled: bool) -> Result<(), String> {
    let state = get_chat_state();
    let mut s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    s.is_enabled = enabled;
    eprintln!("Translation toggled: {}", enabled);
    Ok(())
}

// ── Bonsai (local model sidecar) ─────────────────────────────────────────────

fn get_bonsai_state() -> Arc<std::sync::Mutex<BonsaiState>> {
    BONSAI_STATE.clone()
}

fn bonsai_dir() -> PathBuf {
    app_data_dir().join("bonsai")
}

#[derive(serde::Serialize, Clone)]
pub struct BonsaiModelStatus {
    pub name: String, // "8b" | "4b"
    pub running: bool,
    pub model_found: bool,
}

#[derive(serde::Serialize, Clone)]
pub struct BonsaiStatus {
    pub enabled: bool,
    pub runtime_found: bool,
    /// Model used for actual !ts / !d chat replies ("8b" | "4b")
    pub active_model: String,
    pub models: Vec<BonsaiModelStatus>,
}

/// Path of the MLX runtime (venv python) used to serve the local models.
fn bonsai_mlx_python() -> PathBuf {
    bonsai_dir().join("mlx-venv").join("bin").join("python")
}

/// Selects which local model answers !ts / !d in chat. Persisted to disk.
pub fn set_local_model_variant(model: &str) -> Result<(), String> {
    if model != "8b" && model != "4b" {
        return Err(format!("Unknown local model variant: {}", model));
    }
    let state = get_bonsai_state();
    let mut s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    s.active_model = model.to_string();
    save_local_model_variant(model);
    eprintln!("Local model variant set to {}", model);
    Ok(())
}

/// Base URL of the llama-server for the currently selected chat model.
fn active_bonsai_url() -> &'static str {
    let state = get_bonsai_state();
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if s.active_model == "4b" {
        bonsai::SERVER_URL_4B
    } else {
        bonsai::SERVER_URL_8B
    }
}

/// Spawns (or kills) the local MLX model servers and switches the
/// !ts / !d provider to the local Bonsai models.
pub async fn set_local_model(enabled: bool) -> Result<(), String> {
    if enabled {
        start_bonsai().await
    } else {
        stop_bonsai();
        eprintln!("Local model disabled");
        Ok(())
    }
}

pub async fn get_bonsai_status() -> Result<BonsaiStatus, String> {
    let dir = bonsai_dir();
    let (enabled, active_model, running_models) = {
        let state = get_bonsai_state();
        let s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        let running: Vec<&str> = s.children.iter().map(|c| c.model_name).collect();
        (s.enabled, s.active_model.clone(), running)
    };
    let mut models = Vec::with_capacity(BONSAI_MODELS.len());
    for model in BONSAI_MODELS.iter() {
        let base_url = format!("http://127.0.0.1:{}", model.port);
        models.push(BonsaiModelStatus {
            name: model.name.to_string(),
            running: running_models.contains(&model.name)
                && bonsai::server_ready_at(&base_url).await,
            model_found: dir.join("models").join("mlx").join(model.dir).exists(),
        });
    }
    Ok(BonsaiStatus {
        enabled,
        runtime_found: bonsai_mlx_python().exists(),
        active_model,
        models,
    })
}

#[derive(serde::Serialize, Clone)]
#[serde(tag = "mode", rename_all = "lowercase")]
pub enum ModelTestResult {
    Ts {
        source_lang: String,
        target_lang: String,
        suggestions: Vec<TranslationSuggestion>,
        points: Vec<String>,
        duration_ms: u64,
    },
    D {
        source_lang: String,
        target_lang: String,
        word: String,
        meaning: String,
        examples: Vec<String>,
        similar_words: Vec<String>,
        duration_ms: u64,
    },
}

/// One-shot translation (!ts) or dictionary lookup (!d) with a chosen provider,
/// used by the Model Test page.
pub async fn test_model(
    text: String,
    provider: String,
    mode: String,
) -> Result<ModelTestResult, String> {
    let source_lang = detect_language(&text);
    if source_lang == Language::Unknown {
        return Err("Unknown language".to_string());
    }
    let target_lang = match source_lang {
        Language::Japanese => "English",
        Language::English => "Japanese",
        Language::Unknown => "Unknown",
    };

    let start = std::time::Instant::now();

    let result = match mode.as_str() {
        "ts" => {
            let res = provider_translate(&text, source_lang, &provider).await?;
            ModelTestResult::Ts {
                source_lang: source_lang.to_string(),
                target_lang: target_lang.to_string(),
                suggestions: res.suggestions,
                points: res.points,
                duration_ms: start.elapsed().as_millis() as u64,
            }
        }
        "d" => {
            // Mirror the real !d behavior: only the first word is looked up
            let word = text
                .split_whitespace()
                .next()
                .unwrap_or_default()
                .to_string();
            if word.is_empty() {
                return Err("Empty word".to_string());
            }
            let res = provider_lookup(&word, source_lang, &provider).await?;
            ModelTestResult::D {
                source_lang: source_lang.to_string(),
                target_lang: target_lang.to_string(),
                word,
                meaning: res.meaning,
                examples: res.examples,
                similar_words: res.similar_words,
                duration_ms: start.elapsed().as_millis() as u64,
            }
        }
        other => return Err(format!("Unknown mode: {}", other)),
    };

    Ok(result)
}

async fn provider_translate(
    text: &str,
    source_lang: Language,
    provider: &str,
) -> Result<translate::TranslationResult, String> {
    match provider {
        "gemini" => {
            if !gemini_budget_try_take() {
                return Err(format!(
                    "Gemini rate limit reached (max {}/min). Try again in a moment.",
                    GEMINI_RPM_LIMIT
                ));
            }
            let api_key = get_gemini_api_key()?;
            log_gemini_call("model test !ts");
            translate_text(text, &api_key, source_lang)
                .await
                .map_err(|e| format!("Gemini error: {}", e))
        }
        "bonsai-8b" | "bonsai" => local_translate(bonsai::SERVER_URL_8B, text, source_lang).await,
        "bonsai-4b" => local_translate(bonsai::SERVER_URL_4B, text, source_lang).await,
        other => Err(format!("Unknown provider: {}", other)),
    }
}

async fn provider_lookup(
    word: &str,
    source_lang: Language,
    provider: &str,
) -> Result<dictionary::DictionaryResult, String> {
    match provider {
        "gemini" => {
            if !gemini_budget_try_take() {
                return Err(format!(
                    "Gemini rate limit reached (max {}/min). Try again in a moment.",
                    GEMINI_RPM_LIMIT
                ));
            }
            let api_key = get_gemini_api_key()?;
            log_gemini_call("model test !d");
            lookup_word(word, &api_key, source_lang)
                .await
                .map_err(|e| format!("Gemini error: {}", e))
        }
        "bonsai-8b" | "bonsai" => local_lookup(bonsai::SERVER_URL_8B, word, source_lang).await,
        "bonsai-4b" => local_lookup(bonsai::SERVER_URL_4B, word, source_lang).await,
        other => Err(format!("Unknown provider: {}", other)),
    }
}

async fn local_translate(
    base_url: &str,
    text: &str,
    source_lang: Language,
) -> Result<translate::TranslationResult, String> {
    if !bonsai::server_ready_at(base_url).await {
        return Err(
            "Local model server is not running. Enable Local Model in Chat Listener first."
                .to_string(),
        );
    }
    bonsai::translate_at(base_url, text, source_lang)
        .await
        .map_err(|e| format!("Local model error: {}", e))
}

async fn local_lookup(
    base_url: &str,
    word: &str,
    source_lang: Language,
) -> Result<dictionary::DictionaryResult, String> {
    if !bonsai::server_ready_at(base_url).await {
        return Err(
            "Local model server is not running. Enable Local Model in Chat Listener first."
                .to_string(),
        );
    }
    bonsai::lookup_word_at(base_url, word, source_lang)
        .await
        .map_err(|e| format!("Local model error: {}", e))
}

async fn start_bonsai() -> Result<(), String> {
    if !platform::local_model_supported() {
        return Err(
            "Local model (MLX) is only supported on macOS. Configure Gemini instead.".to_string(),
        );
    }
    let dir = bonsai_dir();
    let python = bonsai_mlx_python();

    if !python.exists() {
        return Err("MLX runtime not found. Run scripts/setup-bonsai.sh first.".to_string());
    }

    // Spawn one MLX server per model directory that is present
    let mut spawned: Vec<(&'static str, u16)> = Vec::new();
    {
        let state = get_bonsai_state();
        let mut s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        if s.enabled && !s.children.is_empty() {
            return Ok(());
        }
        // Clean up stale handles before re-spawning
        for old in s.children.drain(..) {
            let mut old = old.child;
            let _ = old.kill();
            let _ = old.wait();
        }

        std::fs::create_dir_all(&dir).map_err(|e| format!("Failed to create bonsai dir: {}", e))?;

        for model in BONSAI_MODELS.iter() {
            let model_path = dir.join("models").join("mlx").join(model.dir);
            if !model_path.exists() {
                eprintln!(
                    "Skipping local model {}: directory {} not found",
                    model.name, model.dir
                );
                continue;
            }
            let log_file =
                std::fs::File::create(dir.join(format!("mlx-server-{}.log", model.name)))
                    .map_err(|e| format!("Failed to open mlx-server log: {}", e))?;

            let child = std::process::Command::new(&python)
                .arg("-m")
                .arg("mlx_lm.server")
                .arg("--model")
                .arg(&model_path)
                .arg("--port")
                .arg(model.port.to_string())
                .arg("--temp")
                .arg("0.7")
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::from(log_file))
                .spawn()
                .map_err(|e| format!("Failed to start MLX server ({}): {}", model.name, e))?;

            eprintln!(
                "MLX server ({}) started on port {} (log: {})",
                model.name,
                model.port,
                dir.join(format!("mlx-server-{}.log", model.name)).display()
            );
            spawned.push((model.name, model.port));
            s.children.push(BonsaiChild {
                model_name: model.name,
                child,
            });
        }
        s.enabled = true;
    };

    if spawned.is_empty() {
        stop_bonsai();
        return Err(
            "No local model found. Run scripts/setup-bonsai.sh (with --with-4b for the 4B model) first."
                .to_string(),
        );
    }

    // Wait for every spawned server to become ready (model load takes seconds)
    let mut attempts = 0;
    while attempts < 90 && !spawned.is_empty() {
        tokio::time::sleep(Duration::from_secs(1)).await;
        attempts += 1;
        let base_url = format!("http://127.0.0.1:{}", spawned[0].1);
        if bonsai::server_ready_at(&base_url).await {
            eprintln!("MLX server ({}) is ready", spawned[0].0);
            spawned.remove(0);
        }
    }

    if !spawned.is_empty() {
        stop_bonsai();
        return Err(
            "MLX server did not become ready within 90s (check bonsai/mlx-server-*.log)"
                .to_string(),
        );
    }

    Ok(())
}

fn stop_bonsai() {
    let state = get_bonsai_state();
    let mut s = state.lock().unwrap_or_else(|e| e.into_inner());
    for mut child in s.children.drain(..) {
        let _ = child.child.kill();
        let _ = child.child.wait();
    }
    s.enabled = false;
}

// ── Chat listener lifecycle ──────────────────────────────────────────────────

/// Start the Twitch IRC listener for `target_channel` (None = own channel).
pub async fn start_chat_listener(target_channel: Option<String>) -> Result<(), String> {
    eprintln!("Starting chat listener...");

    // Load the stored token first so the state knows when it expires (avoids
    // repeated keychain reads by the background refresh loop).
    let auth_state = get_auth_state();
    let stored_token = auth::get_stored_token(&auth_state)
        .map_err(|e| format!("Failed to get token: {}", e))?
        .ok_or_else(|| "No token found. Please authenticate first.".to_string())?;

    // Proactively refresh before connecting: when the expiry is unknown
    // (fresh start / migrated legacy tokens) refresh once, otherwise only
    // when the token is near expiry.
    let expiry_known = {
        let s = auth_state
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        s.token_expires_at.is_some()
    };
    let refreshed_token = if expiry_known {
        auth::refresh_token_if_needed(auth_state.clone(), 300)
            .await
            .ok()
            .flatten()
    } else {
        auth::refresh_token(auth_state.clone()).await.ok().flatten()
    };

    let token = if let Some(t) = refreshed_token {
        eprintln!("Using refreshed token for IRC connection");
        t
    } else {
        stored_token
    };

    let username = token
        .login
        .ok_or_else(|| "No username found in token".to_string())?;

    let access_token = token.access_token;

    // Determine which channel to join
    let channel_to_join = if let Some(ch) = target_channel {
        let sanitized = sanitize_channel_name(&ch)?;
        if sanitized.is_empty() {
            username.clone() // Fallback to own channel if empty after sanitization
        } else {
            sanitized
        }
    } else {
        username.clone() // Default to own channel
    };

    eprintln!("Target channel: #{}", channel_to_join);

    // Save for persistence
    if let Err(e) = save_last_channel(&channel_to_join) {
        eprintln!("Warning: Failed to save last channel: {}", e);
    }

    eprintln!("Connecting as: {}", username);

    // Validate token before attempting IRC connection
    eprintln!("Validating token with Twitch API...");
    validate_token(&access_token).await?;

    // Update state
    {
        let state = get_chat_state();
        let mut s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        if s.is_running {
            return Err("Chat listener already running".to_string());
        }
        s.is_running = true;
        s.reconnecting = false;
        s.channel_name = Some(channel_to_join.clone());
        s.bot_username = Some(username.clone());
    }

    // Connect to IRC
    let ws_stream = connect_to_irc(&username, &access_token, &channel_to_join)
        .await
        .map_err(|e| {
            // Reset state on error
            let state = get_chat_state();
            if let Ok(mut s) = state.lock() {
                s.is_running = false;
            }
            format!("Failed to connect to IRC: {}", e)
        })?;

    eprintln!("IRC connected, starting listener task...");

    // Spawn background task (owns the connection and reconnects on drop)
    spawn_task(async move {
        if let Err(e) = chat_listener_task(ws_stream, channel_to_join).await {
            eprintln!("Chat listener error: {}", e);
        }
    });

    Ok(())
}

async fn validate_token(access_token: &str) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
    let validation_response = client
        .get("https://id.twitch.tv/oauth2/validate")
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
        .map_err(|e| format!("Token validation request failed: {}", e))?;

    if !validation_response.status().is_success() {
        let status = validation_response.status();
        let error_text = validation_response.text().await.unwrap_or_default();
        return Err(format!(
            "Token validation failed ({}): {}. Please re-authenticate.",
            status, error_text
        ));
    }

    let validation_json: serde_json::Value = validation_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse validation response: {}", e))?;

    eprintln!("Token validation successful: {:?}", validation_json);

    // Check if token has required scopes
    if let Some(scopes) = validation_json.get("scopes").and_then(|s| s.as_array()) {
        let has_chat_read = scopes.iter().any(|s| s.as_str() == Some("chat:read"));
        let has_chat_edit = scopes.iter().any(|s| s.as_str() == Some("chat:edit"));

        if !has_chat_read || !has_chat_edit {
            return Err(format!(
                "Token missing required scopes. Has chat:read={}, chat:edit={}. Please re-authenticate with correct scopes.",
                has_chat_read, has_chat_edit
            ));
        }
        eprintln!("✓ Token has required scopes: chat:read, chat:edit");
    }

    Ok(())
}

pub fn stop_chat_listener() -> Result<(), String> {
    let state = get_chat_state();
    let mut s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    s.is_running = false;
    s.reconnecting = false;
    // Wake the IRC read loop immediately (it may be blocked on a dead socket)
    CHAT_STOP_NOTIFY.notify_waiters();
    eprintln!("Stopping chat listener...");
    Ok(())
}

// ── Chat listener: connection supervision ───────────────────────────────────

/// Interval between client-initiated keepalive PINGs. Twitch only sends its
/// own PINGs sparingly (and quiet chats may be silent for minutes), so we
/// probe the server ourselves to detect half-open connections.
const IRC_PING_INTERVAL: Duration = Duration::from_secs(90);
/// If the server does not answer our PING within this window, the connection
/// is considered dead and a reconnect is triggered.
const IRC_PONG_TIMEOUT: Duration = Duration::from_secs(30);
/// How often the liveness check runs.
const IRC_HEARTBEAT_TICK: Duration = Duration::from_secs(10);
/// Reconnect backoff cap: 1s -> 2s -> 5s -> 10s -> 20s -> 30s (capped).
const RECONNECT_BACKOFF_MAX: Duration = Duration::from_secs(30);

fn chat_is_running() -> bool {
    get_chat_state()
        .lock()
        .map(|s| s.is_running)
        .unwrap_or(false)
}

fn chat_is_enabled() -> bool {
    get_chat_state()
        .lock()
        .map(|s| s.is_enabled)
        .unwrap_or(false)
}

fn chat_bot_username() -> Option<String> {
    get_chat_state()
        .lock()
        .ok()
        .and_then(|s| s.bot_username.clone())
}

fn set_reconnecting(reconnecting: bool) {
    let _ = get_chat_state()
        .lock()
        .map(|mut s| s.reconnecting = reconnecting);
}

/// Sleep for `duration`, but wake up early (returning false) when the
/// listener has been stopped in the meantime.
async fn wait_or_stop(duration: Duration) -> bool {
    tokio::select! {
        _ = sleep(duration) => true,
        _ = CHAT_STOP_NOTIFY.notified() => chat_is_running(),
    }
}

/// Latest IRC credentials: refresh the token if it is near expiry, then read
/// the stored token. Used for every (re)connect so a dropped session always
/// re-authenticates with a fresh access token.
async fn fresh_irc_credentials() -> Result<(String, String), String> {
    let auth_state = get_auth_state();
    match auth::refresh_token_if_needed(auth_state.clone(), 300).await {
        Ok(Some(_)) => eprintln!("Refreshed token before reconnect"),
        Ok(None) => {}
        Err(e) => eprintln!("Token refresh before reconnect failed: {}", e),
    }
    let token = auth::get_stored_token(&auth_state)
        .map_err(|e| format!("Failed to get token: {}", e))?
        .ok_or_else(|| "No token found. Please authenticate first.".to_string())?;
    let username = token
        .login
        .ok_or_else(|| "No username found in token".to_string())?;
    Ok((username, token.access_token))
}

// Chat listener background task: runs the IRC session and reconnects
// automatically whenever the connection is dropped.
async fn chat_listener_task(ws_stream: WsStream, channel: String) -> Result<(), anyhow::Error> {
    eprintln!("Chat listener task started for #{}", channel);

    let mut ws_stream = Some(ws_stream);
    let mut backoff = Duration::from_secs(1);

    loop {
        let stream = ws_stream.take().expect("ws_stream must be present");
        if let Err(e) = run_irc_session(stream, channel.clone()).await {
            eprintln!("IRC session ended with error: {}", e);
        } else {
            eprintln!("IRC session ended");
        }

        if !chat_is_running() {
            break;
        }

        // Reconnect with backoff until the channel is joined again
        let mut reconnected = false;
        while !reconnected && chat_is_running() {
            set_reconnecting(true);
            eprintln!("Reconnecting to #{} in {:?}...", channel, backoff);
            if !wait_or_stop(backoff).await {
                break;
            }
            if !chat_is_running() {
                break;
            }
            match fresh_irc_credentials().await {
                Ok((username, access_token)) => {
                    match connect_to_irc(&username, &access_token, &channel).await {
                        Ok(stream) => {
                            ws_stream = Some(stream);
                            backoff = Duration::from_secs(1);
                            reconnected = true;
                        }
                        Err(e) => eprintln!("Reconnect attempt failed: {}", e),
                    }
                }
                Err(e) => eprintln!("Failed to fetch IRC credentials: {}", e),
            }
            if !reconnected {
                backoff = (backoff * 2).min(RECONNECT_BACKOFF_MAX);
            }
        }
        set_reconnecting(false);

        if !reconnected {
            break;
        }
    }

    // Cleanup on exit
    let state = get_chat_state();
    if let Ok(mut s) = state.lock() {
        s.is_running = false;
        s.channel_name = None;
        s.reconnecting = false;
    }
    eprintln!("Chat listener stopped");
    Ok(())
}

/// One IRC session: reads messages, answers PINGs immediately, feeds !ts / !d
/// commands to a dedicated worker, and monitors the connection with a
/// client-initiated heartbeat. Returns when the connection dies or the
/// listener is stopped.
async fn run_irc_session(ws_stream: WsStream, channel: String) -> Result<(), anyhow::Error> {
    let (mut write, mut read) = ws_stream.split();

    // Outbound messages are serialized through one writer task so the read
    // loop never blocks on slow network writes.
    let (out_tx, mut out_rx) = mpsc::channel::<String>(64);
    spawn_task(async move {
        while let Some(msg) = out_rx.recv().await {
            if let Err(e) = write.send(Message::Text(msg)).await {
                eprintln!("Failed to send to IRC: {}", e);
                break;
            }
        }
    });
    // The writer finishes on its own once every sender is dropped.

    // !ts / !d commands are handled serially by a dedicated worker so the
    // read loop stays responsive (PING/PONG, chat_message events) while
    // Gemini is busy.
    let (cmd_tx, cmd_rx) = mpsc::channel::<(String, String)>(32);
    spawn_task(handle_commands(cmd_rx, out_tx.clone(), channel.clone()));

    let mut last_ping_sent = Instant::now();
    let mut ping_sent_at: Option<Instant> = None;

    loop {
        if !chat_is_running() {
            break;
        }

        tokio::select! {
            _ = CHAT_STOP_NOTIFY.notified() => {
                if !chat_is_running() {
                    break;
                }
            }
            _ = sleep(IRC_HEARTBEAT_TICK) => {
                // No answer to our keepalive PING means the socket is dead
                // (half-open TCP); force a reconnect.
                if let Some(sent_at) = ping_sent_at {
                    if sent_at.elapsed() > IRC_PONG_TIMEOUT {
                        eprintln!(
                            "IRC PONG timeout (no response in {:?}), reconnecting",
                            IRC_PONG_TIMEOUT
                        );
                        break;
                    }
                }
                // Client-initiated keepalive: quiet chats may be silent for
                // minutes, so probe the server ourselves.
                if last_ping_sent.elapsed() >= IRC_PING_INTERVAL
                    && out_tx
                        .send("PING :tmi.twitch.tv".to_string())
                        .await
                        .is_ok()
                {
                    last_ping_sent = Instant::now();
                    ping_sent_at = Some(last_ping_sent);
                }
            }
            msg = read.next() => {
                match msg {
                    Some(Ok(Message::Text(line))) => {
                        // Any inbound message proves the connection is alive
                        ping_sent_at = None;

                        // Server keepalive: answer immediately or Twitch drops us
                        if line.starts_with("PING") {
                            let server = line.trim_start_matches("PING ").trim_start_matches(':');
                            if let Err(e) = out_tx.send(format!("PONG :{}", server)).await {
                                eprintln!("Failed to send PONG: {}", e);
                            }
                            continue;
                        }

                        // Twitch is going down for maintenance; reconnect promptly
                        if line.contains("RECONNECT") {
                            eprintln!("IRC RECONNECT received, reconnecting");
                            break;
                        }

                        if let Some(irc_msg) = parse_irc_privmsg(&line) {
                            eprintln!("Message from {}: {}", irc_msg.username, irc_msg.message);

                            // Ignore own messages (prevent loops)
                            if let Some(ref bot) = chat_bot_username() {
                                if irc_msg.username.eq_ignore_ascii_case(bot) {
                                    eprintln!("Ignoring own message");
                                    continue;
                                }
                            }

                            // Emit chat_message event for all user messages
                            // (fires regardless of toggle)
                            let chat_event = ChatMessageEvent {
                                username: irc_msg.username.clone(),
                                message: irc_msg.message.clone(),
                                channel: channel.clone(),
                                timestamp: chrono::Utc::now().to_rfc3339(),
                            };
                            emit_event(AppEvent::ChatMessage(chat_event));

                            // Check if translation is enabled
                            if !chat_is_enabled() {
                                continue;
                            }

                            // Hand off commands to the worker (serialized, so
                            // replies stay in request order)
                            let is_command = is_translate_command(&irc_msg.message)
                                || is_dictionary_command(&irc_msg.message);
                            if is_command
                                && cmd_tx
                                    .send((irc_msg.username, irc_msg.message))
                                    .await
                                    .is_err()
                            {
                                eprintln!("Failed to queue command (worker gone)");
                            }
                        }
                    }
                    Some(Err(e)) => {
                        eprintln!("WebSocket error: {}", e);
                        break;
                    }
                    None => {
                        eprintln!("WebSocket closed");
                        break;
                    }
                    _ => {
                        // Ignore other message types (Binary, Ping, Pong, Close)
                        continue;
                    }
                }
            }
        }
    }

    // Dropping the senders lets the writer and worker tasks wind down.
    drop(cmd_tx);
    drop(out_tx);
    Ok(())
}

/// Queue a line to be written to the IRC socket (serialized by the writer).
async fn send_to_irc(
    out_tx: &mpsc::Sender<String>,
    channel: &str,
    message: &str,
) -> Result<(), String> {
    let msg = format!("PRIVMSG #{} :{}", channel, message);
    eprintln!("IRC >> {}", msg);
    out_tx
        .send(msg)
        .await
        .map_err(|e| format!("Failed to send chat message: {}", e))
}

/// Serialized handler for !ts / !d commands. Runs off the read loop so
/// PING/PONG and chat_message events are never blocked by API calls.
async fn handle_commands(
    mut cmd_rx: mpsc::Receiver<(String, String)>,
    out_tx: mpsc::Sender<String>,
    channel: String,
) {
    while let Some((username, message)) = cmd_rx.recv().await {
        if is_translate_command(&message) {
            if let Some(text) = extract_translate_text(&message) {
                handle_translate_request(&out_tx, &channel, &username, &text).await;
            }
        } else if is_dictionary_command(&message) {
            if let Some(word) = extract_dictionary_word(&message) {
                handle_dictionary_request(&out_tx, &channel, &username, &word).await;
            }
        }
    }
}

/// Handle a !ts command: detect language, call the provider, send up to 4
/// chat replies (spaced to respect Twitch's message limits), and emit the
/// translation event to the frontend + overlay.
async fn handle_translate_request(
    out_tx: &mpsc::Sender<String>,
    channel: &str,
    username: &str,
    text: &str,
) {
    eprintln!("Translation request: {}", text);

    // Detect language
    let source_lang = detect_language(text);
    if source_lang == Language::Unknown {
        eprintln!("Unknown language, skipping");
        return;
    }

    // Provider: local Bonsai model (sidecar) or cloud Gemini API
    // (rate-limited, with automatic local fallback on 429)
    let use_local = { get_bonsai_state().lock().unwrap().enabled };

    let result = if use_local {
        bonsai::translate_at(active_bonsai_url(), text, source_lang)
            .await
            .map_err(|e| ProviderError::Failed(e.to_string()))
    } else {
        gemini_translate(text, source_lang).await
    };

    match result {
        Ok(result) => {
            eprintln!("Translation suggestions: {:?}", result.suggestions);

            // Send each suggestion as a separate chat message (without points)
            for (idx, suggestion) in result.suggestions.iter().enumerate() {
                let mut response = format!(
                    "@{}: [{}/{}] [{}] {}",
                    username,
                    idx + 1,
                    result.suggestions.len(),
                    suggestion.formality,
                    suggestion.text
                );

                // Handle Twitch's 500 character limit
                if response.len() > 490 {
                    let max_text_len = 400 - username.len();
                    let truncated_text = if suggestion.text.len() > max_text_len {
                        format!("{}...", truncate_utf8(&suggestion.text, max_text_len))
                    } else {
                        suggestion.text.clone()
                    };

                    response = format!(
                        "@{}: [{}/{}] [{}] {}",
                        username,
                        idx + 1,
                        result.suggestions.len(),
                        suggestion.formality,
                        truncated_text
                    );
                }

                // Send message
                if let Err(e) = send_to_irc(out_tx, channel, &response).await {
                    eprintln!(
                        "Failed to send message {}/{}: {}",
                        idx + 1,
                        result.suggestions.len(),
                        e
                    );
                    // Continue sending other messages even if one fails
                } else {
                    eprintln!(
                        "Sent suggestion {}/{} to chat",
                        idx + 1,
                        result.suggestions.len()
                    );
                }

                // Add delay between messages to avoid Twitch rate limiting
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }

            // Send linguistic points as a separate message (4th message)
            let points_str = result.points.join(", ");
            let points_message = format!("@{}: 翻訳の根拠: {}", username, points_str);

            // Handle truncation for points message
            let final_points_message = if points_message.len() > 490 {
                let max_len = 490 - username.len() - 20;
                format!(
                    "@{}: 翻訳の根拠: {}...",
                    username,
                    truncate_utf8(&points_str, max_len)
                )
            } else {
                points_message
            };

            if let Err(e) = send_to_irc(out_tx, channel, &final_points_message).await {
                eprintln!("Failed to send points message: {}", e);
            } else {
                eprintln!("Sent linguistic points to chat");
            }

            eprintln!(
                "All {} suggestions + points sent to chat",
                result.suggestions.len()
            );

            // Emit event to frontend
            let target_lang = match source_lang {
                Language::Japanese => "English",
                Language::English => "Japanese",
                Language::Unknown => "Unknown",
            };

            let event = TranslationEvent {
                original_user: username.to_string(),
                original_message: text.to_string(),
                suggestions: result.suggestions.clone(),
                points: result.points.clone(),
                timestamp: chrono::Utc::now().to_rfc3339(),
                source_lang: source_lang.to_string(),
                target_lang: target_lang.to_string(),
            };

            emit_event(AppEvent::Translation(event.clone()));
            let _ = overlay::OVERLAY_TX.send(overlay::OverlayMessage {
                event_type: "translation".to_string(),
                data: serde_json::to_value(&event).unwrap_or_default(),
            });
        }
        Err(ProviderError::Skipped) => {
            eprintln!("[rate-limit] skipped (no local model available)");
        }
        Err(ProviderError::Failed(e)) => {
            eprintln!("Translation failed: {}", e);
        }
    }
}

/// Handle a !d command: detect language, call the provider, send up to 4
/// chat replies, and emit the dictionary event to the frontend + overlay.
async fn handle_dictionary_request(
    out_tx: &mpsc::Sender<String>,
    channel: &str,
    username: &str,
    word: &str,
) {
    eprintln!("Dictionary request: {}", word);

    // Detect language
    let source_lang = detect_language(word);
    if source_lang == Language::Unknown {
        eprintln!("Unknown language, skipping");
        return;
    }

    // Record the word in the vocabulary store in the background: the
    // two-stage inflection analysis may call Gemini, which must not delay
    // the chat reply.
    {
        let word = word.to_string();
        spawn_task(async move {
            vocabulary::record_lookup(&word).await;
        });
    }

    // Track the lookup in the session history and surface it on the OBS
    // overlay (shown as chips for the whole stream).
    record_session_lookup(word);
    let _ = overlay::OVERLAY_TX.send(overlay::OverlayMessage {
        event_type: "lookup".to_string(),
        data: serde_json::to_value(SessionLookup {
            word: word.to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        })
        .unwrap_or_default(),
    });

    // Provider: local Bonsai model (sidecar) or cloud Gemini API
    // (rate-limited, with automatic local fallback on 429)
    let use_local = { get_bonsai_state().lock().unwrap().enabled };

    let result = if use_local {
        bonsai::lookup_word_at(active_bonsai_url(), word, source_lang)
            .await
            .map_err(|e| ProviderError::Failed(e.to_string()))
    } else {
        gemini_lookup(word, source_lang).await
    };

    match result {
        Ok(result) => {
            eprintln!("Dictionary result: {:?}", result);

            // Send meaning message
            let meaning_msg = format!("@{}: [Dict] {} - {}", username, result.word, result.meaning);

            let truncated_meaning = if meaning_msg.len() > 490 {
                let max_len = 470 - username.len();
                format!(
                    "@{}: [Dict] {} - {}...",
                    username,
                    result.word,
                    truncate_utf8(&result.meaning, max_len)
                )
            } else {
                meaning_msg
            };

            if let Err(e) = send_to_irc(out_tx, channel, &truncated_meaning).await {
                eprintln!("Failed to send meaning: {}", e);
            } else {
                eprintln!("Sent meaning to chat");
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

            // Send examples message
            let examples_str = result.examples.join(" | ");
            let examples_msg = format!("@{}: [Examples] {}", username, examples_str);

            let truncated_examples = if examples_msg.len() > 490 {
                let max_len = 460 - username.len();
                format!(
                    "@{}: [Examples] {}...",
                    username,
                    truncate_utf8(&examples_str, max_len)
                )
            } else {
                examples_msg
            };

            if let Err(e) = send_to_irc(out_tx, channel, &truncated_examples).await {
                eprintln!("Failed to send examples: {}", e);
            } else {
                eprintln!("Sent examples to chat");
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

            // Send synonyms message
            let similar_str = result.similar_words.join(", ");
            let similar_msg = format!("@{}: [Synonyms] {}", username, similar_str);

            let truncated_similar = if similar_msg.len() > 490 {
                let max_len = 460 - username.len();
                format!(
                    "@{}: [Synonyms] {}...",
                    username,
                    truncate_utf8(&similar_str, max_len)
                )
            } else {
                similar_msg
            };

            if let Err(e) = send_to_irc(out_tx, channel, &truncated_similar).await {
                eprintln!("Failed to send similar words: {}", e);
            } else {
                eprintln!("Sent similar words to chat");
            }

            // Emit event to frontend
            let target_lang = match source_lang {
                Language::Japanese => "English",
                Language::English => "Japanese",
                Language::Unknown => "Unknown",
            };

            let event = DictionaryEvent {
                original_user: username.to_string(),
                original_word: word.to_string(),
                word: result.word.clone(),
                meaning: result.meaning.clone(),
                examples: result.examples.clone(),
                similar_words: result.similar_words.clone(),
                timestamp: chrono::Utc::now().to_rfc3339(),
                source_lang: source_lang.to_string(),
                target_lang: target_lang.to_string(),
            };

            emit_event(AppEvent::Dictionary(event.clone()));
            let _ = overlay::OVERLAY_TX.send(overlay::OverlayMessage {
                event_type: "dictionary".to_string(),
                data: serde_json::to_value(&event).unwrap_or_default(),
            });
        }
        Err(ProviderError::Skipped) => {
            eprintln!("[rate-limit] skipped (no local model available)");
        }
        Err(ProviderError::Failed(e)) => {
            eprintln!("Dictionary lookup failed: {}", e);
        }
    }
}

// ── Runtime & sound ──────────────────────────────────────────────────────────

static TOKIO_RT: OnceLock<&'static tokio::runtime::Runtime> = OnceLock::new();

// Keeps the tokio runtime context entered on the main thread so reqwest
// calls made from the UI executor can still spawn tokio tasks.
// EnterGuard is !Send, so it lives in a thread-local instead of a static.
std::thread_local! {
    static TOKIO_ENTER_GUARD: std::cell::RefCell<Option<tokio::runtime::EnterGuard<'static>>> =
        const { std::cell::RefCell::new(None) };
}

/// Create the tokio runtime and initialize the event channel. Call once at
/// startup (main thread).
///
/// Background services (OBS overlay server + Twitch token refresh loop) are
/// skipped when `STREAID_DISABLE_BACKGROUND=1`, which lets contract tests and
/// CLI harnesses run without binding ports or touching the keychain.
pub fn init_runtime() {
    init_events();
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("failed to build tokio runtime");
    let rt: &'static tokio::runtime::Runtime = Box::leak(Box::new(rt));
    TOKIO_RT.set(rt).expect("runtime already initialized");
    TOKIO_ENTER_GUARD.with(|guard| {
        *guard.borrow_mut() = Some(rt.enter());
    });

    if std::env::var_os("STREAID_DISABLE_BACKGROUND").is_some() {
        return;
    }

    // Start the OBS overlay HTTP server
    rt.spawn(overlay::start_overlay_server(
        4242,
        overlay::OVERLAY_TX.clone(),
    ));

    // Background token refresh: check every 30s whether the Twitch token is
    // within 60s of expiring.
    let state = get_auth_state();
    rt.spawn(async move {
        loop {
            let _ = auth::refresh_token_if_needed(state.clone(), 60).await;
            sleep(Duration::from_secs(30)).await;
        }
    });
}

/// Spawn a future on the shared tokio runtime.
pub fn spawn_task<F>(future: F)
where
    F: std::future::Future<Output = ()> + Send + 'static,
{
    if let Some(rt) = TOKIO_RT.get() {
        rt.spawn(future);
    }
}

/// Run a future to completion on the shared runtime.
///
/// FFI frontends call this from their own background thread. Never call it
/// from a runtime worker thread (it would panic/deadlock), and never call it
/// re-entrantly from inside another `block_on`.
pub fn is_runtime_initialized() -> bool {
    TOKIO_RT.get().is_some()
}

pub fn block_on<F: std::future::Future>(future: F) -> F::Output {
    let rt = TOKIO_RT
        .get()
        .expect("runtime not initialized; call init_runtime() first");
    rt.block_on(future)
}

/// Stop background sidecars. Safe to call from an app-quit hook.
pub fn shutdown() {
    stop_bonsai();
}

/// Play a sound file at the given volume (0.0 - 1.0) in a background thread.
pub fn play_sound_file(path: PathBuf, volume: f32) {
    std::thread::spawn(move || {
        use std::io::BufReader;
        let Ok((_stream, handle)) = rodio::OutputStream::try_default() else {
            return;
        };
        let Ok(file) = std::fs::File::open(&path) else {
            return;
        };
        let Ok(decoder) = rodio::Decoder::new(BufReader::new(file)) else {
            return;
        };
        let Ok(sink) = rodio::Sink::try_new(&handle) else {
            return;
        };
        sink.set_volume(volume.clamp(0.0, 1.0));
        sink.append(decoder);
        sink.sleep_until_end();
    });
}

// ── Event drain (frontends) ──────────────────────────────────────────────────

/// Drain all pending events without blocking. Frontends call this from
/// their UI loop and update their view models.
pub fn drain_events() -> Vec<AppEvent> {
    let mut events = Vec::new();
    if let Some(rx) = EVENT_RX.get() {
        let rx = rx.lock().unwrap_or_else(|e| e.into_inner());
        while let Ok(ev) = rx.try_recv() {
            events.push(ev);
        }
    }
    events
}

// ── App entry ────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_data_dir_uses_bundle_identifier() {
        assert!(
            app_data_dir().ends_with(APP_DIR_NAME),
            "app data dir must match the bundle identifier so existing data is preserved"
        );
    }

    #[test]
    fn test_token_bucket_allows_capacity_burst() {
        let mut bucket = TokenBucket::new(3.0, 3.0 / 60.0);
        assert!(bucket.try_take());
        assert!(bucket.try_take());
        assert!(bucket.try_take());
        assert!(!bucket.try_take(), "fourth take should fail");
    }

    #[test]
    fn test_token_bucket_refills_over_time() {
        let mut bucket = TokenBucket::new(1.0, 2.0); // 2 tokens/sec
        assert!(bucket.try_take());
        assert!(!bucket.try_take(), "no tokens left immediately");
        std::thread::sleep(std::time::Duration::from_millis(600));
        assert!(bucket.try_take(), "one token should have refilled");
    }

    #[test]
    fn test_sanitize_lowercase() {
        assert_eq!(sanitize_channel_name("MyChannel").unwrap(), "mychannel");
    }

    #[test]
    fn test_sanitize_strip_hash() {
        assert_eq!(sanitize_channel_name("#streamer").unwrap(), "streamer");
    }

    #[test]
    fn test_sanitize_empty_after_hash() {
        assert_eq!(sanitize_channel_name("#").unwrap(), "");
    }

    #[test]
    fn test_sanitize_spaces_err() {
        assert!(sanitize_channel_name("my channel").is_err());
    }

    #[test]
    fn test_sanitize_too_long_err() {
        assert!(sanitize_channel_name(&"a".repeat(26)).is_err());
    }

    #[test]
    fn test_sanitize_special_chars_err() {
        assert!(sanitize_channel_name("chan!nel").is_err());
    }

    #[test]
    fn test_sanitize_underscores_ok() {
        assert_eq!(
            sanitize_channel_name("my_channel_1").unwrap(),
            "my_channel_1"
        );
    }

    #[test]
    fn test_truncate_ascii_within() {
        assert_eq!(truncate_utf8("hello", 10), "hello");
    }

    #[test]
    fn test_truncate_ascii_at_limit() {
        assert_eq!(truncate_utf8("hello world", 5), "hello");
    }

    #[test]
    fn test_truncate_japanese_safe() {
        let s = "こんにちは"; // 15 bytes; truncate at 10
        let t = truncate_utf8(s, 10);
        assert!(s.is_char_boundary(t.len()));
        assert!(t.len() <= 10);
    }

    #[test]
    fn test_truncate_mixed() {
        let s = "hello こんにちは";
        let t = truncate_utf8(s, 8);
        assert!(s.is_char_boundary(t.len()));
        assert!(t.len() <= 8);
    }

    #[test]
    fn test_truncate_empty() {
        assert_eq!(truncate_utf8("", 10), "");
    }
}
