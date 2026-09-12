//! Vocabulary store: records `!d` dictionary lookups, aggregates word
//! frequency, and optionally classifies top words into categories via Gemini.
//!
//! Word normalization relies entirely on Gemini: it lists ALL possible
//! interpretations (base form + inflection kind) for a looked-up spelling.
//! Results are cached on disk so repeat lookups of the same word never hit
//! the API again; when the AI is unavailable the lookup is simply not
//! recorded (it is retried on the next occurrence).
//!
//! The original spelling is preserved per base form (`source_forms`) and
//! ambiguous words are tracked separately so the UI can show e.g.
//! "lives → life / live".
//!
//! Persisted as JSON in the app data dir (`vocabulary.json`), written
//! atomically (temp file + rename).

use anyhow::{Context, Result};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;

use crate::translate::Interpretation;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordStat {
    pub count: u64,
    pub last_seen: String,
    /// Original spellings that converged to this base form, with counts.
    #[serde(default)]
    pub source_forms: HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AmbiguousEntry {
    pub count: u64,
    pub last_seen: String,
    /// Base forms the word could be an inflection of.
    pub candidates: Vec<String>,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct VocabStore {
    pub words: HashMap<String, WordStat>,
    #[serde(default)]
    pub ambiguous: HashMap<String, AmbiguousEntry>,
    /// Gemini inflection results, keyed by the looked-up spelling.
    #[serde(default)]
    pub inflection_cache: HashMap<String, Vec<Interpretation>>,
}

fn vocab_path() -> std::path::PathBuf {
    crate::app_data_dir().join("vocabulary.json")
}

pub fn save_to(path: &Path, store: &VocabStore) -> Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).context("creating vocabulary dir")?;
    }
    // Atomic write: temp file + rename so a crash can't corrupt the store.
    let json = serde_json::to_string_pretty(store).context("serializing vocabulary")?;
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, &json).context("writing vocabulary temp file")?;
    std::fs::rename(&tmp, path).context("renaming vocabulary file")?;
    Ok(())
}

pub fn load_from(path: &Path) -> VocabStore {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save(store: &VocabStore) {
    let _ = save_to(&vocab_path(), store);
}

fn load() -> VocabStore {
    load_from(&vocab_path())
}

static VOCAB: Lazy<Mutex<VocabStore>> = Lazy::new(|| Mutex::new(load()));

// ── Recording ───────────────────────────────────────────────────────────────

/// Persist a lookup: each interpretation's base form gets +1 and the original
/// spelling is tracked in `source_forms`; multi-interpretation words are also
/// recorded in `ambiguous`.
fn record_with_interpretations(word: &str, interpretations: &[Interpretation]) {
    let mut store = VOCAB.lock().unwrap_or_else(|e| e.into_inner());
    let now = chrono::Utc::now().to_rfc3339();

    for interp in interpretations {
        let entry = store
            .words
            .entry(interp.base.clone())
            .or_insert_with(|| WordStat {
                count: 0,
                last_seen: String::new(),
                source_forms: HashMap::new(),
            });
        entry.count += 1;
        entry.last_seen = now.clone();
        *entry.source_forms.entry(word.to_string()).or_insert(0) += 1;
    }

    if interpretations.len() > 1 {
        let amb = store
            .ambiguous
            .entry(word.to_string())
            .or_insert_with(|| AmbiguousEntry {
                count: 0,
                last_seen: String::new(),
                candidates: interpretations.iter().map(|i| i.base.clone()).collect(),
            });
        amb.count += 1;
        amb.last_seen = now;
    }

    save(&store);
}

fn resolve_from_cache(word: &str) -> Option<Vec<Interpretation>> {
    VOCAB
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .inflection_cache
        .get(word)
        .cloned()
}

fn store_in_cache(word: &str, interpretations: &[Interpretation]) {
    let mut store = VOCAB.lock().unwrap_or_else(|e| e.into_inner());
    store
        .inflection_cache
        .insert(word.to_string(), interpretations.to_vec());
    save(&store);
}

/// Record a dictionary lookup (two-stage):
/// 1. disk cache of Gemini results, else
/// 2. Gemini `inflect_word` (respecting the shared rate limit), falling back
///    to the local rule engine when unavailable.
pub async fn record_lookup(word: &str) {
    let word = word.trim().to_lowercase();
    if word.is_empty() {
        return;
    }

    // 1. Reuse a previous Gemini analysis from the disk cache
    if let Some(cached) = resolve_from_cache(&word) {
        record_with_interpretations(&word, &cached);
        return;
    }

    // 2. Ask Gemini for every possible interpretation
    let interpretations = if crate::gemini_budget_try_take() {
        match crate::get_gemini_api_key() {
            Ok(key) => match crate::translate::inflect_word(&word, &key).await {
                Ok(interps) if !interps.is_empty() => Some(interps),
                Ok(_) => None,
                Err(e) => {
                    eprintln!("inflect_word failed for '{}': {}", word, e);
                    None
                }
            },
            Err(e) => {
                eprintln!("No Gemini key for inflection: {}", e);
                None
            }
        }
    } else {
        eprintln!("[rate-limit] inflection analysis skipped for '{}'", word);
        None
    };

    let Some(interpretations) = interpretations else {
        // AI unavailable (rate limit / API error / no key): skip recording
        // entirely; the word is retried on its next lookup.
        return;
    };

    store_in_cache(&word, &interpretations);
    record_with_interpretations(&word, &interpretations);
}

/// Clear the whole vocabulary (words, ambiguous entries and the inflection cache).
pub fn clear() {
    let mut store = VOCAB.lock().unwrap_or_else(|e| e.into_inner());
    store.words.clear();
    store.ambiguous.clear();
    store.inflection_cache.clear();
    save(&store);
}

// ── Summary for the UI ──────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct TopWord {
    pub word: String,
    pub count: u64,
    pub source_forms: Vec<(String, u64)>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AmbiguousSummary {
    pub word: String,
    pub count: u64,
    pub candidates: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct VocabularySummary {
    pub total_words: usize,
    pub total_lookups: u64,
    pub top_words: Vec<TopWord>,
    pub ambiguous: Vec<AmbiguousSummary>,
}

/// Snapshot of the store for the UI (top 10 words by count + ambiguous list).
pub fn summary() -> VocabularySummary {
    let store = VOCAB.lock().unwrap_or_else(|e| e.into_inner());

    let mut top: Vec<TopWord> = store
        .words
        .iter()
        .map(|(w, s)| TopWord {
            word: w.clone(),
            count: s.count,
            source_forms: s
                .source_forms
                .iter()
                .map(|(f, c)| (f.clone(), *c))
                .collect(),
        })
        .collect();
    top.sort_by(|a, b| b.count.cmp(&a.count).then_with(|| a.word.cmp(&b.word)));
    top.truncate(10);

    let mut ambiguous: Vec<AmbiguousSummary> = store
        .ambiguous
        .iter()
        .map(|(w, a)| AmbiguousSummary {
            word: w.clone(),
            count: a.count,
            candidates: a.candidates.clone(),
        })
        .collect();
    ambiguous.sort_by(|a, b| b.count.cmp(&a.count).then_with(|| a.word.cmp(&b.word)));

    VocabularySummary {
        total_words: store.words.len(),
        total_lookups: store.words.values().map(|s| s.count).sum(),
        top_words: top,
        ambiguous,
    }
}

/// Top words by count, used for the on-demand Gemini category analysis.
pub fn top_words(n: usize) -> Vec<(String, u64)> {
    let store = VOCAB.lock().unwrap_or_else(|e| e.into_inner());
    let mut top: Vec<(String, u64)> = store
        .words
        .iter()
        .map(|(w, s)| (w.clone(), s.count))
        .collect();
    top.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    top.truncate(n);
    top
}

// ── Category analysis (Gemini, on demand) ──────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct CategoryResult {
    pub category: String,
    pub words: Vec<String>,
    pub total_count: u64,
}

/// Classify the top 30 words into categories via Gemini. Honors the shared
/// Gemini rate limit; returns Err when the budget is exhausted or no words
/// have been recorded yet.
pub async fn analyze_categories() -> Result<Vec<CategoryResult>, String> {
    let words = top_words(30);
    if words.is_empty() {
        return Err("No words recorded yet. Use !d word in chat first.".to_string());
    }
    if !crate::gemini_budget_try_take() {
        return Err(format!(
            "Gemini rate limit reached (max {}/min). Try again in a moment.",
            crate::GEMINI_RPM_LIMIT
        ));
    }
    let api_key = crate::get_gemini_api_key()?;
    let classified = crate::translate::classify_words(&words, &api_key)
        .await
        .map_err(|e| e.to_string())?;

    let count_of = |word: &str| -> u64 {
        words
            .iter()
            .find(|(w, _)| w == word)
            .map(|(_, c)| *c)
            .unwrap_or(0)
    };

    let mut results: Vec<CategoryResult> = Vec::new();
    for (word, category) in classified {
        if let Some(r) = results.iter_mut().find(|r| r.category == category) {
            r.words.push(word.clone());
            r.total_count += count_of(&word);
        } else {
            results.push(CategoryResult {
                category,
                words: vec![word.clone()],
                total_count: count_of(&word),
            });
        }
    }
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn interp_list(bases: &[&str]) -> Vec<Interpretation> {
        bases
            .iter()
            .map(|b| Interpretation {
                base: b.to_string(),
                inflection: String::new(),
            })
            .collect()
    }

    fn bases(interps: &[Interpretation]) -> Vec<String> {
        interps.iter().map(|i| i.base.clone()).collect()
    }

    fn reset() {
        let mut store = VOCAB.lock().unwrap();
        store.words.clear();
        store.ambiguous.clear();
        store.inflection_cache.clear();
    }

    #[test]
    fn test_record_with_interpretations() {
        reset();
        // unique: apples -> apple
        record_with_interpretations("apples", &interp_list(&["apple"]));
        record_with_interpretations("apple", &interp_list(&["apple"]));
        // ambiguous: lives -> life + live
        record_with_interpretations("lives", &interp_list(&["life", "live"]));

        let s = summary();
        assert_eq!(s.total_words, 3, "apple, life, live");
        assert_eq!(s.total_lookups, 4, "apples+apple+lives(2 entries)");

        let apple = s.top_words.iter().find(|w| w.word == "apple").unwrap();
        assert_eq!(apple.count, 2);
        assert_eq!(
            apple
                .source_forms
                .iter()
                .find(|(f, _)| f == "apples")
                .map(|(_, c)| *c),
            Some(1)
        );

        assert_eq!(s.ambiguous.len(), 1);
        assert_eq!(s.ambiguous[0].word, "lives");
        assert_eq!(s.ambiguous[0].count, 1);
        assert_eq!(s.ambiguous[0].candidates, vec!["life", "live"]);

        // inflection cache roundtrip (same shared store, keep in one test)
        assert!(resolve_from_cache("lives").is_none());
        store_in_cache("lives", &interp_list(&["life", "live"]));
        let cached = resolve_from_cache("lives").unwrap();
        assert_eq!(bases(&cached), vec!["life", "live"]);
        reset();
    }

    #[test]
    fn test_persistence_roundtrip() {
        let path = std::env::temp_dir().join("streaid_vocab_test.json");
        let mut store = VocabStore::default();
        let mut source_forms = HashMap::new();
        source_forms.insert("lives".to_string(), 2);
        store.words.insert(
            "life".to_string(),
            WordStat {
                count: 2,
                last_seen: "now".to_string(),
                source_forms,
            },
        );
        store
            .inflection_cache
            .insert("lives".to_string(), interp_list(&["life", "live"]));
        save_to(&path, &store).unwrap();
        let loaded = load_from(&path);
        assert_eq!(loaded.words.get("life").map(|s| s.count), Some(2));
        assert_eq!(
            loaded
                .words
                .get("life")
                .and_then(|s| s.source_forms.get("lives")),
            Some(&2)
        );
        assert_eq!(
            loaded.inflection_cache.get("lives").map(|i| i.len()),
            Some(2)
        );
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_old_format_compat() {
        // Old vocabulary.json without source_forms/ambiguous/cache must load.
        let path = std::env::temp_dir().join("streaid_vocab_old.json");
        std::fs::write(
            &path,
            r#"{"words":{"apple":{"count":1,"last_seen":"now"}}}"#,
        )
        .unwrap();
        let loaded = load_from(&path);
        assert_eq!(loaded.words.get("apple").map(|s| s.count), Some(1));
        assert_eq!(loaded.words.get("apple").unwrap().source_forms.len(), 0);
        assert_eq!(loaded.ambiguous.len(), 0);
        let _ = std::fs::remove_file(&path);
    }
}
