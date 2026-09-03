use std::time::Duration;

use gpui::{
    div, hsla, prelude::*, px, App, ClipboardItem, Context, Entity, FontWeight, IntoElement,
    PathPromptOptions, Render, SharedString, Styled, Window,
};
use gpui_component::button::{Button, ButtonVariants};
use gpui_component::input::{Input, InputState};
use gpui_component::slider::{Slider, SliderEvent, SliderState};
use gpui_component::{Disableable, Sizable};

use super::{page_header, pill};
use crate::ui::{self, AppModel, GREEN, PURPLE, TEXT_DIM, TEXT_MUTED, TEXT_PRIMARY, YELLOW};

pub struct ConfigPage {
    model: Entity<AppModel>,
    target_channel: Entity<InputState>,
    gemini_key: Entity<InputState>,
    volume_first: Entity<SliderState>,
    volume_remaining: Entity<SliderState>,
    is_saving_key: bool,
    is_bonsai_toggling: bool,
    copied: bool,
}

impl ConfigPage {
    pub fn new(model: Entity<AppModel>, window: &mut Window, cx: &mut Context<Self>) -> Self {
        cx.observe(&model, |_, _, cx| cx.notify()).detach();

        let target_channel = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("Leave empty for your channel, or enter any channel (e.g., xqc)")
        });
        // Pre-fill from last used channel
        if let Some(ch) = model.read(cx).status.last_target_channel.clone() {
            target_channel.update(cx, |s, cx| s.set_value(ch, window, cx));
        }

        let gemini_key = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("Enter your Gemini API key")
                .masked(true)
        });

        let volume_first = cx.new(|cx| {
            SliderState::new()
                .min(0.0)
                .max(100.0)
                .step(1.0)
                .default_value(model.read(cx).volume_first * 100.0)
        });
        let volume_remaining = cx.new(|cx| {
            SliderState::new()
                .min(0.0)
                .max(100.0)
                .step(1.0)
                .default_value(model.read(cx).volume_remaining * 100.0)
        });

        cx.subscribe(&volume_first, |this, _, evt, cx| {
            let SliderEvent::Change(v) = evt;
            let vol = v.start() / 100.0;
            this.model.update(cx, |m, cx| {
                m.volume_first = vol;
                m.save_volumes();
                cx.notify();
            });
        })
        .detach();

        cx.subscribe(&volume_remaining, |this, _, evt, cx| {
            let SliderEvent::Change(v) = evt;
            let vol = v.start() / 100.0;
            this.model.update(cx, |m, cx| {
                m.volume_remaining = vol;
                m.save_volumes();
                cx.notify();
            });
        })
        .detach();

        ConfigPage {
            model,
            target_channel,
            gemini_key,
            volume_first,
            volume_remaining,
            is_saving_key: false,
            is_bonsai_toggling: false,
            copied: false,
        }
    }

    fn save_api_key(&mut self, cx: &mut Context<Self>) {
        if self.is_saving_key {
            return;
        }
        let key = self.gemini_key.read(cx).value().to_string();
        if key.is_empty() {
            return;
        }
        self.is_saving_key = true;
        cx.notify();

        let weak = cx.weak_entity();
        let model_weak = self.model.downgrade();
        cx.spawn(async move |_, cx| {
            let result = crate::set_gemini_api_key(&key);
            let _ = weak.update(&mut *cx, |this, cx| {
                this.is_saving_key = false;
                cx.notify();
            });
            let _ = model_weak.update(&mut *cx, |m, cx| {
                m.gemini_key_configured = result.is_ok();
                m.toast = Some(match result {
                    Ok(()) => "Gemini API key saved".to_string(),
                    Err(e) => format!("Failed to save API key: {}", e),
                });
                cx.notify();
            });
        })
        .detach();
    }

    fn start_stop_listener(&mut self, cx: &mut Context<Self>) {
        let status = self.model.read(cx).status.clone();
        if status.is_running {
            let _ = crate::stop_chat_listener();
            self.model.update(cx, |m, cx| {
                m.toast = None;
                cx.notify();
            });
        } else {
            let channel = self.target_channel.read(cx).value().to_string();
            let channel = if channel.trim().is_empty() {
                None
            } else {
                Some(channel.trim().to_string())
            };
            super::start_listener(&self.model, channel, cx);
        }
    }

    fn toggle_translation(&mut self, cx: &mut Context<Self>) {
        let enabled = !self.model.read(cx).status.is_enabled;
        let _ = crate::toggle_translation(enabled);
        self.model.update(cx, |m, cx| {
            m.status.is_enabled = enabled;
            cx.notify();
        });
    }

    fn toggle_bonsai(&mut self, cx: &mut Context<Self>) {
        if self.is_bonsai_toggling {
            return;
        }
        let enabled = !self.model.read(cx).bonsai.enabled;
        self.is_bonsai_toggling = true;
        cx.notify();

        let weak = cx.weak_entity();
        let model_weak = self.model.downgrade();
        cx.spawn(async move |_, cx| {
            let result = crate::set_local_model(enabled).await;
            let _ = weak.update(&mut *cx, |this, cx| {
                this.is_bonsai_toggling = false;
                cx.notify();
            });
            let _ = model_weak.update(&mut *cx, |m, cx| {
                m.toast = Some(match result {
                    Ok(()) => {
                        if enabled {
                            "Local model enabled".to_string()
                        } else {
                            "Local model disabled".to_string()
                        }
                    }
                    Err(e) => e,
                });
                cx.notify();
            });
        })
        .detach();
    }

    fn set_bonsai_variant(&mut self, model: &str, cx: &mut Context<Self>) {
        let _ = crate::set_local_model_variant(model);
        self.model.update(cx, |m, cx| {
            m.bonsai.active_model = model.to_string();
            cx.notify();
        });
    }

    fn upload_sound(&mut self, sound_type: &'static str, cx: &mut Context<Self>) {
        let rx = cx.prompt_for_paths(PathPromptOptions {
            files: true,
            directories: false,
            multiple: false,
            prompt: Some("Choose a sound file".into()),
        });
        let model = self.model.clone();
        let weak = cx.weak_entity();
        cx.spawn(async move |_, cx| {
            let paths = rx.await.ok();
            if let Some(Ok(Some(mut paths))) = paths {
                if let Some(path) = paths.pop() {
                    let file_name = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("sound")
                        .to_string();
                    if let Ok(bytes) = std::fs::read(&path) {
                        if crate::sounds::save_sound(sound_type, &bytes, &file_name).is_ok() {
                            let _ = model.update(cx, |m, cx| {
                                m.refresh_sounds();
                                m.toast = Some("Sound saved".to_string());
                                cx.notify();
                            });
                        }
                    }
                }
            }
            let _ = weak.update(&mut *cx, |_this, cx| {
                cx.notify();
            });
        })
        .detach();
    }

    fn preview_sound(&self, cx: &mut App) {
        let sound_first = self.model.read(cx).sound_first.clone();
        if let Some(path) = sound_first {
            let vol = self.model.read(cx).volume_first;
            crate::play_sound_file(std::path::PathBuf::from(path), vol);
        }
    }

    fn copy_overlay_url(&mut self, cx: &mut Context<Self>) {
        cx.write_to_clipboard(ClipboardItem::new_string(
            "http://localhost:4242".to_string(),
        ));
        self.copied = true;
        cx.notify();
        let weak = cx.weak_entity();
        cx.spawn(async move |this, cx| {
            gpui::Timer::after(Duration::from_secs(2)).await;
            let _ = this.update(&mut *cx, |this, cx| {
                this.copied = false;
                cx.notify();
            });
            let _ = weak;
        })
        .detach();
    }
}

impl Render for ConfigPage {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let status = self.model.read(cx).status.clone();
        let bonsai = self.model.read(cx).bonsai.clone();
        let gemini_configured = self.model.read(cx).gemini_key_configured;
        let sound_first = self.model.read(cx).sound_first.clone();
        let sound_remaining = self.model.read(cx).sound_remaining.clone();
        let vol_first = self.model.read(cx).volume_first;
        let vol_remaining = self.model.read(cx).volume_remaining;

        div()
            .w_full()
            .min_w_0()
            .flex()
            .flex_col()
            .items_center()
            .gap_4()
            .child(page_header("Config"))
            .child(
                div()
                    .w_full()
                    .max_w(px(768.0))
                    .min_w_0()
                    .rounded_xl()
                    .border_1()
                    .border_color(ui::BORDER)
                    .bg(hsla(0.0, 0.0, 1.0, 0.05))
                    .p_8()
                    .flex()
                    .flex_col()
                    .gap_8()
                    .child(translation_settings(self, &status, gemini_configured, cx))
                    .child(super::divider())
                    .child(chat_listener_section(self, &status, &bonsai, cx))
                    .child(super::divider())
                    .child(sound_settings(
                        self,
                        sound_first.as_deref(),
                        sound_remaining.as_deref(),
                        vol_first,
                        vol_remaining,
                        cx,
                    ))
                    .child(super::divider())
                    .child(overlay_settings(self, cx)),
            )
    }
}

fn translation_settings(
    page: &mut ConfigPage,
    _status: &crate::ChatStatus,
    configured: bool,
    cx: &mut Context<ConfigPage>,
) -> impl IntoElement {
    let key_empty = page.gemini_key.read(cx).value().is_empty();

    div()
        .flex()
        .flex_col()
        .gap_3()
        .child(section_heading("Translation Settings"))
        .child(
            div()
                .p_4()
                .rounded_xl()
                .bg(if configured {
                    hsla(0.33, 0.9, 0.6, 0.1)
                } else {
                    hsla(0.15, 0.85, 0.6, 0.1)
                })
                .border_1()
                .border_color(if configured {
                    hsla(0.33, 0.9, 0.6, 0.2)
                } else {
                    hsla(0.15, 0.85, 0.6, 0.2)
                })
                .text_sm()
                .text_color(if configured { GREEN } else { YELLOW })
                .child(if configured {
                    "✓ Gemini API Key configured"
                } else {
                    "⚠ Please configure your Gemini API key"
                }),
        )
        .child(
            div()
                .text_sm()
                .font_weight(FontWeight::MEDIUM)
                .text_color(ui::TEXT_MUTED)
                .child("Gemini API Key"),
        )
        .child(Input::new(&page.gemini_key).w_full().h(px(44.0)))
        .child(
            div().flex().justify_end().child(
                Button::new("save-api-key")
                    .label(if page.is_saving_key {
                        "Saving..."
                    } else {
                        "Save API Key"
                    })
                    .primary()
                    .disabled(page.is_saving_key || key_empty)
                    .on_click({
                        let this = cx.weak_entity();
                        move |_ev, _window, cx| {
                            if let Some(view) = this.upgrade() {
                                view.update(cx, |v, cx| v.save_api_key(cx));
                            }
                        }
                    }),
            ),
        )
        .child(
            div()
                .flex()
                .flex_col()
                .gap_1()
                .child(
                    div()
                        .text_xs()
                        .text_color(TEXT_DIM)
                        .child("Get your API key from ")
                        .child(
                            div()
                                .id("aistudio-link")
                                .text_color(PURPLE)
                                .cursor_pointer()
                                .hover(|s| s.text_color(hsla(0.72, 1.0, 0.72, 1.0)))
                                .on_click(
                                    |_ev: &gpui::ClickEvent,
                                     _window: &mut Window,
                                     _cx: &mut App| {
                                        let _ =
                                            open::that("https://aistudio.google.com/app/apikey");
                                    },
                                )
                                .child("Google AI Studio"),
                        ),
                )
                .child(
                    div()
                        .text_xs()
                        .text_color(TEXT_DIM)
                        .child("Uses Gemini 3.1 Flash Lite model (free tier supported)"),
                )
                .child(
                    div()
                        .text_xs()
                        .text_color(TEXT_MUTED)
                        .child("Used for translating Japanese ↔ English chat messages"),
                ),
        )
}

fn chat_listener_section(
    page: &mut ConfigPage,
    status: &crate::ChatStatus,
    bonsai: &crate::BonsaiStatus,
    cx: &mut Context<ConfigPage>,
) -> impl IntoElement {
    let any_running = bonsai.models.iter().any(|m| m.running);

    div()
        .flex()
        .flex_col()
        .gap_3()
        .child(
            div()
                .flex()
                .flex_wrap()
                .items_center()
                .justify_between()
                .child(section_heading("Chat Listener"))
                .child(pill(
                    if status.reconnecting {
                        "● Reconnecting…"
                    } else if status.is_running {
                        "● Running"
                    } else {
                        "○ Stopped"
                    },
                    if status.reconnecting {
                        YELLOW
                    } else if status.is_running {
                        GREEN
                    } else {
                        TEXT_DIM
                    },
                    if status.reconnecting {
                        hsla(0.15, 0.85, 0.6, 0.2)
                    } else if status.is_running {
                        hsla(0.33, 0.9, 0.6, 0.2)
                    } else {
                        hsla(0.0, 0.0, 0.5, 0.2)
                    },
                )),
        )
        .when(!status.is_running, |d| {
            d.child(
                div()
                    .text_sm()
                    .font_weight(FontWeight::MEDIUM)
                    .text_color(ui::TEXT_MUTED)
                    .child("Target Channel"),
            )
            .child(Input::new(&page.target_channel).w_full().h(px(44.0)))
        })
        .when(status.channel.is_some(), |d| {
            d.child(
                div()
                    .p_4()
                    .rounded_xl()
                    .bg(ui::SURFACE)
                    .border_1()
                    .border_color(ui::BORDER)
                    .child(
                        div()
                            .text_sm()
                            .text_color(TEXT_DIM)
                            .child("Monitoring"),
                    )
                    .child(
                        div()
                            .font_weight(FontWeight::MEDIUM)
                            .text_color(gpui::white())
                            .child(format!("#{}", status.channel.as_deref().unwrap_or(""))),
                    ),
            )
        })
        .child(
            div()
                .flex()
                .flex_wrap()
                .gap_3()
                .child({
                    let mut btn = Button::new("start-stop").label(if status.is_running {
                        "Stop Listening"
                    } else {
                        "Start Listening"
                    });
                    if status.is_running {
                        btn = btn.danger();
                    } else {
                        btn = btn.primary();
                    }
                    btn.flex_1()
                        .on_click({
                            let this = cx.weak_entity();
                            move |_ev, _window, cx| {
                                if let Some(view) = this.upgrade() {
                                    view.update(cx, |v, cx| v.start_stop_listener(cx));
                                }
                            }
                        })
                })
                .child({
                    let mut btn = Button::new("toggle-ts").label(if status.is_enabled {
                        "Disable !ts"
                    } else {
                        "Enable !ts"
                    });
                    if status.is_enabled {
                        btn = btn.ghost();
                    } else {
                        btn = btn.danger();
                    }
                    btn.disabled(!status.is_running)
                        .flex_1()
                        .on_click({
                            let this = cx.weak_entity();
                            move |_ev, _window, cx| {
                                if let Some(view) = this.upgrade() {
                                    view.update(cx, |v, cx| v.toggle_translation(cx));
                                }
                            }
                        })
                }),
        )
        .when(status.is_running && !status.is_enabled, |d| {
            d.child(
                div()
                    .p_3()
                    .rounded_xl()
                    .bg(hsla(0.15, 0.85, 0.6, 0.1))
                    .border_1()
                    .border_color(hsla(0.15, 0.85, 0.6, 0.2))
                    .text_xs()
                    .text_color(YELLOW)
                    .child("⚠ Translation command (!ts) is currently disabled"),
            )
        })
        .child(div().pt_2().border_t_1().border_color(ui::BORDER))
        .child(
            div()
                .flex()
                .flex_wrap()
                .items_center()
                .justify_between()
                .child(
                    div()
                        .text_sm()
                        .font_weight(FontWeight::SEMIBOLD)
                        .text_color(TEXT_PRIMARY)
                        .child("Local Model (Bonsai)"),
                )
                .child(pill(
                    if any_running {
                        "● Running"
                    } else if bonsai.enabled {
                        "● Starting..."
                    } else {
                        "○ Off"
                    },
                    if any_running {
                        GREEN
                    } else if bonsai.enabled {
                        YELLOW
                    } else {
                        TEXT_DIM
                    },
                    if any_running {
                        hsla(0.33, 0.9, 0.6, 0.2)
                    } else if bonsai.enabled {
                        hsla(0.15, 0.85, 0.6, 0.2)
                    } else {
                        hsla(0.0, 0.0, 0.5, 0.2)
                    },
                )),
        )
        .child(
            div()
                .text_xs()
                .text_color(TEXT_DIM)
                .child("When enabled, !ts and !d are answered by the local model instead of the Gemini API."),
        )
        .when(!bonsai.models.is_empty(), |d| {
            d.child(
                div()
                    .flex()
                    .gap_2()
                    .flex_wrap()
                    .children(bonsai.models.iter().map(|m| {
                        let (fg, bg) = if m.running {
                            (GREEN, hsla(0.33, 0.9, 0.6, 0.1))
                        } else if m.model_found {
                            (TEXT_DIM, ui::SURFACE)
                        } else {
                            (TEXT_MUTED, ui::SURFACE)
                        };
                        pill(
                            SharedString::from(format!(
                                "{}: {}",
                                m.name.to_uppercase(),
                                if m.running { "●" } else if m.model_found { "○" } else { "—" }
                            )),
                            fg,
                            bg,
                        )
                    })),
            )
        })
        .when(bonsai.enabled, |d| {
            d.child(
                div()
                    .flex()
                    .items_center()
                    .gap_2()
                    .child(
                        div()
                            .text_xs()
                            .font_weight(FontWeight::SEMIBOLD)
                            .text_color(TEXT_DIM)
                            .child("Chat model:"),
                    )
                    .child(
                        div()
                            .flex()
                            .flex_wrap()
                            .gap_1()
                            .p_0p5()
                            .rounded_lg()
                            .bg(ui::SURFACE)
                            .border_1()
                            .border_color(ui::BORDER)
                            .children(["8b", "4b"].iter().map(|variant| {
                                let available = bonsai
                                    .models
                                    .iter()
                                    .any(|m| m.name == *variant && m.model_found);
                                let is_active = bonsai.active_model == *variant;
                                div()
                                    .id(SharedString::from(format!("variant-{}", variant)))
                                    .px_3()
                                    .py_1()
                                    .rounded_md()
                                    .text_xs()
                                    .font_weight(FontWeight::MEDIUM)
                                    .cursor_pointer()
                                    .when(!available, |d| d.opacity(0.4))
                                    .when(is_active, |d| {
                                        d.bg(hsla(0.755, 1.0, 0.63, 0.2))
                                            .text_color(gpui::white())
                                            .border_1()
                                            .border_color(hsla(0.755, 1.0, 0.63, 0.4))
                                    })
                                    .when(!is_active, |d| {
                                        d.text_color(TEXT_DIM)
                                            .hover(|s| s.text_color(gpui::white()))
                                    })
                                    .on_click({
                                        let this = cx.weak_entity();
                                        let variant = variant.to_string();
                                        move |_ev, _window, cx| {
                                            if let Some(view) = this.upgrade() {
                                                view.update(cx, |v, cx| {
                                                    v.set_bonsai_variant(&variant, cx);
                                                });
                                            }
                                        }
                                    })
                                    .child(variant.to_uppercase())
                            })),
                    ),
            )
        })
        .when(
            !bonsai.runtime_found || bonsai.models.iter().all(|m| !m.model_found),
            |d| {
                d.child(
                    div()
                        .p_3()
                        .rounded_xl()
                        .bg(hsla(0.15, 0.85, 0.6, 0.1))
                        .border_1()
                        .border_color(hsla(0.15, 0.85, 0.6, 0.2))
                        .text_xs()
                        .text_color(YELLOW)
                        .child(
                            "⚠ Not set up — run `scripts/setup-bonsai.sh` to download the model (add `--with-4b` for the 4B variant)",
                        ),
                )
            },
        )
        .when(
            bonsai.runtime_found && bonsai.models.iter().any(|m| m.model_found),
            |d| {
                d.child({
                    let mut btn = Button::new("toggle-bonsai").label(if page.is_bonsai_toggling {
                        "Switching..."
                    } else if bonsai.enabled {
                        "Disable Local Model"
                    } else {
                        "Enable Local Model"
                    });
                    if bonsai.enabled {
                        btn = btn.danger();
                    } else {
                        btn = btn.ghost();
                    }
                    btn.disabled(page.is_bonsai_toggling)
                        .w_full()
                        .on_click({
                            let this = cx.weak_entity();
                            move |_ev, _window, cx| {
                                if let Some(view) = this.upgrade() {
                                    view.update(cx, |v, cx| v.toggle_bonsai(cx));
                                }
                            }
                        })
                })
            },
        )
}

fn sound_settings(
    page: &mut ConfigPage,
    sound_first: Option<&str>,
    sound_remaining: Option<&str>,
    vol_first: f32,
    vol_remaining: f32,
    cx: &mut Context<ConfigPage>,
) -> impl IntoElement {
    div()
        .flex()
        .flex_col()
        .gap_4()
        .child(section_heading("Sound Notifications"))
        .child(
            div()
                .text_xs()
                .text_color(TEXT_DIM)
                .child(
                    "Plays a sound when a chatter sends a message. First-message tracking resets on app restart.",
                ),
        )
        .child(sound_slot(
            page,
            "New Chatter Sound",
            "first",
            sound_first,
            vol_first,
            cx,
        ))
        .child(div().h_px().w_full().bg(ui::BORDER))
        .child(sound_slot(
            page,
            "Returning Chatter Sound",
            "remaining",
            sound_remaining,
            vol_remaining,
            cx,
        ))
}

fn sound_slot(
    page: &mut ConfigPage,
    title: impl Into<SharedString>,
    sound_type: &'static str,
    sound: Option<&str>,
    volume: f32,
    cx: &mut Context<ConfigPage>,
) -> impl IntoElement {
    let file_name = sound
        .as_ref()
        .and_then(|p| std::path::Path::new(p).file_name())
        .and_then(|n| n.to_str())
        .unwrap_or("No file set")
        .to_string();
    let has_sound = sound.is_some();
    let upload_id = SharedString::from(format!("upload-{}", sound_type));
    let preview_id = SharedString::from(format!("preview-{}", sound_type));
    let clear_id = SharedString::from(format!("clear-{}", sound_type));

    div()
        .flex()
        .flex_col()
        .gap_2()
        .child(
            div()
                .text_sm()
                .font_weight(FontWeight::MEDIUM)
                .text_color(hsla(0.0, 0.0, 0.83, 1.0))
                .child(title.into()),
        )
        .child(div().text_xs().text_color(TEXT_DIM).child(file_name))
        .child(
            div()
                .flex()
                .flex_wrap()
                .gap_2()
                .child(
                    Button::new(upload_id.clone())
                        .label("Upload")
                        .ghost()
                        .small()
                        .on_click({
                            let this = cx.weak_entity();
                            move |_ev, _window, cx| {
                                if let Some(view) = this.upgrade() {
                                    view.update(cx, |v, cx| {
                                        v.upload_sound(sound_type, cx);
                                    });
                                }
                            }
                        }),
                )
                .child(
                    Button::new(preview_id.clone())
                        .label("Preview")
                        .ghost()
                        .small()
                        .disabled(!has_sound)
                        .on_click({
                            let this = cx.weak_entity();
                            move |_ev, _window, cx| {
                                if let Some(view) = this.upgrade() {
                                    view.update(cx, |v, cx| v.preview_sound(cx));
                                }
                            }
                        }),
                )
                .child(
                    Button::new(clear_id.clone())
                        .label("Clear")
                        .danger()
                        .small()
                        .disabled(!has_sound)
                        .on_click({
                            let model = page.model.clone();
                            move |_ev, _window, cx| {
                                let _ = crate::sounds::delete_sound(sound_type);
                                model.update(cx, |m, cx| {
                                    m.refresh_sounds();
                                    cx.notify();
                                });
                            }
                        }),
                ),
        )
        .child(
            div()
                .flex()
                .items_center()
                .gap_3()
                .child(div().text_xs().text_color(TEXT_DIM).child("Volume"))
                .child(
                    div().flex_1().child(
                        Slider::new(if sound_type == "first" {
                            &page.volume_first
                        } else {
                            &page.volume_remaining
                        })
                        .horizontal(),
                    ),
                )
                .child(
                    div()
                        .w_8()
                        .text_xs()
                        .text_color(TEXT_DIM)
                        .text_right()
                        .child(format!("{}%", (volume * 100.0).round() as i64)),
                ),
        )
}

fn overlay_settings(page: &mut ConfigPage, cx: &mut Context<ConfigPage>) -> impl IntoElement {
    div()
        .flex()
        .flex_col()
        .gap_3()
        .child(section_heading("OBS Overlay"))
        .child(
            div()
                .text_xs()
                .text_color(TEXT_DIM)
                .child(
                    "Add this URL as a Browser Source in OBS to show live translation and dictionary results on your stream.",
                ),
        )
        .child(
            div()
                .flex()
                .flex_wrap()
                .items_center()
                .gap_2()
                .child(
                    div()
                        .flex_1()
                        .min_w_0()
                        .rounded_lg()
                        .bg(ui::SURFACE)
                        .px_3()
                        .py_2()
                        .text_sm()
                        .font_family("monospace")
                        .text_color(PURPLE)
                        .truncate()
                        .child("http://localhost:4242"),
                )
                .child(
                    Button::new("copy-url")
                        .label(if page.copied { "Copied!" } else { "Copy" })
                        .ghost()
                        .small()
                        .on_click({
                            let this = cx.weak_entity();
                            move |_ev, _window, cx| {
                                if let Some(view) = this.upgrade() {
                                    view.update(cx, |v, cx| {
                                        v.copy_overlay_url(cx);
                                    });
                                }
                            }
                        }),
                ),
        )
        .child(
            div()
                .text_xs()
                .text_color(TEXT_MUTED)
                .child("Recommended size: 800×300 · Enable transparent background in OBS"),
        )
}

fn section_heading(title: impl Into<SharedString>) -> impl IntoElement {
    div()
        .text_lg()
        .font_weight(FontWeight::SEMIBOLD)
        .text_color(TEXT_PRIMARY)
        .child(title.into())
}
