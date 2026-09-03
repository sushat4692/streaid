use gpui::{
    div, hsla, prelude::*, Context, Entity, FontWeight, IntoElement, Render, Styled, Window,
};

use crate::ui::{AppModel, PURPLE_DIM, TEXT_DIM};

pub struct DashboardPage {
    _model: Entity<AppModel>,
}

impl DashboardPage {
    pub fn new(model: Entity<AppModel>, cx: &mut Context<Self>) -> Self {
        cx.observe(&model, |_, _, cx| cx.notify()).detach();
        DashboardPage { _model: model }
    }
}

impl Render for DashboardPage {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .size_full()
            .flex()
            .items_center()
            .justify_center()
            .p_6()
            .child(
                div()
                    .p_12()
                    .text_center()
                    .rounded_lg()
                    .border_1()
                    .border_color(hsla(0.755, 1.0, 0.63, 0.3))
                    .bg(hsla(0.0, 0.0, 0.1, 0.8))
                    .shadow_lg()
                    .child(
                        div()
                            .text_3xl()
                            .font_weight(FontWeight::BOLD)
                            .text_color(PURPLE_DIM)
                            .mb_4()
                            .child("Welcome to Streaid"),
                    )
                    .child(
                        div()
                            .text_color(TEXT_DIM)
                            .child("This app is aiding your streaming. (Strea(m) + aid)"),
                    ),
            )
    }
}
