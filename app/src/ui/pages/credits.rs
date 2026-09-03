use gpui::{
    div, hsla, prelude::*, px, Context, Entity, FontWeight, IntoElement, Render, SharedString,
    Styled, Window,
};

use crate::ui::{self, AppModel, TEXT_DIM, TEXT_MUTED, TEXT_PRIMARY};

struct CreditItem {
    name: &'static str,
    role: &'static str,
    license: &'static str,
    url: &'static str,
}

const MODELS: [CreditItem; 3] = [
    CreditItem {
        name: "Bonsai (Ternary) by Prism ML",
        role: "Local on-device LLM (8B / 4B)",
        license: "Apache-2.0",
        url: "https://prismml.com",
    },
    CreditItem {
        name: "MLX / mlx-lm (Apple)",
        role: "Local inference runtime",
        license: "MIT",
        url: "https://github.com/ml-explore/mlx-lm",
    },
    CreditItem {
        name: "Gemini 3.1 Flash Lite (Google)",
        role: "Cloud translation API",
        license: "Google AI terms of service",
        url: "https://ai.google.dev/gemini-api",
    },
];

const FRONTEND: [CreditItem; 5] = [
    CreditItem {
        name: "gpui (Zed)",
        role: "Native UI framework",
        license: "Apache-2.0",
        url: "https://github.com/zed-industries/zed",
    },
    CreditItem {
        name: "gpui-component (Longbridge)",
        role: "UI components",
        license: "Apache-2.0",
        url: "https://github.com/longbridge/gpui-component",
    },
    CreditItem {
        name: "rodio",
        role: "Audio playback",
        license: "MIT",
        url: "https://github.com/RustAudio/rodio",
    },
    CreditItem {
        name: "Open (Rust)",
        role: "Open URLs in browser",
        license: "MIT",
        url: "https://github.com/Byron/open-rs",
    },
    CreditItem {
        name: "dirs",
        role: "App data directories",
        license: "MIT / Apache-2.0",
        url: "https://github.com/dirs-dev/dirs-rs",
    },
];

const BACKEND: [CreditItem; 7] = [
    CreditItem {
        name: "tokio / tokio-tungstenite",
        role: "Async runtime / Twitch IRC",
        license: "MIT",
        url: "https://tokio.rs",
    },
    CreditItem {
        name: "reqwest",
        role: "HTTP client (Gemini API)",
        license: "MIT / Apache-2.0",
        url: "https://github.com/seanmonstar/reqwest",
    },
    CreditItem {
        name: "axum",
        role: "OBS overlay server",
        license: "MIT",
        url: "https://github.com/tokio-rs/axum",
    },
    CreditItem {
        name: "serde / serde_json",
        role: "Serialization",
        license: "MIT / Apache-2.0",
        url: "https://serde.rs",
    },
    CreditItem {
        name: "keyring",
        role: "OS keychain storage",
        license: "MIT / Apache-2.0",
        url: "https://github.com/hwchen/keyring-rs",
    },
    CreditItem {
        name: "twitch_api / twitch_oauth2",
        role: "Twitch API / OAuth",
        license: "MIT / Apache-2.0",
        url: "https://github.com/Emilgardis/twitch_api",
    },
    CreditItem {
        name: "chrono",
        role: "Timestamps",
        license: "MIT / Apache-2.0",
        url: "https://github.com/chronotope/chrono",
    },
];

pub struct CreditsPage {
    _model: Entity<AppModel>,
}

impl CreditsPage {
    pub fn new(model: Entity<AppModel>, cx: &mut Context<Self>) -> Self {
        cx.observe(&model, |_, _, cx| cx.notify()).detach();
        CreditsPage { _model: model }
    }
}

impl Render for CreditsPage {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .w_full()
            .min_w_0()
            .flex()
            .flex_col()
            .items_center()
            .gap_4()
            .child(super::page_header("Credits"))
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
                    .gap_6()
                    .child(
                        div()
                            .child(
                                div()
                                    .text_sm()
                                    .font_weight(FontWeight::SEMIBOLD)
                                    .text_color(TEXT_PRIMARY)
                                    .child("Streaid"),
                            )
                            .child(
                                div()
                                    .text_sm()
                                    .text_color(TEXT_DIM)
                                    .child(
                                        "Version 0.6.0 — Native GPUI desktop app for Twitch chat translation and dictionary lookup.",
                                    ),
                            )
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(TEXT_MUTED)
                                    .child(
                                        "This app is aiding your streaming. (Strea(m) + aid)",
                                    ),
                            ),
                    )
                    .child(credit_section("AI Models & Providers", &MODELS))
                    .child(credit_section("Frontend Libraries", &FRONTEND))
                    .child(credit_section("Backend Libraries (Rust)", &BACKEND))
                    .child(
                        div()
                            .text_xs()
                            .text_color(TEXT_DIM)

                            .child(
                                "All dependencies are permissively licensed (MIT / Apache-2.0 / BSD) and no copyleft (GPL/AGPL) libraries are used. The local Bonsai models are Apache-2.0 and are downloaded separately at runtime via `scripts/setup-bonsai.sh`. Cloud calls to the Gemini API are governed by Google's AI terms of service.",
                            ),
                    ),
            )
    }
}

fn credit_section(title: impl Into<SharedString>, items: &[CreditItem]) -> impl IntoElement {
    div()
        .child(
            div()
                .text_sm()
                .font_weight(FontWeight::SEMIBOLD)
                .text_color(TEXT_PRIMARY)
                .mb_3()
                .child(title.into()),
        )
        .child(
            div()
                .border_1()
                .border_color(hsla(0.0, 0.0, 1.0, 0.05))
                .rounded_lg()
                .overflow_hidden()
                .min_w_0()
                .children(items.iter().map(|item| {
                    div()
                        .flex()
                        .flex_wrap()
                        .min_w_0()
                        .items_center()
                        .justify_between()
                        .gap_4()
                        .px_4()
                        .py_3()
                        .bg(hsla(0.0, 0.0, 1.0, 0.05))
                        .child(
                            div()
                                .min_w_0()
                                .child(
                                    div()
                                        .id(item.name)
                                        .text_sm()
                                        .text_color(TEXT_PRIMARY)
                                        .cursor_pointer()
                                        .hover(|s| s.text_color(ui::PURPLE_HOVER))
                                        .on_click({
                                            let url = item.url;
                                            move |_ev, _window, _cx| {
                                                let _ = open::that(url);
                                            }
                                        })
                                        .child(item.name),
                                )
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(TEXT_DIM)
                                        .mt_0p5()
                                        .child(item.role),
                                ),
                        )
                        .child(
                            div()
                                .flex_shrink_0()
                                .whitespace_nowrap()
                                .px_2p5()
                                .py_1()
                                .rounded_full()
                                .bg(hsla(0.0, 0.0, 1.0, 0.05))
                                .border_1()
                                .border_color(ui::BORDER)
                                .text_xs()
                                .text_color(TEXT_DIM)
                                .child(item.license),
                        )
                })),
        )
}
