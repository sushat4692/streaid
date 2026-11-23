import Foundation

// MARK: - System

public struct StreaidCapabilities: Decodable, Sendable {
    public let apiVersion: Int
    public let os: String
    public let platform: String
    public let localModelSupported: Bool
    public let appDataDir: String
    public let overlayUrl: String

    /// Swift-friendly alias.
    public var overlayURL: String { overlayUrl }
}

public struct ChatStatus: Decodable, Sendable {
    public let connected: Bool
    public let isRunning: Bool
    public let isEnabled: Bool
    public let reconnecting: Bool
    public let channel: String?
    public let lastTargetChannel: String?
}

// MARK: - Auth

public struct DeviceCodeInfo: Decodable, Sendable {
    public let verificationUri: String
    public let userCode: String
    public let expiresIn: UInt64
    public let interval: UInt64

    public var verificationURL: URL? { URL(string: verificationUri) }
}

public struct AuthStatus: Decodable, Sendable {
    public let hasToken: Bool
    public let error: String?
}

public struct TokenInfo: Decodable, Sendable {
    public let accessToken: String
    public let refreshToken: String?
    public let expiresIn: UInt64?
    public let scope: String?
    public let login: String?
    public let userId: String?
}

// MARK: - Events

public struct TranslationSuggestion: Decodable, Sendable {
    public let text: String
    public let formality: String
}

public struct TranslationEvent: Decodable, Sendable {
    public let originalUser: String
    public let originalMessage: String
    public let suggestions: [TranslationSuggestion]
    public let points: [String]
    public let timestamp: String
    public let sourceLang: String
    public let targetLang: String
}

public struct DictionaryEvent: Decodable, Sendable {
    public let originalUser: String
    public let originalWord: String
    public let word: String
    public let meaning: String
    public let examples: [String]
    public let similarWords: [String]
    public let timestamp: String
    public let sourceLang: String
    public let targetLang: String
}

public struct ChatMessageEvent: Decodable, Sendable {
    public let username: String
    public let displayName: String
    public let userId: String?
    public let color: String?
    public let badges: [String]
    public let isMod: Bool
    public let isVip: Bool
    public let isBroadcaster: Bool
    public let isSubscriber: Bool
    public let message: String
    public let channel: String
    public let timestamp: String
}

/// A raid (`USERNOTICE` with `msg-id=raid`).
public struct RaidEvent: Decodable, Sendable {
    public let fromLogin: String
    public let fromDisplayName: String
    public let viewers: UInt64
    public let channel: String
    public let timestamp: String
}

/// One chatter seen during this app session.
public struct Chatter: Identifiable, Sendable {
    public let id: String
    public let username: String
    public let displayName: String
    public let color: String?
    public let firstSeen: Date
}

/// A persisted raid entry.
public struct RaiderRecord: Decodable, Identifiable, Sendable {
    public let id: String
    public let channel: String
    public let username: String
    public let displayName: String
    public let viewers: UInt64
    public let timestamp: String
}

public struct CommandRecord: Decodable, Identifiable, Sendable {
    public let id: String
    public let command: String
    public let body: String
    public let memo: String
    public let allow: String
    public let createdAt: String
}

public struct MemoRecord: Decodable, Identifiable, Sendable {
    public let id: String
    public let username: String
    public let nickname: String
    public let memo: String
    public let createdAt: String
    public let updatedAt: String
}

/// One event from the core's event channel, tagged by `type`.
public enum StreaidEvent: Decodable, Sendable {
    case translation(TranslationEvent)
    case dictionary(DictionaryEvent)
    case chatMessage(ChatMessageEvent)
    case raid(RaidEvent)
    case unknown(String)

    private enum CodingKeys: String, CodingKey {
        case type
        case data
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "translation":
            self = .translation(try container.decode(TranslationEvent.self, forKey: .data))
        case "dictionary":
            self = .dictionary(try container.decode(DictionaryEvent.self, forKey: .data))
        case "chat_message":
            self = .chatMessage(try container.decode(ChatMessageEvent.self, forKey: .data))
        case "raid":
            self = .raid(try container.decode(RaidEvent.self, forKey: .data))
        default:
            self = .unknown(type)
        }
    }
}

// MARK: - Local model

public struct BonsaiModelStatus: Decodable, Sendable {
    public let name: String
    public let running: Bool
    public let modelFound: Bool
}

public struct BonsaiStatus: Decodable, Sendable {
    public let enabled: Bool
    public let runtimeFound: Bool
    public let activeModel: String
    public let models: [BonsaiModelStatus]
}

// MARK: - Model test

public struct ModelTestTS: Decodable, Sendable {
    public let sourceLang: String
    public let targetLang: String
    public let suggestions: [TranslationSuggestion]
    public let points: [String]
    public let durationMs: UInt64
}

public struct ModelTestD: Decodable, Sendable {
    public let sourceLang: String
    public let targetLang: String
    public let word: String
    public let meaning: String
    public let examples: [String]
    public let similarWords: [String]
    public let durationMs: UInt64
}

/// Result of `model.test`. The payload is tagged by `mode` (`ts` / `d`).
public enum ModelTestResult: Decodable, Sendable {
    case ts(ModelTestTS)
    case d(ModelTestD)

    private enum CodingKeys: String, CodingKey {
        case mode
        case sourceLang
        case targetLang
        case suggestions
        case points
        case durationMs
        case word
        case meaning
        case examples
        case similarWords
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        switch try container.decode(String.self, forKey: .mode) {
        case "ts":
            self = .ts(
                ModelTestTS(
                    sourceLang: try container.decode(String.self, forKey: .sourceLang),
                    targetLang: try container.decode(String.self, forKey: .targetLang),
                    suggestions: try container.decode(
                        [TranslationSuggestion].self, forKey: .suggestions),
                    points: try container.decode([String].self, forKey: .points),
                    durationMs: try container.decode(UInt64.self, forKey: .durationMs)
                ))
        case "d":
            self = .d(
                ModelTestD(
                    sourceLang: try container.decode(String.self, forKey: .sourceLang),
                    targetLang: try container.decode(String.self, forKey: .targetLang),
                    word: try container.decode(String.self, forKey: .word),
                    meaning: try container.decode(String.self, forKey: .meaning),
                    examples: try container.decode([String].self, forKey: .examples),
                    similarWords: try container.decode([String].self, forKey: .similarWords),
                    durationMs: try container.decode(UInt64.self, forKey: .durationMs)
                ))
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .mode, in: container, debugDescription: "unknown model test mode")
        }
    }
}

// MARK: - Sounds

public struct SoundFile: Decodable, Sendable {
    public let path: String
    public let fileName: String
}

// MARK: - Vocabulary

/// One original spelling that converged to a base form: `["apples", 2]`.
public struct SourceForm: Decodable, Sendable {
    public let form: String
    public let count: UInt64

    public init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        form = try container.decode(String.self)
        count = try container.decode(UInt64.self)
    }
}

public struct TopWord: Decodable, Sendable {
    public let word: String
    public let count: UInt64
    public let sourceForms: [SourceForm]
}

public struct AmbiguousSummary: Decodable, Sendable {
    public let word: String
    public let count: UInt64
    public let candidates: [String]
}

public struct VocabularySummary: Decodable, Sendable {
    public let totalWords: Int
    public let totalLookups: UInt64
    public let topWords: [TopWord]
    public let ambiguous: [AmbiguousSummary]
}

/// One row of `vocab.top`: `["word", 3]`.
public struct WordCount: Decodable, Sendable {
    public let word: String
    public let count: UInt64

    public init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        word = try container.decode(String.self)
        count = try container.decode(UInt64.self)
    }
}

public struct CategoryResult: Decodable, Sendable {
    public let category: String
    public let words: [String]
    public let totalCount: UInt64
}

// MARK: - Overlay

public struct SessionLookup: Decodable, Sendable {
    public let word: String
    public let timestamp: String
}
