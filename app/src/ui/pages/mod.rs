pub mod config;
pub mod credits;
pub mod dashboard;
pub mod log;
pub mod model_test;
pub mod vocabulary;

use gpui::{
    div, hsla, prelude::*, px, AnyElement, App, Context, Entity, FontWeight, IntoElement,
    ParentElement, Render, SharedString, Styled, Window,
};
use gpui_component::button::ButtonVariants;

use crate::ui::{self, btn_primary, AppModel, Page, PURPLE, PURPLE_DIM, TEXT_PRIMARY};

pub const SIDEBAR_WIDTH: f32 = 224.0;

// ── Shell (sidebar + page content) ──────────────────────────────────────────

pub struct ShellView {
    model: Entity<AppModel>,
    dashboard: Entity<dashboard::DashboardPage>,
    model_test: Entity<model_test::ModelTestPage>,
    config: Entity<config::ConfigPage>,
    vocabulary: Entity<vocabulary::VocabularyPage>,
    log: Entity<log::LogPage>,
    credits: Entity<credits::CreditsPage>,
}

impl ShellView {
    pub fn new(model: Entity<AppModel>, window: &mut Window, cx: &mut Context<Self>) -> Self {
        cx.observe(&model, |_, _, cx| cx.notify()).detach();
        ShellView {
            dashboard: cx.new(|cx| dashboard::DashboardPage::new(model.clone(), cx)),
            model_test: cx.new(|cx| model_test::ModelTestPage::new(model.clone(), window, cx)),
            config: cx.new(|cx| config::ConfigPage::new(model.clone(), window, cx)),
            vocabulary: cx.new(|cx| vocabulary::VocabularyPage::new(model.clone(), cx)),
            log: cx.new(|cx| log::LogPage::new(model.clone(), cx)),
            credits: cx.new(|cx| credits::CreditsPage::new(model.clone(), cx)),
            model,
        }
    }
}

impl Render for ShellView {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let model = self.model.clone();
        let page = self.model.read(cx).page;
        let username = self.model.read(cx).username.clone();
        let status = self.model.read(cx).status.clone();

        let page_element: AnyElement = match page {
            Page::Dashboard => self.dashboard.clone().into_any_element(),
            Page::ModelTest => self.model_test.clone().into_any_element(),
            Page::Config => self.config.clone().into_any_element(),
            Page::Vocabulary => self.vocabulary.clone().into_any_element(),
            Page::Log => self.log.clone().into_any_element(),
            Page::Credits => self.credits.clone().into_any_element(),
        };

        div()
            .size_full()
            .flex()
            .flex_row()
            .bg(hsla(0.0, 0.0, 0.06, 1.0))
            .child(sidebar(model.clone(), page, username, &status, cx))
            .child(
                div()
                    .flex_1()
                    .min_w_0()
                    .h_full()
                    .flex()
                    .flex_col()
                    .child(toast_banner(&model, cx))
                    .child(
                        div()
                            .id("content-scroll")
                            .flex_1()
                            .min_w_0()
                            .overflow_scroll()
                            .scrollbar_width(px(10.0))
                            .p_4()
                            .child(page_element),
                    ),
            )
    }
}

fn sidebar(
    model: Entity<AppModel>,
    active: Page,
    username: Option<String>,
    status: &ui::ChatStatus,
    _cx: &mut Context<ShellView>,
) -> impl IntoElement {
    let is_running = status.is_running;
    let is_reconnecting = status.reconnecting;
    let nav_items: [(Page, &'static str); 6] = [
        (Page::Dashboard, "Dashboard"),
        (Page::ModelTest, "Model Test"),
        (Page::Config, "Config"),
        (Page::Vocabulary, "Vocabulary"),
        (Page::Log, "Log"),
        (Page::Credits, "Credits"),
    ];

    div()
        .w_56()
        .flex_shrink_0()
        .h_full()
        .flex()
        .flex_col()
        .border_r_1()
        .border_color(ui::BORDER)
        .bg(hsla(0.0, 0.0, 0.0, 0.2))
        .child(
            div()
                .h(px(56.0))
                .flex_shrink_0()
                .flex()
                .items_center()
                .gap_2()
                .px_4()
                .border_b_1()
                .border_color(ui::BORDER)
                .child(
                    div()
                        .size_6()
                        .rounded_full()
                        .bg(gpui::linear_gradient(
                            0.0,
                            gpui::linear_color_stop(PURPLE_DIM, 0.0),
                            gpui::linear_color_stop(PURPLE, 1.0),
                        ))
                        .flex()
                        .items_center()
                        .justify_center()
                        .text_xs()
                        .text_color(gpui::white())
                        .font_weight(FontWeight::BOLD)
                        .child("S"),
                )
                .child(
                    div()
                        .text_sm()
                        .font_weight(FontWeight::BOLD)
                        .text_color(PURPLE_DIM)
                        .child("Streaid"),
                ),
        )
        .child(
            div()
                .flex_1()
                .p_3()
                .flex()
                .flex_col()
                .gap_1()
                .children(nav_items.into_iter().map(|(p, label)| {
                    let is_active = p == active;
                    div()
                        .id(label)
                        .px_3()
                        .py_2()
                        .rounded_lg()
                        .text_sm()
                        .font_weight(FontWeight::MEDIUM)
                        .cursor_pointer()
                        .when(is_active, |d| {
                            d.bg(hsla(0.0, 0.0, 1.0, 0.1)).text_color(gpui::white())
                        })
                        .when(!is_active, |d| {
                            d.text_color(ui::TEXT_DIM).hover(|s| {
                                s.bg(hsla(0.0, 0.0, 1.0, 0.05)).text_color(gpui::white())
                            })
                        })
                        .on_click({
                            let model = model.clone();
                            move |_ev, window, cx| {
                                let _ = window;
                                model.update(cx, |m, cx| {
                                    m.page = p;
                                    cx.notify();
                                });
                            }
                        })
                        .child(label)
                })),
        )
        .child(
            div()
                .p_3()
                .border_t_1()
                .border_color(ui::BORDER)
                .flex()
                .flex_col()
                .gap_3()
                .child(
                    div()
                        .flex()
                        .items_center()
                        .gap_2()
                        .px_1()
                        .child(
                            div()
                                .size_7()
                                .rounded_full()
                                .flex_shrink_0()
                                .bg(gpui::linear_gradient(
                                    45.0,
                                    gpui::linear_color_stop(PURPLE_DIM, 0.0),
                                    gpui::linear_color_stop(ui::PURPLE_DARK, 1.0),
                                ))
                                .flex()
                                .items_center()
                                .justify_center()
                                .text_xs()
                                .text_color(gpui::white())
                                .font_weight(FontWeight::BOLD)
                                .child(
                                    username
                                        .as_deref()
                                        .and_then(|u| u.chars().next())
                                        .map(|c| c.to_uppercase().to_string())
                                        .unwrap_or_else(|| "?".to_string()),
                                ),
                        )
                        .child(
                            div()
                                .text_sm()
                                .text_color(hsla(0.0, 0.0, 0.83, 1.0))
                                .truncate()
                                .child(username.unwrap_or_else(|| "Unknown User".into())),
                        ),
                )
                .child(
                    btn_primary(if is_reconnecting {
                        "● Reconnecting…"
                    } else if is_running {
                        "● Stop"
                    } else {
                        "Start Listening"
                    })
                    .on_click({
                        let model = model.clone();
                        move |_ev, _window, cx| {
                            if is_running {
                                let _ = crate::stop_chat_listener();
                                model.update(cx, |m, cx| {
                                    m.toast = None;
                                    cx.notify();
                                });
                            } else {
                                start_listener(&model, None, cx);
                            }
                        }
                    }),
                )
                .child(
                    gpui_component::button::Button::new("logout")
                        .label("Logout")
                        .ghost()
                        .on_click({
                            let model = model.clone();
                            move |_ev, _window, cx| {
                                let _ = crate::auth::clear_stored_token();
                                model.update(cx, |m, cx| {
                                    m.logged_in = false;
                                    m.username = None;
                                    m.toast = None;
                                    cx.notify();
                                });
                            }
                        }),
                ),
        )
}

/// Toast banner shown at the top of the content area (errors from async ops).
fn toast_banner(model: &Entity<AppModel>, cx: &mut Context<ShellView>) -> AnyElement {
    let Some(msg) = model.read(cx).toast.clone() else {
        return div().into_any_element();
    };
    div()
        .w_full()
        .min_w_0()
        .px_6()
        .pt_3()
        .child(
            div()
                .p_3()
                .rounded_xl()
                .bg(hsla(0.0, 0.75, 0.71, 0.1))
                .border_1()
                .border_color(hsla(0.0, 0.75, 0.71, 0.2))
                .flex()
                .items_center()
                .justify_between()
                .gap_2()
                .child(
                    div()
                        .text_xs()
                        .text_color(ui::RED)
                        .child(SharedString::from(msg)),
                )
                .child(
                    div()
                        .id("toast-dismiss")
                        .text_xs()
                        .text_color(ui::TEXT_DIM)
                        .cursor_pointer()
                        .hover(|s| s.text_color(gpui::white()))
                        .on_click({
                            let model = model.clone();
                            move |_ev, _window, cx| {
                                model.update(cx, |m, cx| {
                                    m.toast = None;
                                    cx.notify();
                                });
                            }
                        })
                        .child("✕"),
                ),
        )
        .into_any_element()
}

/// Start the chat listener in the background, surfacing errors as a toast.
pub fn start_listener(model: &Entity<AppModel>, target_channel: Option<String>, cx: &mut App) {
    let weak = model.downgrade();
    cx.spawn(
        async move |cx| match crate::start_chat_listener(target_channel).await {
            Ok(()) => {
                let _ = weak.update(cx, |m, cx| {
                    m.toast = None;
                    cx.notify();
                });
            }
            Err(e) => {
                let _ = weak.update(cx, |m, cx| {
                    m.toast = Some(e);
                    cx.notify();
                });
            }
        },
    )
    .detach();
}

// ── Shared page widgets ─────────────────────────────────────────────────────

pub fn page_header(title: impl Into<SharedString>) -> impl IntoElement {
    let title: SharedString = title.into();
    div()
        .mb_4()
        .child(
            div()
                .text_xl()
                .font_weight(FontWeight::SEMIBOLD)
                .text_color(TEXT_PRIMARY)
                .child(title.clone()),
        )
        .child(div().mt_2().h_px().bg(ui::BORDER))
}

pub fn section_title(title: impl Into<SharedString>) -> impl IntoElement {
    div()
        .text_lg()
        .font_weight(FontWeight::SEMIBOLD)
        .text_color(TEXT_PRIMARY)
        .child(title.into())
}

pub fn section_wrapper(children: impl IntoElement) -> impl IntoElement {
    div()
        .rounded_xl()
        .border_1()
        .border_color(ui::BORDER)
        .bg(hsla(0.0, 0.0, 1.0, 0.05))
        .p_4()
        .child(children)
}

pub fn divider() -> impl IntoElement {
    div().h_px().w_full().bg(ui::BORDER)
}

/// Small status pill with a colored dot label.
pub fn pill(text: impl Into<SharedString>, fg: gpui::Hsla, bg: gpui::Hsla) -> impl IntoElement {
    div()
        .px_3()
        .py_1()
        .rounded_full()
        .bg(bg)
        .text_color(fg)
        .text_xs()
        .font_weight(FontWeight::MEDIUM)
        .child(text.into())
}

/// Format an RFC3339 timestamp as local HH:MM:SS.
pub fn format_time(timestamp: &str) -> String {
    chrono::DateTime::parse_from_rfc3339(timestamp)
        .map(|dt| {
            dt.with_timezone(&chrono::Local)
                .format("%H:%M:%S")
                .to_string()
        })
        .unwrap_or_else(|_| String::new())
}
