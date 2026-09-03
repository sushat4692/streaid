use gpui::{
    div, hsla, prelude::*, px, App, Context, Entity, FontWeight, IntoElement, Render, SharedString,
    Styled, Window,
};
use gpui_component::button::ButtonVariants;
use gpui_component::input::{Input, InputState};
use gpui_component::Disableable;

use crate::ui::{self, AppModel, BLUE, PURPLE_LIGHT, TEXT_DIM, TEXT_PRIMARY};
use crate::ModelTestResult;

use super::page_header;

const PROVIDERS: [(&str, &str, &str); 3] = [
    ("gemini", "Gemini 3.1 Flash Lite", "Cloud API"),
    ("bonsai-8b", "Local Model 8B", "On-device, offline"),
    ("bonsai-4b", "Local Model 4B", "On-device, lighter"),
];

const PROVIDER_OPTIONS: [(&str, &str); 3] = [
    ("gemini", "Gemini 3.1 Flash Lite"),
    ("bonsai-8b", "Local Model 8B"),
    ("bonsai-4b", "Local Model 4B"),
];

const MODE_OPTIONS: [(&str, &str); 2] = [("ts", "!ts 翻訳"), ("d", "!d 辞書")];

pub struct ModelTestPage {
    _model: Entity<AppModel>,
    text: Entity<InputState>,
    provider: String,
    mode: String,
    loading: bool,
    result: Option<ModelTestResult>,
    error: Option<String>,
}

impl ModelTestPage {
    pub fn new(model: Entity<AppModel>, window: &mut Window, cx: &mut Context<Self>) -> Self {
        cx.observe(&model, |_, _, cx| cx.notify()).detach();
        let text = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("Enter a sentence in Japanese or English...")
                .multi_line(true)
                .rows(3)
                .soft_wrap(true)
        });
        ModelTestPage {
            _model: model,
            text,
            provider: "gemini".to_string(),
            mode: "ts".to_string(),
            loading: false,
            result: None,
            error: None,
        }
    }

    fn set_provider(&mut self, provider: String, cx: &mut Context<Self>) {
        self.provider = provider;
        self.result = None;
        self.error = None;
        cx.notify();
    }

    fn set_mode(&mut self, mode: String, cx: &mut Context<Self>) {
        self.mode = mode;
        self.result = None;
        self.error = None;
        cx.notify();
    }

    fn run(&mut self, cx: &mut Context<Self>) {
        if self.loading {
            return;
        }
        let text = self.text.read(cx).value().to_string();
        if text.trim().is_empty() {
            return;
        }
        self.loading = true;
        self.error = None;
        cx.notify();

        let provider = self.provider.clone();
        let mode = self.mode.clone();
        let weak = cx.weak_entity();
        cx.spawn(async move |_, cx| {
            let result = crate::test_model(text, provider, mode).await;
            let _ = weak.update(&mut *cx, |this, cx| {
                this.loading = false;
                match result {
                    Ok(r) => this.result = Some(r),
                    Err(e) => this.error = Some(e),
                }
                cx.notify();
            });
        })
        .detach();
    }
}

fn segmented(
    id: &'static str,
    options: &'static [(&'static str, &'static str)],
    selected: &str,
    on_select: impl Fn(String, &mut App) + 'static,
) -> impl IntoElement {
    let on_select = std::sync::Arc::new(on_select);
    div()
        .id(id)
        .flex()
        .flex_wrap()
        .gap_1()
        .p_1()
        .rounded_lg()
        .bg(ui::SURFACE)
        .border_1()
        .border_color(ui::BORDER)
        .children(options.iter().map(move |(value, label)| {
            let is_active = *value == selected;
            let on_select = on_select.clone();
            div()
                .id(SharedString::from(format!("{}{}", id, value)))
                .px_4()
                .py_2()
                .rounded_md()
                .text_sm()
                .font_weight(FontWeight::MEDIUM)
                .cursor_pointer()
                .when(is_active, |d| {
                    d.bg(hsla(0.755, 1.0, 0.63, 0.2))
                        .text_color(gpui::white())
                        .border_1()
                        .border_color(hsla(0.755, 1.0, 0.63, 0.4))
                })
                .when(!is_active, |d| {
                    d.text_color(TEXT_DIM)
                        .hover(|s| s.text_color(gpui::white()).bg(hsla(0.0, 0.0, 1.0, 0.05)))
                })
                .on_click({
                    let value = (*value).to_string();
                    let on_select = on_select.clone();
                    move |_ev: &gpui::ClickEvent, _window: &mut Window, cx: &mut App| {
                        on_select(value.clone(), cx);
                    }
                })
                .child(*label)
        }))
}

impl Render for ModelTestPage {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let this_provider = cx.weak_entity();
        let this_mode = cx.weak_entity();
        let text_empty = self.text.read(cx).value().is_empty();
        let is_bonsai = self.provider.starts_with("bonsai");
        let error = self.error.clone();
        let result = self.result.clone();
        let provider_label = PROVIDERS
            .iter()
            .find(|(v, _, _)| *v == self.provider)
            .map(|(_, l, _)| *l)
            .unwrap_or("Gemini 3.1 Flash Lite");
        let button_label = if self.mode == "d" {
            "Lookup"
        } else {
            "Translate"
        };

        div()
            .w_full()
            .min_w_0()
            .flex()
            .flex_col()
            .items_center()
            .gap_4()
            .child(page_header("Model Test"))
            .child(
                div()
                    .w_full()
                    .max_w(px(768.0))
                    .min_w_0()
                    .flex()
                    .flex_col()
                    .gap_4()
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .gap_2()
                            .child(
                                div()
                                    .text_sm()
                                    .font_weight(FontWeight::MEDIUM)
                                    .text_color(ui::TEXT_MUTED)
                                    .child("Provider"),
                            )
                            .child(segmented(
                                "provider",
                                &PROVIDER_OPTIONS,
                                self.provider.as_str(),
                                {
                                    let this = this_provider.clone();
                                    move |v: String, cx: &mut App| {
                                        if let Some(view) = this.upgrade() {
                                            view.update(cx, |page, cx| {
                                                page.set_provider(v.clone(), cx);
                                            });
                                        }
                                    }
                                },
                            ))
                            .child(
                                div().text_xs().text_color(TEXT_DIM).child(
                                    PROVIDERS
                                        .iter()
                                        .find(|(v, _, _)| *v == self.provider)
                                        .map(|(_, _, d)| *d)
                                        .unwrap_or(""),
                                ),
                            ),
                    )
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .gap_2()
                            .child(
                                div()
                                    .text_sm()
                                    .font_weight(FontWeight::MEDIUM)
                                    .text_color(ui::TEXT_MUTED)
                                    .child("Mode"),
                            )
                            .child(segmented("mode", &MODE_OPTIONS, self.mode.as_str(), {
                                let this = this_mode.clone();
                                move |v: String, cx: &mut App| {
                                    if let Some(view) = this.upgrade() {
                                        view.update(cx, |page, cx| {
                                            page.set_mode(v.clone(), cx);
                                        });
                                    }
                                }
                            })),
                    )
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .gap_2()
                            .child(
                                div()
                                    .text_sm()
                                    .font_weight(FontWeight::MEDIUM)
                                    .text_color(ui::TEXT_MUTED)
                                    .child("Text"),
                            )
                            .child(Input::new(&self.text).w_full()),
                    )
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .justify_between()
                            .child(div().text_xs().text_color(TEXT_DIM).child(if is_bonsai {
                                "Requires the Local Model toggle to be enabled in Chat Listener"
                            } else {
                                "Uses your Gemini API key"
                            }))
                            .child(
                                gpui_component::button::Button::new("run-test")
                                    .label(if self.loading {
                                        "Working..."
                                    } else {
                                        button_label
                                    })
                                    .primary()
                                    .disabled(self.loading || text_empty)
                                    .on_click({
                                        let this = cx.weak_entity();
                                        move |_ev, _window, cx| {
                                            if let Some(view) = this.upgrade() {
                                                view.update(cx, |page, cx| {
                                                    page.run(cx);
                                                });
                                            }
                                        }
                                    }),
                            ),
                    ),
            )
            .when(error.is_some(), |d| {
                d.child(
                    div()
                        .p_3()
                        .rounded_xl()
                        .bg(hsla(0.0, 0.75, 0.71, 0.1))
                        .border_1()
                        .border_color(hsla(0.0, 0.75, 0.71, 0.2))
                        .text_xs()
                        .text_color(ui::RED)
                        .child(SharedString::from(error.unwrap_or_default())),
                )
            })
            .when(result.is_some(), |d| {
                d.child(result_card(provider_label, result.unwrap()))
            })
    }
}

fn result_card(provider_label: &str, result: ModelTestResult) -> impl IntoElement {
    match result {
        ModelTestResult::Ts {
            source_lang,
            target_lang,
            suggestions,
            points,
            duration_ms,
        } => div()
            .rounded_2xl()
            .border_1()
            .border_color(ui::BORDER)
            .bg(ui::SURFACE)
            .p_5()
            .flex()
            .flex_col()
            .gap_4()
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
                            .child(format!("{} · !ts", provider_label)),
                    )
                    .child(div().text_xs().text_color(TEXT_DIM).child(format!(
                        "{} → {} · {:.1}s",
                        source_lang,
                        target_lang,
                        duration_ms as f64 / 1000.0
                    ))),
            )
            .children(suggestions.iter().map(|s| {
                let (fg, bg) = match s.formality.as_str() {
                    "casual" => (BLUE, hsla(0.6, 0.8, 0.7, 0.2)),
                    "formal" => (PURPLE_LIGHT, hsla(0.71, 0.92, 0.85, 0.2)),
                    _ => (hsla(0.0, 0.0, 0.84, 1.0), hsla(0.0, 0.0, 1.0, 0.1)),
                };
                div()
                    .flex()
                    .items_start()
                    .gap_2()
                    .child(
                        div()
                            .px_2()
                            .py_0p5()
                            .rounded_md()
                            .text_xs()
                            .font_weight(FontWeight::SEMIBOLD)
                            .text_color(fg)
                            .bg(bg)
                            .child(s.formality.to_uppercase()),
                    )
                    .child(
                        div()
                            .text_sm()
                            .text_color(TEXT_PRIMARY)
                            .flex_1()
                            .child(SharedString::from(s.text.clone())),
                    )
            }))
            .when(!points.is_empty(), |d| {
                d.child(
                    div()
                        .pt_3()
                        .border_t_1()
                        .border_color(ui::BORDER)
                        .child(
                            div()
                                .text_xs()
                                .font_weight(FontWeight::SEMIBOLD)
                                .text_color(TEXT_DIM)
                                .child("LINGUISTIC POINTS"),
                        )
                        .children(points.iter().map(|p| {
                            div()
                                .text_xs()
                                .text_color(TEXT_DIM)
                                .child(format!("• {}", p))
                        })),
                )
            }),
        ModelTestResult::D {
            source_lang,
            target_lang,
            word,
            meaning,
            examples,
            similar_words,
            duration_ms,
        } => div()
            .rounded_2xl()
            .border_1()
            .border_color(ui::BORDER)
            .bg(ui::SURFACE)
            .p_5()
            .flex()
            .flex_col()
            .gap_4()
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
                            .child(format!("{} · !d", provider_label)),
                    )
                    .child(div().text_xs().text_color(TEXT_DIM).child(format!(
                        "{} → {} · {:.1}s",
                        source_lang,
                        target_lang,
                        duration_ms as f64 / 1000.0
                    ))),
            )
            .child(
                div()
                    .child(
                        div()
                            .text_xs()
                            .font_weight(FontWeight::SEMIBOLD)
                            .text_color(TEXT_DIM)
                            .child("MEANING"),
                    )
                    .child(
                        div()
                            .text_sm()
                            .text_color(TEXT_PRIMARY)
                            .child(SharedString::from(format!("{} — {}", word, meaning))),
                    ),
            )
            .when(!examples.is_empty(), |d| {
                d.child(
                    div()
                        .child(
                            div()
                                .text_xs()
                                .font_weight(FontWeight::SEMIBOLD)
                                .text_color(TEXT_DIM)
                                .child("EXAMPLES"),
                        )
                        .children(examples.iter().map(|ex| {
                            div()
                                .text_xs()
                                .text_color(TEXT_DIM)
                                .child(format!("• {}", ex))
                        })),
                )
            })
            .when(!similar_words.is_empty(), |d| {
                d.child(
                    div()
                        .flex()
                        .flex_col()
                        .gap_2()
                        .child(
                            div()
                                .text_xs()
                                .font_weight(FontWeight::SEMIBOLD)
                                .text_color(TEXT_DIM)
                                .child("SIMILAR WORDS"),
                        )
                        .child(div().flex().flex_wrap().gap_2().children(
                            similar_words.iter().map(|w| {
                                div()
                                    .px_2p5()
                                    .py_1()
                                    .rounded_full()
                                    .bg(ui::SURFACE)
                                    .border_1()
                                    .border_color(ui::BORDER)
                                    .text_xs()
                                    .text_color(hsla(0.0, 0.0, 0.84, 1.0))
                                    .child(w.clone())
                            }),
                        )),
                )
            }),
    }
}
