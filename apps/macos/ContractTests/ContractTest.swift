import Foundation

/// Shared box for the contract-test result (the Task mutates it, main reads it).
final class ContractResult: @unchecked Sendable {
    var error: Error?
}

func makeDecoder() -> JSONDecoder {
    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    return decoder
}

// MARK: - Pure decoding tests (no runtime needed)

func runDecodingTests() throws {
    let decoder = makeDecoder()

    let translation = """
        {"type":"translation","data":{"original_user":"alice","original_message":"こんにちは",
        "suggestions":[{"text":"Hello","formality":"neutral"}],"points":["greeting"],
        "timestamp":"2026-01-01T00:00:00Z","source_lang":"Japanese","target_lang":"English"}}
        """
    let event = try decoder.decode(StreaidEvent.self, from: Data(translation.utf8))
    guard case .translation(let translationEvent) = event,
        translationEvent.suggestions.first?.text == "Hello",
        translationEvent.sourceLang == "Japanese"
    else {
        fatalError("translation event decoding failed")
    }

    let dictionary = """
        {"type":"dictionary","data":{"original_user":"bob","original_word":"serendipity",
        "word":"serendipity","meaning":"luck","examples":["a"],"similar_words":["fortune"],
        "timestamp":"t","source_lang":"English","target_lang":"Japanese"}}
        """
    let dictionaryEvent = try decoder.decode(StreaidEvent.self, from: Data(dictionary.utf8))
    guard case .dictionary(let value) = dictionaryEvent, value.word == "serendipity" else {
        fatalError("dictionary event decoding failed")
    }

    let chat = """
        {"type":"chat_message","data":{"username":"carol","display_name":"Carol",
        "user_id":"123","color":"#FF0000","badges":["moderator/1"],"is_mod":true,
        "is_vip":false,"is_broadcaster":false,"is_subscriber":false,"message":"hi",
        "channel":"chan","timestamp":"t"}}
        """
    let chatEvent = try decoder.decode(StreaidEvent.self, from: Data(chat.utf8))
    guard case .chatMessage(let value) = chatEvent,
        value.channel == "chan",
        value.displayName == "Carol",
        value.isMod
    else {
        fatalError("chat message event decoding failed")
    }

    let raid = """
        {"type":"raid","data":{"from_login":"raider","from_display_name":"Raider",
        "viewers":42,"channel":"chan","timestamp":"t"}}
        """
    let raidEvent = try decoder.decode(StreaidEvent.self, from: Data(raid.utf8))
    guard case .raid(let raidValue) = raidEvent,
        raidValue.viewers == 42,
        raidValue.fromDisplayName == "Raider"
    else {
        fatalError("raid event decoding failed")
    }

    let modelTest = """
        {"mode":"ts","source_lang":"Japanese","target_lang":"English",
        "suggestions":[{"text":"Hi","formality":"casual"}],"points":["p"],"duration_ms":42}
        """
    let testResult = try decoder.decode(ModelTestResult.self, from: Data(modelTest.utf8))
    guard case .ts(let ts) = testResult, ts.durationMs == 42 else {
        fatalError("model test decoding failed")
    }

    let vocabulary = """
        {"total_words":1,"total_lookups":2,
        "top_words":[{"word":"apple","count":2,"source_forms":[["apples",2]]}],
        "ambiguous":[{"word":"lives","count":1,"candidates":["life","live"]}]}
        """
    let summary = try decoder.decode(VocabularySummary.self, from: Data(vocabulary.utf8))
    guard summary.topWords.first?.sourceForms.first?.form == "apples",
        summary.ambiguous.first?.candidates.count == 2
    else {
        fatalError("vocabulary summary decoding failed")
    }

    let top = """
        [["apple",2],["live",1]]
        """
    let counts = try decoder.decode([WordCount].self, from: Data(top.utf8))
    guard counts.first?.word == "apple", counts.first?.count == 2 else {
        fatalError("vocab.top decoding failed")
    }
}

// MARK: - Live C ABI tests

func runCoreTests(_ core: StreaidCore) async throws {
    let capabilities = try await core.capabilities()
    guard capabilities.apiVersion == 1 else {
        fatalError("unexpected api_version: \(capabilities.apiVersion)")
    }
    guard !capabilities.appDataDir.isEmpty else {
        fatalError("app_data_dir is empty")
    }
    guard capabilities.overlayUrl.contains("4242") else {
        fatalError("unexpected overlay_url: \(capabilities.overlayUrl)")
    }
    guard capabilities.os == "macos" else {
        fatalError("unexpected os: \(capabilities.os)")
    }

    let appDataDir = try await core.appDataDir()
    if let expected = ProcessInfo.processInfo.environment["STREAID_DATA_DIR"] {
        guard appDataDir == expected else {
            fatalError("app_data_dir did not honor STREAID_DATA_DIR: \(appDataDir)")
        }
    } else {
        guard appDataDir.contains("im.sush.streaid") else {
            fatalError("unexpected app_data_dir: \(appDataDir)")
        }
    }

    let overlayURL = try await core.overlayURL()
    guard overlayURL.contains("4242") else {
        fatalError("unexpected overlay_url: \(overlayURL)")
    }

    let status = try await core.chatStatus()
    guard status.isEnabled else {
        fatalError("translation toggle should default to enabled")
    }

    let events = try await core.pollEvents()
    guard events.isEmpty else {
        fatalError("expected no events before the listener starts")
    }

    let summary = try await core.vocabularySummary()
    guard summary.totalWords >= 0 else {
        fatalError("invalid vocabulary summary")
    }

    // JSON stores (the script points STREAID_DATA_DIR at a temp dir).
    let commands = try await core.saveCommand(
        id: "",
        command: "!contract_test",
        body: "hello from the contract test",
        memo: "temporary",
        allow: "everyone"
    )
    guard let command = commands.first(where: { $0.command == "contract_test" }) else {
        fatalError("command was not saved")
    }
    let afterCommandDelete = try await core.deleteCommand(id: command.id)
    guard !afterCommandDelete.contains(where: { $0.id == command.id }) else {
        fatalError("command was not deleted")
    }

    let memos = try await core.saveMemo(
        id: "",
        username: "contract_user",
        nickname: "Contract",
        memo: "hello"
    )
    guard let memo = memos.first(where: { $0.username == "contract_user" }) else {
        fatalError("memo was not saved")
    }
    _ = try await core.deleteMemo(id: memo.id)

    _ = try await core.listRaiders()

    let settings = try await core.getSettings()
    var updatedSettings = settings
    updatedSettings.shoutoutInfoLength = 12
    let savedSettings = try await core.saveSettings(updatedSettings)
    guard savedSettings.shoutoutInfoLength == 12 else {
        fatalError("settings were not saved")
    }

    do {
        _ = try await core.callData("does.not.exist")
        fatalError("unknown methods must throw")
    } catch StreaidError.core(let message) {
        guard message.contains("unknown method") else {
            fatalError("unexpected error: \(message)")
        }
    }

    // Exercise the synchronous path used by AppDelegate.applicationWillTerminate.
    core.shutdownSync()
}
