//! Built-in and user-defined chat commands.
//!
//! The IRC read loop queues messages here (serially). `!ts` / `!d` keep their
//! existing workers; `!dice` and custom commands are answered directly.

use crate::chat::IrcMessage;
use crate::store::{self, CommandAllow};
use std::time::{SystemTime, UNIX_EPOCH};

const RESERVED: &[&str] = &["ts", "d", "dice", "so", "stop"];

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CommandAction {
    Translate(String),
    Dictionary(String),
    /// Send this text to chat as-is.
    Reply(String),
}

/// Split `!command args...` into the command name and the remaining text.
fn command_token(message: &str) -> Option<(&str, &str)> {
    let rest = message.trim().strip_prefix('!')?;
    let mut parts = rest.splitn(2, char::is_whitespace);
    let name = parts.next()?;
    if name.is_empty() {
        return None;
    }
    Some((name, parts.next().unwrap_or("").trim()))
}

fn roll_dice() -> u32 {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.subsec_nanos())
        .unwrap_or(0);
    (nanos % 6) + 1
}

fn allowed(allow: &CommandAllow, message: &IrcMessage) -> bool {
    match allow {
        CommandAllow::Broadcaster => message.is_broadcaster,
        CommandAllow::Mod => message.is_broadcaster || message.is_mod,
        CommandAllow::Vip => message.is_broadcaster || message.is_mod || message.is_vip,
        CommandAllow::Everyone => true,
    }
}

/// Normalizes and validates a custom command name/body.
pub fn validate_custom(command: &str, body: &str) -> Result<String, String> {
    let name = command.trim().trim_start_matches('!').to_ascii_lowercase();
    if name.is_empty() {
        return Err("Command name is required.".to_string());
    }
    if name.chars().any(char::is_whitespace) {
        return Err("Command name cannot contain spaces.".to_string());
    }
    if RESERVED.contains(&name.as_str()) {
        return Err(format!("!{} is reserved.", name));
    }
    if body.trim().is_empty() {
        return Err("Command body is required.".to_string());
    }
    Ok(name)
}

/// Resolve a chat message to an action. Returns `None` for unknown commands,
/// missing permissions, or reserved commands that are not implemented yet.
pub fn resolve(message: &IrcMessage) -> Option<CommandAction> {
    let (name, args) = command_token(&message.message)?;
    let name = name.to_ascii_lowercase();

    match name.as_str() {
        "ts" => {
            if args.is_empty() {
                None
            } else {
                Some(CommandAction::Translate(args.to_string()))
            }
        }
        "d" => {
            let word = args.split_whitespace().next()?;
            Some(CommandAction::Dictionary(word.to_string()))
        }
        "dice" => Some(CommandAction::Reply(format!(
            "@{}: You rolled a {}",
            message.username,
            roll_dice()
        ))),
        // Implemented in a later sprint.
        "so" | "stop" => None,
        _ => {
            let command = store::list_commands()
                .into_iter()
                .find(|command| command.command.eq_ignore_ascii_case(&name))?;
            if !allowed(&command.allow, message) {
                return None;
            }
            let body = command.body.trim();
            if body.is_empty() {
                None
            } else {
                Some(CommandAction::Reply(body.to_string()))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn message(text: &str, broadcaster: bool, is_mod: bool, is_vip: bool) -> IrcMessage {
        IrcMessage {
            username: "alice".to_string(),
            display_name: "Alice".to_string(),
            user_id: Some("1".to_string()),
            color: None,
            badges: Vec::new(),
            is_mod,
            is_vip,
            is_broadcaster: broadcaster,
            is_subscriber: false,
            message: text.to_string(),
            channel: "chan".to_string(),
            timestamp: "2026-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn command_token_parses_name_and_args() {
        assert_eq!(command_token("!dice"), Some(("dice", "")));
        assert_eq!(
            command_token("!ts hello world"),
            Some(("ts", "hello world"))
        );
        assert_eq!(command_token("dice"), None);
        assert_eq!(command_token("!"), None);
    }

    #[test]
    fn validate_custom_rejects_reserved_and_empty() {
        assert_eq!(validate_custom("!hello", "hi").unwrap(), "hello");
        assert!(validate_custom("!ts", "hi").is_err());
        assert!(validate_custom("!dice", "hi").is_err());
        assert!(validate_custom("", "hi").is_err());
        assert!(validate_custom("hello world", "hi").is_err());
        assert!(validate_custom("hello", "").is_err());
    }

    #[test]
    fn permissions_are_hierarchical() {
        let everyone = message("", false, false, false);
        let vip = message("", false, false, true);
        let moderator = message("", false, true, false);
        let broadcaster = message("", true, false, false);

        assert!(allowed(&CommandAllow::Everyone, &everyone));
        assert!(!allowed(&CommandAllow::Vip, &everyone));
        assert!(allowed(&CommandAllow::Vip, &vip));
        assert!(allowed(&CommandAllow::Mod, &moderator));
        assert!(allowed(&CommandAllow::Mod, &broadcaster));
        assert!(allowed(&CommandAllow::Broadcaster, &broadcaster));
        assert!(!allowed(&CommandAllow::Broadcaster, &moderator));
    }

    #[test]
    fn resolve_handles_builtins() {
        let msg = message("!dice", false, false, false);
        match resolve(&msg) {
            Some(CommandAction::Reply(text)) => {
                assert!(text.starts_with("@alice: You rolled a "));
            }
            other => panic!("unexpected action: {:?}", other),
        }

        let translate = message("!ts hello", false, false, false);
        assert_eq!(
            resolve(&translate),
            Some(CommandAction::Translate("hello".to_string()))
        );

        let dictionary = message("!d apple pie", false, false, false);
        assert_eq!(
            resolve(&dictionary),
            Some(CommandAction::Dictionary("apple".to_string()))
        );

        assert_eq!(resolve(&message("!ts", false, false, false)), None);
        assert_eq!(resolve(&message("!unknown", false, false, false)), None);
    }

    #[test]
    fn dice_is_in_range() {
        for _ in 0..20 {
            let roll = roll_dice();
            assert!((1..=6).contains(&roll));
        }
    }
}
