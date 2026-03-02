use axum::{
    response::{
        sse::{Event, KeepAlive, Sse},
        Html,
    },
    routing::get,
    Router,
};
use once_cell::sync::Lazy;
use serde::Serialize;
use std::convert::Infallible;
use tokio::sync::broadcast;
use tokio_stream::{wrappers::BroadcastStream, StreamExt};

#[derive(Clone, Serialize)]
pub struct OverlayMessage {
    pub event_type: String,
    pub data: serde_json::Value,
}

pub static OVERLAY_TX: Lazy<broadcast::Sender<OverlayMessage>> =
    Lazy::new(|| broadcast::channel(64).0);

const OVERLAY_HTML: &str = include_str!("overlay.html");

pub async fn start_overlay_server(port: u16, tx: broadcast::Sender<OverlayMessage>) {
    let app = Router::new()
        .route("/", get(serve_html))
        .route("/events", get(move || sse_handler(tx.subscribe())));

    let addr = format!("127.0.0.1:{}", port);
    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("Overlay server failed to bind on {}: {}", addr, e);
            return;
        }
    };
    eprintln!("Overlay server listening on http://{}", addr);
    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("Overlay server error: {}", e);
    }
}

async fn serve_html() -> Html<&'static str> {
    Html(OVERLAY_HTML)
}

async fn sse_handler(
    rx: broadcast::Receiver<OverlayMessage>,
) -> Sse<impl futures_util::Stream<Item = Result<Event, Infallible>>> {
    let stream = BroadcastStream::new(rx).filter_map(|msg| {
        let msg = msg.ok()?;
        let data = serde_json::to_string(&msg.data).ok()?;
        Some(Ok(Event::default().event(msg.event_type).data(data)))
    });

    Sse::new(stream).keep_alive(KeepAlive::default())
}
