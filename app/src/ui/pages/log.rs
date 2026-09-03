use gpui::{
    div, hsla, prelude::*, px, Context, Entity, FontWeight, IntoElement, Render, SharedString,
    Styled, Window,
};

use super::{format_time, page_header};
use crate::ui::{self, AppModel, BLUE, GREEN, PURPLE_LIGHT, TEXT_DIM, TEXT_MUTED, TEXT_PRIMARY};

pub struct LogPage {
    _model: Entity<AppModel>,
}

impl LogPage {
    pub fn new(model: Entity<AppModel>, cx: &mut Context<Self>) -> Self {
        cx.observe(&model, |_, _, cx| cx.notify()).detach();
        LogPage { _model: model }
    }
}

impl Render for LogPage {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let model = self._model.clone();
        let translations = self._model.read(cx).translations.clone();
        let lookups = self._model.read(cx).lookups.clone();

        div()
            .w_full()
            .max_w(px(672.0))
            .mx_auto()
            .flex()
            .flex_col()
            .gap_4()
            .child(page_header("Log"))
            .child(
                div()
                    .rounded_xl()
                    .border_1()
                    .border_color(ui::BORDER)
                    .bg(hsla(0.0, 0.0, 1.0, 0.05))
                    .p_8()
                    .flex()
                    .flex_col()
                    .gap_8()
                    .child(translation_section(&model, &translations))
                    .child(super::divider())
                    .child(dictionary_section(&model, &lookups)),
            )
    }
}

fn clear_button(id: &'static str, model: &Entity<AppModel>, kind: ClearKind) -> impl IntoElement {
    let model = model.clone();
    div()
        .id(id)
        .text_xs()
        .text_color(TEXT_MUTED)
        .cursor_pointer()
        .hover(|s| s.text_color(gpui::white()))
        .on_click(move |_ev, _window, cx| {
            model.update(cx, |m, cx| {
                match kind {
                    ClearKind::Translations => m.translations.clear(),
                    ClearKind::Lookups => m.lookups.clear(),
                }
                cx.notify();
            });
        })
        .child("Clear")
}

#[derive(Clone, Copy)]
enum ClearKind {
    Translations,
    Lookups,
}

fn translation_section(
    model: &Entity<AppModel>,
    entries: &[crate::TranslationEvent],
) -> impl IntoElement {
    let entries = entries.to_vec();

    div()
        .flex()
        .flex_col()
        .gap_3()
        .child(
            div()
                .flex()
                .items_center()
                .justify_between()
                .child(
                    div()
                        .text_lg()
                        .font_weight(FontWeight::SEMIBOLD)
                        .text_color(TEXT_PRIMARY)
                        .child("Translation Log"),
                )
                .child(clear_button(
                    "clear-translations",
                    model,
                    ClearKind::Translations,
                )),
        )
        .when(entries.is_empty(), |d| {
            d.child(
                div()
                    .p_8()
                    .rounded_xl()
                    .bg(ui::SURFACE)
                    .border_1()
                    .border_color(ui::BORDER)
                    .text_center()
                    .text_sm()
                    .text_color(TEXT_DIM)
                    .child("No translations yet. Start the listener and use !ts in chat."),
            )
        })
        .when(!entries.is_empty(), |d| {
            d.child(
                div()
                    .id("translation-log")
                    .h_96()
                    .overflow_y_scroll()
                    .flex()
                    .flex_col()
                    .gap_3()
                    .children(entries.iter().map(|t| {
                        let t = t.clone();
                        div()
                            .id(SharedString::from(format!(
                                "tl{}{}",
                                t.timestamp, t.original_user
                            )))
                            .p_4()
                            .rounded_xl()
                            .bg(ui::SURFACE)
                            .border_1()
                            .border_color(ui::BORDER)
                            .flex()
                            .flex_col()
                            .gap_2()
                            .child(
                                div()
                                    .flex()
                                    .items_center()
                                    .justify_between()
                                    .child(
                                        div()
                                            .flex()
                                            .items_center()
                                            .gap_2()
                                            .child(
                                                div()
                                                    .text_sm()
                                                    .font_weight(FontWeight::MEDIUM)
                                                    .text_color(PURPLE_LIGHT)
                                                    .child(format!("@{}", t.original_user)),
                                            )
                                            .child(div().text_xs().text_color(TEXT_DIM).child(
                                                format!("{} → {}", t.source_lang, t.target_lang),
                                            )),
                                    )
                                    .child(
                                        div()
                                            .text_xs()
                                            .text_color(TEXT_DIM)
                                            .child(format_time(&t.timestamp)),
                                    ),
                            )
                            .child(
                                div()
                                    .text_sm()
                                    .text_color(TEXT_DIM)
                                    .child(SharedString::from(format!(
                                        "Original: {}",
                                        t.original_message
                                    ))),
                            )
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(TEXT_DIM)
                                    .font_weight(FontWeight::SEMIBOLD)
                                    .child("TRANSLATIONS:"),
                            )
                            .children(t.suggestions.iter().map(|s| {
                                let (fg, bg) = match s.formality.as_str() {
                                    "casual" => (BLUE, hsla(0.6, 0.8, 0.7, 0.2)),
                                    "formal" => (PURPLE_LIGHT, hsla(0.71, 0.92, 0.85, 0.2)),
                                    _ => (GREEN, hsla(0.33, 0.9, 0.6, 0.2)),
                                };
                                div()
                                    .flex()
                                    .items_start()
                                    .gap_2()
                                    .border_l_2()
                                    .border_color(hsla(0.0, 0.0, 1.0, 0.1))
                                    .pl_3()
                                    .child(
                                        div()
                                            .px_2()
                                            .py_0p5()
                                            .rounded_md()
                                            .text_xs()
                                            .font_weight(FontWeight::SEMIBOLD)
                                            .border_1()
                                            .text_color(fg)
                                            .border_color(hsla(0.0, 0.0, 1.0, 0.15))
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
                            .when(!t.points.is_empty(), |d| {
                                d.child(
                                    div()
                                        .border_l_2()
                                        .border_color(hsla(0.71, 0.92, 0.85, 0.5))
                                        .pl_3()
                                        .child(
                                            div()
                                                .text_xs()
                                                .text_color(TEXT_DIM)
                                                .font_weight(FontWeight::SEMIBOLD)
                                                .child(format!("翻訳の根拠 ({})", t.points.len())),
                                        )
                                        .children(t.points.iter().map(|p| {
                                            div()
                                                .text_xs()
                                                .text_color(TEXT_DIM)
                                                .child(format!("• {}", p))
                                        })),
                                )
                            })
                    })),
            )
        })
}

fn dictionary_section(
    model: &Entity<AppModel>,
    entries: &[crate::DictionaryEvent],
) -> impl IntoElement {
    let entries = entries.to_vec();

    div()
        .flex()
        .flex_col()
        .gap_3()
        .child(
            div()
                .flex()
                .items_center()
                .justify_between()
                .child(
                    div()
                        .text_lg()
                        .font_weight(FontWeight::SEMIBOLD)
                        .text_color(TEXT_PRIMARY)
                        .child("Dictionary Log"),
                )
                .child(clear_button("clear-lookups", model, ClearKind::Lookups)),
        )
        .when(entries.is_empty(), |d| {
            d.child(
                div()
                    .p_8()
                    .rounded_xl()
                    .bg(ui::SURFACE)
                    .border_1()
                    .border_color(ui::BORDER)
                    .text_center()
                    .text_sm()
                    .text_color(TEXT_DIM)
                    .child("No lookups yet. Use !d word in chat."),
            )
        })
        .when(!entries.is_empty(), |d| {
            d.child(
                div()
                    .id("dictionary-log")
                    .h_96()
                    .overflow_y_scroll()
                    .flex()
                    .flex_col()
                    .gap_3()
                    .children(entries.iter().map(|e| {
                        let e = e.clone();
                        div()
                            .id(SharedString::from(format!(
                                "dl{}{}",
                                e.timestamp, e.original_user
                            )))
                            .p_4()
                            .rounded_xl()
                            .bg(ui::SURFACE)
                            .border_1()
                            .border_color(ui::BORDER)
                            .flex()
                            .flex_col()
                            .gap_2()
                            .child(
                                div()
                                    .flex()
                                    .items_center()
                                    .justify_between()
                                    .child(
                                        div()
                                            .flex()
                                            .items_center()
                                            .gap_2()
                                            .child(
                                                div()
                                                    .text_sm()
                                                    .font_weight(FontWeight::MEDIUM)
                                                    .text_color(PURPLE_LIGHT)
                                                    .child(format!("@{}", e.original_user)),
                                            )
                                            .child(div().text_xs().text_color(TEXT_DIM).child(
                                                format!("{} → {}", e.source_lang, e.target_lang),
                                            )),
                                    )
                                    .child(
                                        div()
                                            .text_xs()
                                            .text_color(TEXT_DIM)
                                            .child(format_time(&e.timestamp)),
                                    ),
                            )
                            .child(
                                div()
                                    .flex()
                                    .items_center()
                                    .gap_2()
                                    .child(
                                        div()
                                            .text_xl()
                                            .font_weight(FontWeight::BOLD)
                                            .text_color(gpui::white())
                                            .child(e.word.clone()),
                                    )
                                    .child(
                                        div().text_xs().text_color(TEXT_DIM).child("(Dictionary)"),
                                    ),
                            )
                            .child(
                                div()
                                    .p_3()
                                    .rounded_lg()
                                    .bg(ui::SURFACE)
                                    .border_l_2()
                                    .border_color(hsla(0.6, 0.8, 0.7, 0.5))
                                    .child(
                                        div()
                                            .text_xs()
                                            .font_weight(FontWeight::SEMIBOLD)
                                            .text_color(BLUE)
                                            .child("MEANING"),
                                    )
                                    .child(
                                        div()
                                            .text_sm()
                                            .text_color(hsla(0.0, 0.0, 0.84, 1.0))
                                            .child(e.meaning.clone()),
                                    ),
                            )
                            .when(!e.examples.is_empty(), |d| {
                                d.child(
                                    div()
                                        .border_l_2()
                                        .border_color(hsla(0.33, 0.9, 0.6, 0.5))
                                        .pl_3()
                                        .child(
                                            div()
                                                .text_xs()
                                                .text_color(TEXT_DIM)
                                                .font_weight(FontWeight::SEMIBOLD)
                                                .child(format!(
                                                    "例文 (Examples) ({})",
                                                    e.examples.len()
                                                )),
                                        )
                                        .children(e.examples.iter().enumerate().map(|(i, ex)| {
                                            div().text_xs().text_color(TEXT_DIM).child(format!(
                                                "{}. {}",
                                                i + 1,
                                                ex
                                            ))
                                        })),
                                )
                            })
                            .when(!e.similar_words.is_empty(), |d| {
                                d.child(
                                    div()
                                        .border_l_2()
                                        .border_color(hsla(0.71, 0.92, 0.85, 0.5))
                                        .pl_3()
                                        .child(
                                            div()
                                                .text_xs()
                                                .text_color(TEXT_DIM)
                                                .font_weight(FontWeight::SEMIBOLD)
                                                .child("類義語 (Synonyms)"),
                                        )
                                        .child(
                                            div()
                                                .text_xs()
                                                .text_color(TEXT_DIM)
                                                .child(e.similar_words.join(", ")),
                                        ),
                                )
                            })
                    })),
            )
        })
}
