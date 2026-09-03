use std::time::Duration;

use gpui::{
    div, hsla, prelude::*, px, App, Context, Entity, FontWeight, IntoElement, Render, SharedString,
    Styled, Window,
};
use gpui_component::button::ButtonVariants;
use gpui_component::input::{Input, InputState};
use gpui_component::Disableable;
use twitch_oauth2::Scope;

use crate::ui::{self, AppModel, PURPLE, PURPLE_DIM, TEXT_DIM};

pub struct LoginView {
    model: Entity<AppModel>,
    client_id_input: Entity<InputState>,
    loading: bool,
    error: Option<String>,
}

impl LoginView {
    pub fn new(model: Entity<AppModel>, window: &mut Window, cx: &mut Context<Self>) -> Self {
        let client_id_input = cx
            .new(|cx| InputState::new(window, cx).placeholder("Get from Twitch Developer Console"));
        if let Some(id) = model.read(cx).client_id.clone() {
            client_id_input.update(cx, |s, cx| s.set_value(id, window, cx));
        }
        LoginView {
            model,
            client_id_input,
            loading: false,
            error: None,
        }
    }

    fn save_client_id(&self, cx: &mut Context<Self>) {
        let id = self.client_id_input.read(cx).value().to_string();
        if id.is_empty() {
            return;
        }
        match crate::auth::save_client_id(&id) {
            Ok(()) => {
                self.model.update(cx, |m, cx| {
                    m.client_id = Some(id.clone());
                    m.toast = Some("Client ID saved".to_string());
                    cx.notify();
                });
            }
            Err(e) => {
                self.model.update(cx, |m, cx| {
                    m.toast = Some(format!("Failed to save Client ID: {}", e));
                    cx.notify();
                });
            }
        }
    }

    fn authenticate(&mut self, cx: &mut Context<Self>) {
        if self.loading {
            return;
        }
        let client_id = self.client_id_input.read(cx).value().to_string();
        if client_id.is_empty() {
            return;
        }
        self.loading = true;
        cx.notify();

        let state = crate::auth::shared_state();
        let weak = cx.weak_entity();
        let model_weak = self.model.downgrade();
        cx.spawn(async move |_, cx| {
            match crate::auth::start_device_flow(
                state.clone(),
                &client_id,
                vec![Scope::ChatRead, Scope::ChatEdit],
            )
            .await
            {
                Ok(info) => {
                    eprintln!("Device flow started: {}", info.verification_uri);
                    let _ = open::that(info.verification_uri.clone());
                    // Poll until the user authorizes (60 attempts x 3s = 3 min)
                    for _ in 0..60 {
                        tokio::time::sleep(Duration::from_secs(3)).await;
                        match crate::auth::poll_device_flow(state.clone()).await {
                            Ok(Some(_token)) => {
                                let _ = model_weak.update(&mut *cx, |m, cx| {
                                    m.logged_in = true;
                                    m.username =
                                        crate::auth::get_stored_token(&crate::auth::shared_state())
                                            .ok()
                                            .flatten()
                                            .and_then(|t| t.login);
                                    m.toast = None;
                                    m.refresh_sounds();
                                    cx.notify();
                                });
                                let _ = weak.update(&mut *cx, |v, cx| {
                                    v.loading = false;
                                    cx.notify();
                                });
                                return;
                            }
                            Ok(None) => continue,
                            Err(e) => {
                                let _ = weak.update(&mut *cx, |v, cx| {
                                    v.error = Some(format!("Polling failed: {}", e));
                                    v.loading = false;
                                    cx.notify();
                                });
                                return;
                            }
                        }
                    }
                    let _ = weak.update(&mut *cx, |v, cx| {
                        v.error = Some("Authentication timed out. Please try again.".to_string());
                        v.loading = false;
                        cx.notify();
                    });
                }
                Err(e) => {
                    let _ = weak.update(&mut *cx, |v, cx| {
                        v.error = Some(format!("Failed to start device flow: {}", e));
                        v.loading = false;
                        cx.notify();
                    });
                }
            }
        })
        .detach();
    }
}

impl Render for LoginView {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let client_id_empty = self.client_id_input.read(cx).value().is_empty();
        let error = self.error.clone();

        div()
            .size_full()
            .flex()
            .items_center()
            .justify_center()
            .p_6()
            .child(
                div()
                    .w_full()
                    .max_w(px(420.0))
                    .p_8()
                    .rounded_lg()
                    .border_1()
                    .border_color(hsla(0.755, 1.0, 0.63, 0.3))
                    .bg(hsla(0.0, 0.0, 0.1, 0.8))
                    .shadow_lg()
                    .flex()
                    .flex_col()
                    .items_center()
                    .gap_2()
                    .child(
                        div()
                            .size_20()
                            .rounded_full()
                            .bg(gpui::linear_gradient(
                                135.0,
                                gpui::linear_color_stop(PURPLE_DIM, 0.0),
                                gpui::linear_color_stop(PURPLE, 1.0),
                            ))
                            .shadow_lg()
                            .flex()
                            .items_center()
                            .justify_center()
                            .text_3xl()
                            .font_weight(FontWeight::BOLD)
                            .text_color(gpui::white())
                            .child("S"),
                    )
                    .child(
                        div()
                            .text_3xl()
                            .font_weight(FontWeight::BOLD)
                            .text_color(PURPLE_DIM)
                            .child("Streaid"),
                    )
                    .child(
                        div()
                            .text_sm()
                            .text_color(TEXT_DIM)
                            .child("This app is aiding your streaming. (Strea(m) + aid)"),
                    )
                    .child(div().h_4())
                    .child(
                        div()
                            .w_full()
                            .flex()
                            .flex_col()
                            .gap_2()
                            .child(
                                div()
                                    .text_sm()
                                    .font_weight(FontWeight::MEDIUM)
                                    .text_color(ui::TEXT_MUTED)
                                    .child("Client ID"),
                            )
                            .child(Input::new(&self.client_id_input).h(px(44.0))),
                    )
                    .when(error.is_some(), |d| {
                        d.child(
                            div()
                                .w_full()
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
                    .child(
                        div()
                            .w_full()
                            .flex()
                            .gap_3()
                            .child(
                                gpui_component::button::Button::new("save-client-id")
                                    .label("Save Client ID")
                                    .ghost()
                                    .flex_1()
                                    .on_click({
                                        let this = cx.weak_entity();
                                        move |_ev, _window, cx| {
                                            if let Some(view) = this.upgrade() {
                                                view.update(cx, |v, cx| {
                                                    v.save_client_id(cx);
                                                });
                                            }
                                        }
                                    }),
                            )
                            .child(
                                gpui_component::button::Button::new("auth-twitch")
                                    .label(if self.loading {
                                        "Waiting for authentication..."
                                    } else {
                                        "Authenticate with Twitch"
                                    })
                                    .primary()
                                    .flex_1()
                                    .disabled(self.loading || client_id_empty)
                                    .on_click({
                                        let this = cx.weak_entity();
                                        move |_ev, _window, cx| {
                                            if let Some(view) = this.upgrade() {
                                                view.update(cx, |v, cx| {
                                                    v.authenticate(cx);
                                                });
                                            }
                                        }
                                    }),
                            ),
                    )
                    .child(
                        div()
                            .mt_4()
                            .text_xs()
                            .text_color(ui::TEXT_DIM)
                            .text_center()
                            .child("By authenticating, you agree to Twitch's ")
                            .child(
                                div()
                                    .id("tos-link")
                                    .text_color(PURPLE)
                                    .cursor_pointer()
                                    .hover(|s| s.text_color(hsla(0.72, 1.0, 0.72, 1.0)))
                                    .on_click(
                                        |_ev: &gpui::ClickEvent,
                                         _window: &mut Window,
                                         _cx: &mut App| {
                                            let _ = open::that(
                                                "https://www.twitch.tv/p/legal/terms-of-service",
                                            );
                                        },
                                    )
                                    .child("Terms of Service"),
                            ),
                    ),
            )
    }
}
