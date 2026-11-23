//! Platform capability detection.
//!
//! The core is UI-agnostic and mostly cross-platform. The few macOS-only
//! features (the MLX local-model sidecar) are detected here so frontends can
//! hide/disable them instead of surfacing runtime errors.

/// Operating system identifier (`macos`, `windows`, `linux`, ...).
pub const OS: &str = std::env::consts::OS;

/// Whether the bundled local model sidecar (MLX / llama-server) is available
/// on this platform. MLX only runs on Apple Silicon.
pub fn local_model_supported() -> bool {
    cfg!(target_os = "macos")
}

/// Human-readable platform label for diagnostics / about screens.
pub fn label() -> &'static str {
    match OS {
        "macos" => "macOS",
        "windows" => "Windows",
        "linux" => "Linux",
        other => other,
    }
}
