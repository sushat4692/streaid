use anyhow::{Context, Result};
use futures_util::{SinkExt, StreamExt};
use std::collections::HashMap;
use tokio::net::TcpStream;
use tokio_tungstenite::{connect_async, tungstenite::Message, MaybeTlsStream, WebSocketStream};

pub type WsStream = WebSocketStream<MaybeTlsStream<TcpStream>>;

/// Parsed Twitch IRC tags (`@key=value;...`).
#[derive(Debug, Clone, Default)]
pub struct IrcTags {
    values: HashMap<String, String>,
}

impl IrcTags {
    pub fn get(&self, key: &str) -> Option<&str> {
        self.values.get(key).map(String::as_str)
    }

    pub fn display_name(&self) -> Option<&str> {
        self.get("display-name").filter(|value| !value.is_empty())
    }

    pub fn badges(&self) -> Vec<String> {
        self.get("badges")
            .unwrap_or_default()
            .split(',')
            .filter(|badge| !badge.is_empty())
            .map(str::to_string)
            .collect()
    }

    pub fn has_badge(&self, name: &str) -> bool {
        self.badges()
            .iter()
            .any(|badge| badge.split('/').next() == Some(name))
    }

    pub fn is_broadcaster(&self) -> bool {
        self.has_badge("broadcaster")
    }

    pub fn is_mod(&self) -> bool {
        self.get("mod") == Some("1") || self.has_badge("moderator")
    }

    pub fn is_vip(&self) -> bool {
        self.get("vip") == Some("1") || self.has_badge("vip")
    }

    pub fn is_subscriber(&self) -> bool {
        self.get("subscriber") == Some("1") || self.has_badge("subscriber")
    }

    /// `tmi-sent-ts` (milliseconds) as RFC3339, or now if absent/invalid.
    pub fn timestamp_rfc3339(&self) -> String {
        self.get("tmi-sent-ts")
            .and_then(|value| value.parse::<i64>().ok())
            .and_then(chrono::DateTime::<chrono::Utc>::from_timestamp_millis)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_else(|| chrono::Utc::now().to_rfc3339())
    }
}

#[derive(Debug, Clone)]
pub struct IrcMessage {
    pub username: String,
    pub display_name: String,
    pub user_id: Option<String>,
    pub color: Option<String>,
    pub badges: Vec<String>,
    pub is_mod: bool,
    pub is_vip: bool,
    pub is_broadcaster: bool,
    pub is_subscriber: bool,
    pub message: String,
    pub channel: String,
    pub timestamp: String,
}

/// Twitch `USERNOTICE` with `msg-id=raid`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RaidNotice {
    pub channel: String,
    pub from_login: String,
    pub from_display_name: String,
    pub viewers: u64,
    pub timestamp: String,
}

/// Connect to Twitch IRC WebSocket and authenticate
pub async fn connect_to_irc(
    username: &str,       // Bot's username (for authentication)
    oauth_token: &str,    // Bot's OAuth token
    target_channel: &str, // Channel to join (may differ from username)
) -> Result<WsStream> {
    let url = "wss://irc-ws.chat.twitch.tv:443";
    eprintln!("Connecting to Twitch IRC: {}", url);

    let (ws_stream, _) = connect_async(url)
        .await
        .context("Failed to connect to Twitch IRC WebSocket")?;

    eprintln!("WebSocket connected, authenticating...");

    let (mut write, mut read) = ws_stream.split();

    // Ensure oauth token has correct format
    let oauth_token = if oauth_token.starts_with("oauth:") {
        oauth_token.to_string()
    } else {
        format!("oauth:{}", oauth_token)
    };

    // Send authentication commands in correct order per Twitch IRC spec
    // 1. CAP REQ - Request capabilities
    eprintln!("Step 1: Requesting capabilities...");
    write
        .send(Message::Text(
            "CAP REQ :twitch.tv/tags twitch.tv/commands".into(),
        ))
        .await
        .context("Failed to request capabilities")?;

    // 2. PASS - Send OAuth token
    eprintln!("Step 2: Sending PASS (OAuth token)...");
    write
        .send(Message::Text(format!("PASS {}", oauth_token).into()))
        .await
        .context("Failed to send PASS")?;

    // 3. NICK - Send username
    eprintln!("Step 3: Sending NICK: {}", username.to_lowercase());
    write
        .send(Message::Text(
            format!("NICK {}", username.to_lowercase()).into(),
        ))
        .await
        .context("Failed to send NICK")?;

    eprintln!("Sent authentication commands, waiting for server response...");

    // Wait for successful authentication (001 welcome message)
    let mut authenticated = false;
    let mut message_count = 0;
    while let Some(msg) = read.next().await {
        message_count += 1;
        if message_count > 30 {
            anyhow::bail!("Timeout waiting for authentication confirmation");
        }

        match msg {
            Ok(Message::Text(line)) => {
                eprintln!("IRC << {}", line);

                // Check for authentication failure
                if line.contains("Login authentication failed")
                    || line.contains("NOTICE * :Login unsuccessful")
                {
                    anyhow::bail!(
                        "Twitch IRC authentication failed. Please re-authenticate your account."
                    );
                }

                // Check for improperly formatted auth
                if line.contains("Improperly formatted auth") {
                    anyhow::bail!("IRC authentication format error. Please contact support.");
                }

                // Check for successful authentication - Twitch sends "001 <user> :Welcome, GLHF!"
                if line.contains(" 001 ") && line.contains("Welcome, GLHF!") {
                    authenticated = true;
                    eprintln!("✓ Authentication successful! (Received 001 welcome message)");
                    break;
                }

                // Respond to PING during auth
                if line.starts_with("PING") {
                    let pong = line.replace("PING", "PONG");
                    write
                        .send(Message::Text(pong.into()))
                        .await
                        .context("Failed to send PONG during auth")?;
                }
            }
            Err(e) => {
                return Err(e).context("WebSocket error during authentication");
            }
            _ => {}
        }
    }

    if !authenticated {
        anyhow::bail!("Authentication failed - no 001 message received");
    }

    // Now that we're authenticated, join the target channel
    eprintln!("Step 4: Joining channel #{}", target_channel);
    write
        .send(Message::Text(format!("JOIN #{}", target_channel).into()))
        .await
        .context("Failed to send JOIN")?;

    // Wait for JOIN confirmation
    eprintln!("Waiting for JOIN confirmation...");
    let mut joined = false;
    let mut join_msg_count = 0;
    while let Some(msg) = read.next().await {
        join_msg_count += 1;
        if join_msg_count > 20 {
            anyhow::bail!("Timeout waiting for JOIN confirmation");
        }

        match msg {
            Ok(Message::Text(line)) => {
                eprintln!("IRC << {}", line);

                // Check for channel-specific errors
                if line.contains("msg_channel_suspended") || line.contains("msg_banned") {
                    anyhow::bail!(
                        "Cannot join #{}: channel is suspended or you are banned",
                        target_channel
                    );
                }

                // Check for successful JOIN (366 = end of NAMES list)
                if line.contains(" 366 ")
                    || (line.contains("JOIN") && line.contains(&format!("#{}", target_channel)))
                {
                    joined = true;
                    eprintln!("✓ Successfully joined channel #{}", target_channel);
                    break;
                }

                // Respond to PING
                if line.starts_with("PING") {
                    let pong = line.replace("PING", "PONG");
                    write
                        .send(Message::Text(pong.into()))
                        .await
                        .context("Failed to send PONG during JOIN")?;
                }
            }
            Err(e) => {
                return Err(e).context("WebSocket error during JOIN");
            }
            _ => {}
        }
    }

    if !joined {
        anyhow::bail!(
            "Failed to join channel #{} - no confirmation received",
            target_channel
        );
    }

    eprintln!("✓ Successfully authenticated and joined channel!");

    // Reunite the stream
    let ws_stream = read.reunite(write).context("Failed to reunite stream")?;
    Ok(ws_stream)
}

/// Split IRC tags from the rest of the line.
fn split_tags(line: &str) -> (IrcTags, &str) {
    if let Some(rest) = line.strip_prefix('@') {
        if let Some((tags, rest)) = rest.split_once(' ') {
            return (parse_tags(tags), rest);
        }
    }
    (IrcTags::default(), line)
}

fn parse_tags(input: &str) -> IrcTags {
    let mut values = HashMap::new();
    for pair in input.split(';') {
        if let Some((key, value)) = pair.split_once('=') {
            values.insert(key.to_string(), unescape_tag_value(value));
        }
    }
    IrcTags { values }
}

/// Twitch escapes space/colon/semicolon/etc. in tag values.
fn unescape_tag_value(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    let mut chars = value.chars();
    while let Some(ch) = chars.next() {
        if ch != '\\' {
            out.push(ch);
            continue;
        }
        match chars.next() {
            Some('s') => out.push(' '),
            Some(':') => out.push(':'),
            Some('\\') => out.push('\\'),
            Some('r') => out.push('\r'),
            Some('n') => out.push('\n'),
            Some(other) => {
                out.push('\\');
                out.push(other);
            }
            None => out.push('\\'),
        }
    }
    out
}

/// Parse IRC PRIVMSG to extract username, channel, tags, and message.
/// Format with tags: @badge-info=...;badges=... :username!username@username.tmi.twitch.tv PRIVMSG #channel :message
/// Format without tags: :username!username@username.tmi.twitch.tv PRIVMSG #channel :message
pub fn parse_irc_privmsg(line: &str) -> Option<IrcMessage> {
    if !line.contains("PRIVMSG") {
        return None;
    }

    let (tags, rest) = split_tags(line);
    let (prefix, after) = rest.split_once(" PRIVMSG ")?;
    let (channel, message) = after.split_once(" :")?;

    let channel = channel.trim().trim_start_matches('#').to_string();
    let username = prefix
        .trim_start_matches(':')
        .split('!')
        .next()?
        .to_string();
    if username.is_empty() || channel.is_empty() {
        return None;
    }

    let display_name = tags.display_name().unwrap_or(&username).to_string();

    Some(IrcMessage {
        username,
        display_name,
        user_id: tags.get("user-id").map(str::to_string),
        color: tags
            .get("color")
            .filter(|v| !v.is_empty())
            .map(str::to_string),
        badges: tags.badges(),
        is_mod: tags.is_mod(),
        is_vip: tags.is_vip(),
        is_broadcaster: tags.is_broadcaster(),
        is_subscriber: tags.is_subscriber(),
        message: message.trim().to_string(),
        channel,
        timestamp: tags.timestamp_rfc3339(),
    })
}

/// Parse a Twitch `USERNOTICE` raid event.
pub fn parse_raid_usernotice(line: &str) -> Option<RaidNotice> {
    let (tags, rest) = split_tags(line);
    if tags.get("msg-id") != Some("raid") {
        return None;
    }

    let (_, after) = rest.split_once(" USERNOTICE ")?;
    let channel = after
        .trim_start_matches('#')
        .split_whitespace()
        .next()?
        .to_string();

    let from_login = tags
        .get("msg-param-login")
        .or_else(|| tags.get("login"))?
        .to_string();
    let from_display_name = tags
        .get("msg-param-displayName")
        .filter(|value| !value.is_empty())
        .unwrap_or(&from_login)
        .to_string();
    let viewers = tags
        .get("msg-param-viewerCount")
        .and_then(|value| value.parse().ok())
        .unwrap_or(0);

    Some(RaidNotice {
        channel,
        from_login,
        from_display_name,
        viewers,
        timestamp: tags.timestamp_rfc3339(),
    })
}

/// Check if message is a translate command
pub fn is_translate_command(msg: &str) -> bool {
    msg.starts_with("!ts ")
}

/// Extract text after "!ts "
pub fn extract_translate_text(msg: &str) -> Option<String> {
    if !is_translate_command(msg) {
        return None;
    }
    let text = msg.trim_start_matches("!ts ").trim();
    if text.is_empty() {
        None
    } else {
        Some(text.to_string())
    }
}

/// Check if message is a dictionary command
pub fn is_dictionary_command(msg: &str) -> bool {
    msg.starts_with("!d ")
}

/// Extract word after "!d " (first word only)
pub fn extract_dictionary_word(msg: &str) -> Option<String> {
    if !is_dictionary_command(msg) {
        return None;
    }
    let word = msg.trim_start_matches("!d ").trim();
    if word.is_empty() {
        None
    } else {
        // Take only the first word (ignore extra text)
        Some(word.split_whitespace().next()?.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_privmsg() {
        let line = ":testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :Hello world";
        let msg = parse_irc_privmsg(line).unwrap();
        assert_eq!(msg.username, "testuser");
        assert_eq!(msg.channel, "testchannel");
        assert_eq!(msg.message, "Hello world");
    }

    #[test]
    fn test_parse_privmsg_with_tags() {
        // Real Twitch IRC message with tags
        let line = "@badge-info=subscriber/55;badges=broadcaster/1,subscriber/3000;color=#FF0000;display-name=sushat4692 :sushat4692!sushat4692@sushat4692.tmi.twitch.tv PRIVMSG #sushat4692 :!ts test message";
        let msg = parse_irc_privmsg(line).unwrap();
        assert_eq!(msg.username, "sushat4692");
        assert_eq!(msg.channel, "sushat4692");
        assert_eq!(msg.message, "!ts test message");
    }

    #[test]
    fn test_is_translate_command() {
        assert!(is_translate_command("!ts こんにちは"));
        assert!(is_translate_command("!ts Hello"));
        assert!(!is_translate_command("!translate test"));
        assert!(!is_translate_command("ts test"));
        assert!(!is_translate_command("!ts"));
    }

    #[test]
    fn test_extract_translate_text() {
        assert_eq!(
            extract_translate_text("!ts こんにちは"),
            Some("こんにちは".to_string())
        );
        assert_eq!(
            extract_translate_text("!ts Hello world"),
            Some("Hello world".to_string())
        );
        assert_eq!(extract_translate_text("!ts"), None);
        assert_eq!(extract_translate_text("!ts "), None);
    }

    #[test]
    fn test_is_dictionary_command() {
        assert!(is_dictionary_command("!d apple"));
        assert!(is_dictionary_command("!d りんご"));
        assert!(!is_dictionary_command("!dict apple"));
        assert!(!is_dictionary_command("d apple"));
        assert!(!is_dictionary_command("!d"));
    }

    #[test]
    fn test_parse_privmsg_extracts_tags() {
        let line = "@badge-info=subscriber/55;badges=broadcaster/1,subscriber/3000;color=#FF0000;display-name=SUSH;mod=1;tmi-sent-ts=1700000000000;user-id=123 :sushat4692!sushat4692@sushat4692.tmi.twitch.tv PRIVMSG #chan :!ts hello";
        let msg = parse_irc_privmsg(line).unwrap();
        assert_eq!(msg.username, "sushat4692");
        assert_eq!(msg.display_name, "SUSH");
        assert_eq!(msg.user_id.as_deref(), Some("123"));
        assert_eq!(msg.color.as_deref(), Some("#FF0000"));
        assert!(msg.is_broadcaster);
        assert!(msg.is_mod);
        assert!(msg.is_subscriber);
        assert!(!msg.is_vip);
        assert_eq!(msg.channel, "chan");
        assert_eq!(msg.message, "!ts hello");
        assert!(msg.timestamp.starts_with("2023-11-14T22:13:20"));
    }

    #[test]
    fn test_parse_privmsg_message_can_contain_colons() {
        let line = ":alice!alice@alice.tmi.twitch.tv PRIVMSG #chan :hello: world";
        let msg = parse_irc_privmsg(line).unwrap();
        assert_eq!(msg.username, "alice");
        assert_eq!(msg.message, "hello: world");
    }

    #[test]
    fn test_parse_raid_usernotice() {
        let line = r#"@badge-info=;badges=;color=;display-name=Raider;emotes=;flags=;id=1;login=raider;mod=0;msg-id=raid;msg-param-displayName=Raider;msg-param-login=raider;msg-param-viewerCount=42;room-id=1;subscriber=0;system-msg=Raider\sis\sraiding;tmi-sent-ts=1700000000000;turbo=0;user-id=2;user-type= :tmi.twitch.tv USERNOTICE #chan :Raider is raiding with 42 viewers!"#;
        let raid = parse_raid_usernotice(line).unwrap();
        assert_eq!(raid.channel, "chan");
        assert_eq!(raid.from_login, "raider");
        assert_eq!(raid.from_display_name, "Raider");
        assert_eq!(raid.viewers, 42);
        assert!(raid.timestamp.starts_with("2023-11-14T22:13:20"));
    }

    #[test]
    fn test_parse_raid_ignores_other_usernotice() {
        let line = "@msg-id=sub;login=alice :tmi.twitch.tv USERNOTICE #chan :hello";
        assert!(parse_raid_usernotice(line).is_none());
    }

    #[test]
    fn test_unescape_tag_value() {
        assert_eq!(unescape_tag_value("hello\\sworld"), "hello world");
        assert_eq!(unescape_tag_value("a\\:b"), "a:b");
        assert_eq!(unescape_tag_value("a\\\\b"), "a\\b");
    }

    #[test]
    fn test_extract_dictionary_word() {
        assert_eq!(
            extract_dictionary_word("!d apple"),
            Some("apple".to_string())
        );
        assert_eq!(
            extract_dictionary_word("!d りんご"),
            Some("りんご".to_string())
        );
        // Only first word
        assert_eq!(
            extract_dictionary_word("!d apple pie"),
            Some("apple".to_string())
        );
        assert_eq!(
            extract_dictionary_word("!d   hello   world"),
            Some("hello".to_string())
        );
        assert_eq!(extract_dictionary_word("!d"), None);
        assert_eq!(extract_dictionary_word("!d "), None);
    }
}
