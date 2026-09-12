pub mod login;
pub mod pages;

use std::collections::HashSet;

use gpui::{
    div, hsla, prelude::*, AnyElement, Context, Entity, EventEmitter, FontWeight, Hsla,
    IntoElement, Render, Styled, Window,
};
use gpui_component::button::{Button, ButtonVariants};
use serde::{Deserialize, Serialize};

use crate::{
    app_data_dir, event_receiver, get_chat_status, has_gemini_api_key, play_sound_file,
    BonsaiStatus, ChatStatus, DictionaryEvent, TranslationEvent,
};

// ── Theme palette (mirrors the React app's dark/purple theme) ───────────────

pub const PURPLE: Hsla = Hsla {
    h: 0.734,
    s: 0.569,
    l: 0.637,
    a: 1.0,
}; // #9146FF
pub const PURPLE_HOVER: Hsla = Hsla {
    h: 0.733,
    s: 0.390,
    l: 0.720,
    a: 1.0,
}; // #A970FF
pub const PURPLE_DIM: Hsla = Hsla {
    h: 0.693,
    s: 0.357,
    l: 0.731,
    a: 1.0,
}; // #8D78FD
pub const PURPLE_DARK: Hsla = Hsla {
    h: 0.711,
    s: 0.640,
    l: 0.567,
    a: 1.0,
}; // #6534ED
pub const TEXT_PRIMARY: Hsla = Hsla {
    h: 0.0,
    s: 0.0,
    l: 0.941,
    a: 1.0,
}; // #EFEFF1
pub const TEXT_MUTED: Hsla = Hsla {
    h: 0.667,
    s: 0.031,
    l: 0.700,
    a: 1.0,
}; // #ADADB8
pub const TEXT_DIM: Hsla = Hsla {
    h: 0.605,
    s: 0.057,
    l: 0.649,
    a: 1.0,
}; // #9CA3AF
pub const BORDER: Hsla = Hsla {
    h: 0.0,
    s: 0.0,
    l: 1.0,
    a: 0.1,
};
pub const SURFACE: Hsla = Hsla {
    h: 0.0,
    s: 0.0,
    l: 1.0,
    a: 0.05,
};
pub const GREEN: Hsla = Hsla {
    h: 0.394,
    s: 0.500,
    l: 0.580,
    a: 1.0,
}; // #4ADE80
pub const YELLOW: Hsla = Hsla {
    h: 0.133,
    s: 0.845,
    l: 0.531,
    a: 1.0,
}; // #FACC15
pub const RED: Hsla = Hsla {
    h: 0.0,
    s: 0.374,
    l: 0.708,
    a: 1.0,
}; // #F87171
pub const BLUE: Hsla = Hsla {
    h: 0.592,
    s: 0.445,
    l: 0.678,
    a: 1.0,
}; // #60A5FA
pub const PURPLE_LIGHT: Hsla = Hsla {
    h: 0.701,
    s: 0.166,
    l: 0.851,
    a: 1.0,
}; // #C4B5FD

// ── Shared UI widgets ────────────────────────────────────────────────────────

pub fn glass_card() -> impl IntoElement {
    div()
        .rounded_lg()
        .border_1()
        .border_color(hsla(0.755, 1.0, 0.63, 0.3))
        .bg(hsla(0.0, 0.0, 0.1, 0.8))
        .shadow_lg()
}

pub fn btn_primary(label: &'static str) -> Button {
    Button::new(label).label(label).primary().rounded_full()
}

pub fn status_pill(running: bool, reconnecting: bool) -> impl IntoElement {
    let (bg, fg, text) = if reconnecting {
        (hsla(0.15, 0.85, 0.6, 0.2), YELLOW, "● Reconnecting…")
    } else if running {
        (hsla(0.33, 0.9, 0.6, 0.2), GREEN, "● Running")
    } else {
        (hsla(0.0, 0.0, 0.5, 0.2), TEXT_DIM, "○ Stopped")
    };
    div()
        .px_3()
        .py_1()
        .rounded_full()
        .bg(bg)
        .text_color(fg)
        .text_xs()
        .font_weight(FontWeight::MEDIUM)
        .child(text)
}

// ── App model ───────────────────────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Page {
    Dashboard,
    ModelTest,
    Config,
    Vocabulary,
    Log,
    Credits,
}

#[derive(Serialize, Deserialize, Clone, Copy)]
struct Volumes {
    first: f32,
    remaining: f32,
}

impl Default for Volumes {
    fn default() -> Self {
        Volumes {
            first: 1.0,
            remaining: 1.0,
        }
    }
}

const MAX_LOG_ENTRIES: usize = 50;

pub struct AppModel {
    pub logged_in: bool,
    pub username: Option<String>,
    pub page: Page,
    pub status: ChatStatus,
    pub bonsai: BonsaiStatus,
    pub translations: Vec<TranslationEvent>,
    pub lookups: Vec<DictionaryEvent>,
    pub sound_first: Option<String>,
    pub sound_remaining: Option<String>,
    pub volume_first: f32,
    pub volume_remaining: f32,
    pub gemini_key_configured: bool,
    pub client_id: Option<String>,
    /// Transient error/success message shown as a toast in the shell.
    pub toast: Option<String>,
    seen_users: HashSet<String>,
}

impl AppModel {
    pub fn new(_cx: &mut Context<Self>) -> Self {
        let volumes = std::fs::read_to_string(app_data_dir().join("volumes.json"))
            .ok()
            .and_then(|s| serde_json::from_str::<Volumes>(&s).ok())
            .unwrap_or_default();

        let logged_in = crate::auth::has_stored_token();
        let username = crate::auth::get_stored_token(&crate::auth::shared_state())
            .ok()
            .flatten()
            .and_then(|t| t.login);
        let client_id = crate::auth::load_client_id().ok().flatten();

        AppModel {
            logged_in,
            username,
            page: Page::Dashboard,
            status: get_chat_status(),
            bonsai: BonsaiStatus {
                enabled: false,
                runtime_found: false,
                active_model: "8b".to_string(),
                models: Vec::new(),
            },
            translations: Vec::new(),
            lookups: Vec::new(),
            sound_first: None,
            sound_remaining: None,
            volume_first: volumes.first,
            volume_remaining: volumes.remaining,
            gemini_key_configured: has_gemini_api_key(),
            client_id,
            toast: None,
            seen_users: HashSet::new(),
        }
    }

    fn save_volumes(&self) {
        let volumes = Volumes {
            first: self.volume_first,
            remaining: self.volume_remaining,
        };
        let path = app_data_dir().join("volumes.json");
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_string(&volumes) {
            let _ = std::fs::write(&path, json);
        }
    }

    pub fn handle_app_event(&mut self, event: &crate::AppEvent) {
        match event {
            crate::AppEvent::ChatMessage(ev) => {
                let is_new = !self.seen_users.contains(&ev.username);
                self.seen_users.insert(ev.username.clone());
                let (sound, volume) = if is_new {
                    (self.sound_first.clone(), self.volume_first)
                } else {
                    (self.sound_remaining.clone(), self.volume_remaining)
                };
                if let Some(path) = sound {
                    play_sound_file(std::path::PathBuf::from(path), volume);
                }
            }
            crate::AppEvent::Translation(ev) => {
                self.translations.insert(0, ev.clone());
                self.translations.truncate(MAX_LOG_ENTRIES);
            }
            crate::AppEvent::Dictionary(ev) => {
                self.lookups.insert(0, ev.clone());
                self.lookups.truncate(MAX_LOG_ENTRIES);
            }
        }
    }

    pub fn refresh_sounds(&mut self) {
        self.sound_first = crate::sounds::get_sound("first")
            .ok()
            .flatten()
            .map(|s| s.path.to_string_lossy().to_string());
        self.sound_remaining = crate::sounds::get_sound("remaining")
            .ok()
            .flatten()
            .map(|s| s.path.to_string_lossy().to_string());
    }

    pub fn refresh_status(&mut self) {
        self.status = get_chat_status();
        self.gemini_key_configured = has_gemini_api_key();
        self.client_id = crate::auth::load_client_id().ok().flatten();
        self.username = crate::auth::get_stored_token(&crate::auth::shared_state())
            .ok()
            .flatten()
            .and_then(|t| t.login);
    }
}

impl EventEmitter<crate::AppEvent> for AppModel {}

// ── Root view ───────────────────────────────────────────────────────────────

pub struct AppView {
    model: Entity<AppModel>,
    login: Entity<login::LoginView>,
    shell: Entity<pages::ShellView>,
}

impl AppView {
    pub fn new(model: Entity<AppModel>, window: &mut Window, cx: &mut Context<Self>) -> Self {
        cx.observe(&model, |_, _, cx| cx.notify()).detach();
        let login = cx.new(|cx| login::LoginView::new(model.clone(), window, cx));
        let shell = cx.new(|cx| pages::ShellView::new(model.clone(), window, cx));

        // Drain events from the IRC listener (100ms poll)
        cx.spawn_in(window, async move |this, cx| {
            let mut interval = gpui::Timer::interval(std::time::Duration::from_millis(100));
            use futures_util::StreamExt;
            loop {
                interval.next().await;
                let mut events = Vec::new();
                while let Ok(ev) = event_receiver()
                    .lock()
                    .expect("event channel poisoned")
                    .try_recv()
                {
                    events.push(ev);
                }
                if events.is_empty() {
                    continue;
                }
                let _ = this.update_in(cx, |view, _window, cx| {
                    for ev in &events {
                        view.model.update(cx, |model, _| {
                            model.handle_app_event(ev);
                        });
                    }
                    cx.notify();
                });
            }
        })
        .detach();

        // Poll status + bonsai state every 2s
        cx.spawn_in(window, async move |this, cx| {
            let mut interval = gpui::Timer::interval(std::time::Duration::from_secs(2));
            use futures_util::StreamExt;
            loop {
                interval.next().await;
                let bonsai = crate::get_bonsai_status().await.ok();
                let _ = this.update_in(cx, |view, _window, cx| {
                    view.model.update(cx, |model, cx| {
                        model.refresh_status();
                        if let Some(b) = bonsai.clone() {
                            model.bonsai = b;
                        }
                        cx.notify();
                    });
                    cx.notify();
                });
            }
        })
        .detach();

        AppView {
            model,
            login,
            shell,
        }
    }
}

impl Render for AppView {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let logged_in = self.model.read(cx).logged_in;
        let element: AnyElement = if logged_in {
            self.shell.clone().into_any_element()
        } else {
            self.login.clone().into_any_element()
        };
        element
    }
}

// re-exports used by pages
