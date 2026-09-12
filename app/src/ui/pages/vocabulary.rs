use gpui::{
    div, hsla, prelude::*, px, Context, DefiniteLength, Entity, FontWeight, IntoElement, Render,
    SharedString, Styled, Window,
};
use gpui_component::button::{Button, ButtonVariants};
use gpui_component::{Disableable, Sizable};

use crate::ui::{self, AppModel, PURPLE, TEXT_DIM, TEXT_MUTED, TEXT_PRIMARY};
use crate::vocabulary::CategoryResult;

use super::page_header;

pub struct VocabularyPage {
    _model: Entity<AppModel>,
    analyzing: bool,
    categories: Option<Vec<CategoryResult>>,
    error: Option<String>,
}

impl VocabularyPage {
    pub fn new(model: Entity<AppModel>, cx: &mut Context<Self>) -> Self {
        cx.observe(&model, |_, _, cx| cx.notify()).detach();
        VocabularyPage {
            _model: model,
            analyzing: false,
            categories: None,
            error: None,
        }
    }

    fn analyze(&mut self, cx: &mut Context<Self>) {
        if self.analyzing {
            return;
        }
        self.analyzing = true;
        self.error = None;
        cx.notify();

        let weak = cx.weak_entity();
        cx.spawn(async move |_, cx| {
            let result = crate::vocabulary::analyze_categories().await;
            let _ = weak.update(&mut *cx, |this, cx| {
                this.analyzing = false;
                match result {
                    Ok(cats) => this.categories = Some(cats),
                    Err(e) => this.error = Some(e),
                }
                cx.notify();
            });
        })
        .detach();
    }

    fn clear_all(&mut self, cx: &mut Context<Self>) {
        crate::vocabulary::clear();
        self.categories = None;
        self.error = None;
        cx.notify();
    }
}

impl Render for VocabularyPage {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let summary = crate::vocabulary::summary();
        let has_words = summary.total_words > 0;
        let error = self.error.clone();
        let categories = self.categories.clone();

        div()
            .w_full()
            .min_w_0()
            .flex()
            .flex_col()
            .items_center()
            .gap_4()
            .child(page_header("Vocabulary"))
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
                            .flex_wrap()
                            .gap_4()
                            .child(stat_card("Words Searched", summary.total_words as u64))
                            .child(stat_card("Total Lookups", summary.total_lookups)),
                    )
                    .child(
                        div()
                            .rounded_xl()
                            .min_w_0()
                            .border_1()
                            .border_color(ui::BORDER)
                            .bg(hsla(0.0, 0.0, 1.0, 0.05))
                            .p_6()
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
                                            .text_lg()
                                            .font_weight(FontWeight::SEMIBOLD)
                                            .text_color(TEXT_PRIMARY)
                                            .child("Most Searched Words"),
                                    )
                                    .child(
                                        Button::new("clear-vocab")
                                            .label("Clear All")
                                            .ghost()
                                            .small()
                                            .disabled(!has_words)
                                            .on_click({
                                                let this = cx.weak_entity();
                                                move |_ev, _window, cx| {
                                                    if let Some(view) = this.upgrade() {
                                                        view.update(cx, |v, cx| {
                                                            v.clear_all(cx);
                                                        });
                                                    }
                                                }
                                            }),
                                    ),
                            )
                            .when(!has_words, |d| {
                                d.child(
                                    div()
                                        .p_6()
                                        .rounded_lg()
                                        .bg(ui::SURFACE)
                                        .border_1()
                                        .border_color(ui::BORDER)
                                        .text_center()
                                        .text_sm()
                                        .text_color(TEXT_DIM)
                                        .child("No words recorded yet. Use !d word in chat."),
                                )
                            })
                            .when(has_words, |d| {
                                d.child(
                                    div()
                                        .flex()
                                        .flex_col()
                                        .gap_2p5()
                                        .children(summary.top_words.iter().enumerate().map(
                                            |(i, tw)| {
                                                word_bar(
                                                    i + 1,
                                                    &tw.word,
                                                    tw.count,
                                                    summary.top_words[0].count,
                                                    &tw.source_forms,
                                                )
                                            },
                                        )),
                                )
                            }),
                    )
                    .when(!summary.ambiguous.is_empty(), |d| {
                        d.child(
                            div()
                                .rounded_xl()
                                .min_w_0()
                                .border_1()
                                .border_color(ui::BORDER)
                                .bg(hsla(0.0, 0.0, 1.0, 0.05))
                                .p_6()
                                .flex()
                                .flex_col()
                                .gap_3()
                                .child(
                                    div()
                                        .text_lg()
                                        .font_weight(FontWeight::SEMIBOLD)
                                        .text_color(TEXT_PRIMARY)
                                        .child("Ambiguous Words"),
                                )
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(TEXT_DIM)
                                        .child(
                                            "These words could be inflections of multiple base forms:",
                                        ),
                                )
                                .children(summary.ambiguous.iter().map(|a| {
                                    div()
                                        .flex()
                                        .flex_wrap()
                                        .items_center()
                                        .gap_2()
                                        .child(
                                            div()
                                                .text_sm()
                                                .font_weight(FontWeight::MEDIUM)
                                                .text_color(TEXT_PRIMARY)
                                                .child(a.word.clone()),
                                        )
                                        .child(
                                            div()
                                                .text_xs()
                                                .text_color(TEXT_DIM)
                                                .child("→"),
                                        )
                                        .child(
                                            div()
                                                .text_xs()
                                                .text_color(PURPLE)
                                                .child(a.candidates.join(" / ")),
                                        )
                                        .child(
                                            div()
                                                .text_xs()
                                                .text_color(TEXT_DIM)
                                                .child(format!("(x{})", a.count)),
                                        )
                                })),
                        )
                    })
                    .child(
                        div()
                            .rounded_xl()
                            .min_w_0()
                            .border_1()
                            .border_color(ui::BORDER)
                            .bg(hsla(0.0, 0.0, 1.0, 0.05))
                            .p_6()
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
                                            .text_lg()
                                            .font_weight(FontWeight::SEMIBOLD)
                                            .text_color(TEXT_PRIMARY)
                                            .child("Category Analysis"),
                                    )
                                    .child(
                                        Button::new("analyze-categories")
                                            .label(if self.analyzing {
                                                "Analyzing..."
                                            } else {
                                                "Analyze Categories"
                                            })
                                            .primary()
                                            .disabled(self.analyzing || !has_words)
                                            .on_click({
                                                let this = cx.weak_entity();
                                                move |_ev, _window, cx| {
                                                    if let Some(view) = this.upgrade() {
                                                        view.update(cx, |v, cx| {
                                                            v.analyze(cx);
                                                        });
                                                    }
                                                }
                                            }),
                                    ),
                            )
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(TEXT_DIM)
                                    .child(
                                        "Classifies your most searched words (top 30) into categories using the Gemini API.",
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
                            .when(categories.is_some(), |d| {
                                let cats = categories.unwrap();
                                let max_count = cats.iter().map(|c| c.total_count).max().unwrap_or(1);
                                d.child(
                                    div()
                                        .flex()
                                        .flex_col()
                                        .gap_3()
                                        .children(cats.iter().map(|c| {
                                            div()
                                                .flex()
                                                .flex_col()
                                                .gap_1()
                                                .child(
                                                    div()
                                                        .flex()
                                                        .items_center()
                                                        .gap_2()
                                                        .child(
                                                            div()
                                                                .w(px(96.0))
                                                                .text_sm()
                                                                .font_weight(FontWeight::MEDIUM)
                                                                .text_color(TEXT_PRIMARY)
                                                                .child(c.category.clone()),
                                                        )
                                                        .child(
                                                            div()
                                                                .flex_1()
                                                                .min_w_0()
                                                                .h_2p5()
                                                                .rounded_full()
                                                                .bg(ui::SURFACE)
                                                                .child(
                                                                    div()
                                                                        .h_full()
                                                                        .rounded_full()
                                                                        .bg(PURPLE)
                                                                        .w(DefiniteLength::Fraction(
                                                                            (c.total_count as f32 / max_count as f32).clamp(0.0, 1.0),
                                                                        )),
                                                                ),
                                                        )
                                                        .child(
                                                            div()
                                                                .w(px(48.0))
                                                                .text_xs()
                                                                .text_right()
                                                                .text_color(TEXT_DIM)
                                                                .child(c.total_count.to_string()),
                                                        ),
                                                )
                                                .child(
                                                    div()
                                                        .pl(px(112.0))
                                                        .text_xs()
                                                        .text_color(TEXT_DIM)
                                                        .child(c.words.join(", ")),
                                                )
                                        })),
                                )
                            }),
                    ),
            )
    }
}

fn stat_card(label: impl Into<SharedString>, value: u64) -> impl IntoElement {
    div()
        .flex_1()
        .min_w_0()
        .rounded_xl()
        .bg(hsla(0.0, 0.0, 1.0, 0.05))
        .border_1()
        .border_color(ui::BORDER)
        .p_4()
        .flex()
        .flex_col()
        .gap_1()
        .child(div().text_xs().text_color(TEXT_MUTED).child(label.into()))
        .child(
            div()
                .text_2xl()
                .font_weight(FontWeight::BOLD)
                .text_color(TEXT_PRIMARY)
                .child(value.to_string()),
        )
}

fn word_bar(
    rank: usize,
    word: &str,
    count: u64,
    max_count: u64,
    source_forms: &[(String, u64)],
) -> impl IntoElement {
    let ratio = if max_count > 0 {
        count as f32 / max_count as f32
    } else {
        0.0
    };
    let sources = source_forms
        .iter()
        .map(|(f, c)| format!("{}({})", f, c))
        .collect::<Vec<_>>()
        .join(", ");

    div()
        .flex()
        .flex_col()
        .gap_0p5()
        .child(
            div()
                .flex()
                .items_center()
                .gap_2()
                .child(
                    div()
                        .w(px(24.0))
                        .text_xs()
                        .text_color(TEXT_DIM)
                        .child(rank.to_string()),
                )
                .child(
                    div()
                        .w(px(144.0))
                        .min_w_0()
                        .text_sm()
                        .text_color(TEXT_PRIMARY)
                        .truncate()
                        .child(word.to_string()),
                )
                .child(
                    div()
                        .flex_1()
                        .min_w_0()
                        .h_2()
                        .rounded_full()
                        .bg(ui::SURFACE)
                        .child(
                            div()
                                .h_full()
                                .rounded_full()
                                .bg(PURPLE)
                                .w(DefiniteLength::Fraction(ratio.clamp(0.0, 1.0))),
                        ),
                )
                .child(
                    div()
                        .w(px(40.0))
                        .text_xs()
                        .text_right()
                        .text_color(TEXT_DIM)
                        .child(count.to_string()),
                ),
        )
        .when(!sources.is_empty(), |d| {
            d.child(
                div()
                    .pl(px(176.0))
                    .text_xs()
                    .text_color(TEXT_DIM)
                    .child(SharedString::from(format!("← {}", sources))),
            )
        })
}
