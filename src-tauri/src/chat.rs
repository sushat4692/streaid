use anyhow::{Context, Result};
use futures_util::{SinkExt, StreamExt};
use tokio::net::TcpStream;
use tokio_tungstenite::{connect_async, tungstenite::Message, MaybeTlsStream, WebSocketStream};

pub type WsStream = WebSocketStream<MaybeTlsStream<TcpStream>>;

#[derive(Debug)]
pub struct IrcMessage {
    pub username: String,
    pub message: String,
    #[allow(dead_code)]
    pub channel: String,
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
            "CAP REQ :twitch.tv/tags twitch.tv/commands".to_string(),
        ))
        .await
        .context("Failed to request capabilities")?;

    // 2. PASS - Send OAuth token
    eprintln!("Step 2: Sending PASS (OAuth token)...");
    write
        .send(Message::Text(format!("PASS {}", oauth_token)))
        .await
        .context("Failed to send PASS")?;

    // 3. NICK - Send username
    eprintln!("Step 3: Sending NICK: {}", username.to_lowercase());
    write
        .send(Message::Text(format!("NICK {}", username.to_lowercase())))
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
                        .send(Message::Text(pong))
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
        .send(Message::Text(format!("JOIN #{}", target_channel)))
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
                        .send(Message::Text(pong))
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

/// Parse IRC PRIVMSG to extract username, channel, and message
/// Format with tags: @badge-info=...;badges=... :username!username@username.tmi.twitch.tv PRIVMSG #channel :message
/// Format without tags: :username!username@username.tmi.twitch.tv PRIVMSG #channel :message
pub fn parse_irc_privmsg(line: &str) -> Option<IrcMessage> {
    // Skip if not a PRIVMSG
    if !line.contains("PRIVMSG") {
        return None;
    }

    // Strip IRC tags if present (tags start with @ and end before first space and :)
    let line_without_tags = if line.starts_with('@') {
        // Find the start of the actual message (after tags)
        // Tags format: @tag1=value1;tag2=value2 :username!...
        line.find(" :").map(|idx| &line[idx + 1..]).unwrap_or(line)
    } else {
        line
    };

    // Split the line
    let parts: Vec<&str> = line_without_tags.split_whitespace().collect();
    if parts.len() < 4 {
        return None;
    }

    // Extract username from :username!username@...
    let username = parts[0]
        .trim_start_matches(':')
        .split('!')
        .next()?
        .to_string();

    // Extract channel from #channel
    let channel = parts[2].trim_start_matches('#').to_string();

    // Extract message (everything after the second ':')
    let message_start = line_without_tags.find(" :")?;
    let message_start = line_without_tags[message_start + 2..]
        .find(':')
        .map(|i| i + message_start + 2);

    let message = if let Some(idx) = message_start {
        line_without_tags[idx + 1..].trim().to_string()
    } else {
        // Fallback: join parts after PRIVMSG #channel
        parts[3..].join(" ").trim_start_matches(':').to_string()
    };

    Some(IrcMessage {
        username,
        message,
        channel,
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
