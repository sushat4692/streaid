//! C ABI glue for the Streaid core.
//!
//! The ABI is deliberately tiny: callers ship JSON in and receive JSON out.
//! This keeps the boundary stable across SwiftUI and any future frontend
//! without generating bindings per language.
//!
//! Ownership rules:
//! - every `char *` returned here is allocated by Rust and must be released
//!   with [`streaid_free`].
//! - input pointers are borrowed for the duration of the call only.
//!
//! Threading rules:
//! - call `streaid_init()` once, on the main thread, before anything else.
//! - call `streaid_dispatch()` from a background thread/queue: async methods
//!   block until completion (e.g. `model.test`, `auth.poll_device_flow`).
//! - call `streaid_poll_events()` periodically (e.g. every 100 ms) from any
//!   thread; it never blocks.

mod api;

use std::ffi::{c_char, CStr, CString};
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::sync::Once;

static INIT: Once = Once::new();

/// Initialize the core (tokio runtime, overlay server, token refresh loop).
/// Must be called once from the main thread. Safe to call multiple times.
#[no_mangle]
pub extern "C" fn streaid_init() {
    INIT.call_once(streaid_core::init_runtime);
}

/// Handle a JSON-RPC-ish request and return a JSON response.
///
/// ```c
/// char *res = streaid_dispatch("{\"method\":\"chat.status\"}");
/// // use res...
/// streaid_free(res);
/// ```
///
/// The returned string is never NULL (unless allocation fails, which aborts).
///
/// # Safety
/// `request` must be NULL or a valid NUL-terminated UTF-8 string that stays
/// alive for the duration of the call.
#[no_mangle]
pub unsafe extern "C" fn streaid_dispatch(request: *const c_char) -> *mut c_char {
    let response = catch_unwind(AssertUnwindSafe(|| {
        if request.is_null() {
            return r#"{"ok":false,"error":"null request"}"#.to_string();
        }
        // SAFETY: the caller guarantees a valid NUL-terminated string.
        let request = CStr::from_ptr(request);
        match request.to_str() {
            Ok(request) => api::dispatch_json(request),
            Err(_) => r#"{"ok":false,"error":"request is not valid UTF-8"}"#.to_string(),
        }
    }))
    .unwrap_or_else(|_| r#"{"ok":false,"error":"panic in core"}"#.to_string());

    into_c_string(response)
}

/// Drain pending events. Returns `{"ok":true,"result":[...]}`.
#[no_mangle]
pub extern "C" fn streaid_poll_events() -> *mut c_char {
    let response = catch_unwind(api::poll_events_json)
        .unwrap_or_else(|_| r#"{"ok":false,"error":"panic in core"}"#.to_string());
    into_c_string(response)
}

/// Core version (from `Cargo.toml`).
#[no_mangle]
pub extern "C" fn streaid_version() -> *mut c_char {
    into_c_string(env!("CARGO_PKG_VERSION").to_string())
}

/// Release a string returned by this library.
///
/// # Safety
/// `ptr` must come from one of the functions above and must not be freed twice.
#[no_mangle]
pub unsafe extern "C" fn streaid_free(ptr: *mut c_char) {
    if !ptr.is_null() {
        drop(CString::from_raw(ptr));
    }
}

fn into_c_string(value: String) -> *mut c_char {
    // JSON output never contains interior NUL bytes, but stay defensive.
    CString::new(value)
        .unwrap_or_else(|_| CString::new(r#"{"ok":false,"error":"nul byte in response"}"#).unwrap())
        .into_raw()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn call(request: &str) -> String {
        let request = CString::new(request).unwrap();
        let response = unsafe { streaid_dispatch(request.as_ptr()) };
        let text = unsafe { CStr::from_ptr(response) }
            .to_str()
            .unwrap()
            .to_string();
        unsafe { streaid_free(response) };
        text
    }

    #[test]
    fn dispatch_roundtrip() {
        assert!(call(r#"{"method":"system.capabilities"}"#).contains("\"ok\":true"));
        assert!(call(r#"{"method":"nope"}"#).contains("\"ok\":false"));
    }

    #[test]
    fn version_is_exposed() {
        let version = streaid_version();
        let text = unsafe { CStr::from_ptr(version) }.to_str().unwrap();
        assert_eq!(text, env!("CARGO_PKG_VERSION"));
        unsafe { streaid_free(version) };
    }
}
