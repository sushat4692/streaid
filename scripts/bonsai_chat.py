#!/usr/bin/env python3
"""Interactive Bonsai chat client for testing without Twitch.

Reads sentences from stdin (one per line), detects JA/EN, and prints the
local model's translation. Requires llama-server on port 4243.
"""
import json
import sys
import urllib.request

BASE = "http://127.0.0.1:4243"


def has_japanese(text: str) -> bool:
    return any(
        "\u3040" <= c <= "\u30FF" or "\u4E00" <= c <= "\u9FFF" for c in text
    )


def translate(text: str) -> str:
    from_lang, to_lang = ("Japanese", "English") if has_japanese(text) else ("English", "Japanese")
    body = {
        "messages": [
            {"role": "system", "content": f"You are a Japanese-English translator. Translate the user's {from_lang} text to natural {to_lang}. Do not explain."},
            {"role": "user", "content": text},
        ],
        "temperature": 0.7,
    }
    req = urllib.request.Request(
        BASE + "/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.load(resp)
    return data["choices"][0]["message"]["content"].strip()


def main() -> None:
    print("Type a sentence (JA or EN), Ctrl-D to quit:", flush=True)
    for line in sys.stdin:
        text = line.strip()
        if not text:
            continue
        print(translate(text), flush=True)


if __name__ == "__main__":
    main()
