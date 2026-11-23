import Foundation
import StreaidFFI

// MARK: - Errors

public enum StreaidError: Error, LocalizedError, Sendable {
    case core(String)
    case invalidRequest(String)
    case invalidResponse(String)

    public var errorDescription: String? {
        switch self {
        case .core(let message):
            return message
        case .invalidRequest(let message):
            return "Invalid request: \(message)"
        case .invalidResponse(let message):
            return "Invalid response from core: \(message)"
        }
    }
}

// MARK: - Core client

/// Thin Swift wrapper over the Rust core's C ABI.
///
/// - Create exactly one instance, on the main thread, at app launch.
/// - All calls are async and run on a private serial queue, so the UI never
///   blocks (core methods such as `model.test` can take several seconds).
/// - Events are polled with `eventStream(every:)`; the core keeps the state.
public final class StreaidCore: @unchecked Sendable {
    private static let queue = DispatchQueue(
        label: "im.sush.streaid.core", qos: .userInitiated)

    /// Initializes the Rust runtime, event channel and background services
    /// (overlay server / token refresh). Must run on the main thread.
    public init() {
        if Thread.isMainThread {
            streaid_init()
        } else {
            DispatchQueue.main.sync { streaid_init() }
        }
    }

    // MARK: Raw JSON API

    /// Send a raw JSON request (`method` + `params`) and return the raw
    /// `result` payload. Throws `StreaidError.core` for core errors.
    public func callData(_ method: String, _ params: [String: Any] = [:]) async throws -> Data {
        let request = try Self.encodeRequest(method: method, params: params)
        return try await withCheckedThrowingContinuation { continuation in
            Self.queue.async {
                do {
                    continuation.resume(returning: try Self.dispatch(request))
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    /// Typed variant of `callData`.
    public func call<T: Decodable>(_ method: String, _ params: [String: Any] = [:])
        async throws -> T
    {
        let data = try await callData(method, params)
        return try Self.makeDecoder().decode(T.self, from: data)
    }

    /// Call a method that returns `null`.
    public func callVoid(_ method: String, _ params: [String: Any] = [:]) async throws {
        _ = try await callData(method, params)
    }

    /// Drain pending events (translation / dictionary / chat message).
    public func pollEvents() async throws -> [StreaidEvent] {
        let data: Data = try await withCheckedThrowingContinuation { continuation in
            Self.queue.async {
                do {
                    let pointer = streaid_poll_events()
                    guard let pointer else {
                        throw StreaidError.invalidResponse("core returned NULL")
                    }
                    defer { streaid_free(pointer) }
                    let response = String(cString: pointer)
                    guard let responseData = response.data(using: .utf8) else {
                        throw StreaidError.invalidResponse("response is not UTF-8")
                    }
                    continuation.resume(returning: try Self.extractResult(responseData))
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
        return try Self.makeDecoder().decode([StreaidEvent].self, from: data)
    }

    /// Poll events every `interval` and yield non-empty batches.
    /// The stream finishes when the task is cancelled or the core is gone.
    public func eventStream(every interval: Duration = .milliseconds(100))
        -> AsyncStream<[StreaidEvent]>
    {
        AsyncStream { continuation in
            let task = Task { [weak self] in
                guard let self else {
                    continuation.finish()
                    return
                }
                while !Task.isCancelled {
                    do {
                        let events = try await self.pollEvents()
                        if !events.isEmpty {
                            continuation.yield(events)
                        }
                    } catch {
                        // Transient errors: keep polling. Status is available
                        // separately via `chatStatus()`.
                    }
                    try? await Task.sleep(for: interval)
                }
                continuation.finish()
            }
            continuation.onTermination = { @Sendable _ in task.cancel() }
        }
    }

    /// Stop the local model sidecars and background work.
    public func shutdown() async {
        try? await callVoid("system.shutdown")
    }

    /// Synchronous shutdown for `applicationWillTerminate`.
    /// Safe to call from the main thread; kills local-model child processes
    /// before the app exits.
    public func shutdownSync() {
        guard let request = try? Self.encodeRequest(method: "system.shutdown", params: [:])
        else { return }
        _ = try? Self.dispatch(request)
    }

    // MARK: System

    public func capabilities() async throws -> StreaidCapabilities {
        try await call("system.capabilities")
    }

    public func appDataDir() async throws -> String {
        try await call("system.app_data_dir")
    }

    public func overlayURL() async throws -> String {
        try await call("system.overlay_url")
    }

    // MARK: Auth

    public func authStatus() async throws -> AuthStatus {
        try await call("auth.status")
    }

    public func hasStoredToken() async throws -> Bool {
        try await call("auth.has_token")
    }

    public func storedToken() async throws -> TokenInfo? {
        try await call("auth.stored_token")
    }

    public func saveClientID(_ clientID: String) async throws {
        try await callVoid("auth.save_client_id", ["client_id": clientID])
    }

    public func loadClientID() async throws -> String? {
        try await call("auth.load_client_id")
    }

    public func startDeviceFlow(clientID: String) async throws -> DeviceCodeInfo {
        try await call("auth.start_device_flow", ["client_id": clientID])
    }

    public func pollDeviceFlow() async throws -> TokenInfo? {
        try await call("auth.poll_device_flow")
    }

    /// Polling interval in seconds, updated when Twitch asks us to slow down.
    public func deviceFlowInterval() async throws -> UInt64? {
        try await call("auth.device_flow_interval")
    }

    public func clearAuth() async throws {
        try await callVoid("auth.clear")
    }

    // MARK: Gemini

    public func setGeminiAPIKey(_ key: String) async throws {
        try await callVoid("gemini.set_key", ["key": key])
    }

    public func maskedGeminiAPIKey() async throws -> String? {
        try await call("gemini.key_masked")
    }

    public func hasGeminiAPIKey() async throws -> Bool {
        try await call("gemini.has_key")
    }

    // MARK: Chat listener

    public func chatStatus() async throws -> ChatStatus {
        try await call("chat.status")
    }

    /// Start the IRC listener. `nil` monitors the authenticated user's channel.
    public func startChat(channel: String? = nil) async throws {
        var params: [String: Any] = [:]
        if let channel {
            params["channel"] = channel
        }
        try await callVoid("chat.start", params)
    }

    public func stopChat() async throws {
        try await callVoid("chat.stop")
    }

    public func toggleTranslation(enabled: Bool) async throws {
        try await callVoid("chat.toggle", ["enabled": enabled])
    }

    /// Last channel typed in the UI (`nil` = never set).
    public func lastChannel() async throws -> String? {
        try await call("chat.last_channel")
    }

    public func rememberChannel(_ channel: String) async throws {
        try await callVoid("chat.remember_channel", ["channel": channel])
    }

    // MARK: Local model

    public func localModelStatus() async throws -> BonsaiStatus {
        try await call("model.status")
    }

    public func setLocalModelEnabled(_ enabled: Bool) async throws {
        try await callVoid("model.set_enabled", ["enabled": enabled])
    }

    public func setLocalModelVariant(_ model: String) async throws {
        try await callVoid("model.set_variant", ["model": model])
    }

    /// One-shot translation (`mode == "ts"`) or lookup (`mode == "d"`).
    public func testModel(text: String, provider: String, mode: String) async throws
        -> ModelTestResult
    {
        try await call("model.test", [
            "text": text,
            "provider": provider,
            "mode": mode,
        ])
    }

    // MARK: Sounds

    public func saveSound(slot: String, fileName: String, data: Data) async throws {
        try await callVoid("sounds.save", [
            "slot": slot,
            "file_name": fileName,
            "data_b64": data.base64EncodedString(),
        ])
    }

    public func sound(slot: String) async throws -> SoundFile? {
        try await call("sounds.get", ["slot": slot])
    }

    public func deleteSound(slot: String) async throws {
        try await callVoid("sounds.delete", ["slot": slot])
    }

    public func playSound(path: String, volume: Double = 1.0) async throws {
        try await callVoid("sounds.play", [
            "path": path,
            "volume": min(max(volume, 0.0), 1.0),
        ])
    }

    // MARK: Shoutout / settings

    public func getSettings() async throws -> AppSettings {
        try await call("settings.get")
    }

    public func saveSettings(_ settings: AppSettings) async throws -> AppSettings {
        try await call("settings.set", [
            "locale": settings.locale,
            "notifications_enabled": settings.notificationsEnabled,
            "shoutout_message": settings.shoutoutMessage,
            "shoutout_not_found": settings.shoutoutNotFound,
            "shoutout_failed": settings.shoutoutFailed,
            "shoutout_info_length": settings.shoutoutInfoLength,
            "discord_webhook": settings.discordWebhook,
        ])
    }

    /// Run a shoutout and post the message to chat. `mode` is nil, "info", or "clip".
    public func runShoutout(username: String, mode: String? = nil) async throws -> String {
        var params: [String: Any] = ["username": username]
        if let mode { params["mode"] = mode }
        return try await call("shoutout.run", params)
    }

    public func stopShoutoutClip() async throws {
        try await callVoid("shoutout.stop")
    }

    // MARK: Raiders / commands / memos

    public func listRaiders() async throws -> [RaiderRecord] {
        try await call("raiders.list")
    }

    public func deleteRaider(id: String) async throws -> [RaiderRecord] {
        try await call("raiders.delete", ["id": id])
    }

    public func listCommands() async throws -> [CommandRecord] {
        try await call("commands.list")
    }

    public func saveCommand(
        id: String,
        command: String,
        body: String,
        memo: String,
        allow: String
    ) async throws -> [CommandRecord] {
        try await call("commands.save", [
            "id": id,
            "command": command,
            "body": body,
            "memo": memo,
            "allow": allow,
        ])
    }

    public func deleteCommand(id: String) async throws -> [CommandRecord] {
        try await call("commands.delete", ["id": id])
    }

    public func listMemos() async throws -> [MemoRecord] {
        try await call("memos.list")
    }

    public func saveMemo(
        id: String,
        username: String,
        nickname: String,
        memo: String
    ) async throws -> [MemoRecord] {
        try await call("memos.save", [
            "id": id,
            "username": username,
            "nickname": nickname,
            "memo": memo,
        ])
    }

    public func deleteMemo(id: String) async throws -> [MemoRecord] {
        try await call("memos.delete", ["id": id])
    }

    // MARK: Vocabulary

    public func vocabularySummary() async throws -> VocabularySummary {
        try await call("vocab.summary")
    }

    public func topWords(n: Int = 20) async throws -> [WordCount] {
        try await call("vocab.top", ["n": n])
    }

    public func clearVocabulary() async throws {
        try await callVoid("vocab.clear")
    }

    public func analyzeVocabulary() async throws -> [CategoryResult] {
        try await call("vocab.analyze")
    }

    // MARK: Overlay

    public func overlaySessionLookups() async throws -> [SessionLookup] {
        try await call("overlay.session_lookups")
    }

    // MARK: - JSON plumbing

    private static func encodeRequest(method: String, params: [String: Any]) throws -> Data {
        let body: [String: Any] = ["method": method, "params": params]
        guard JSONSerialization.isValidJSONObject(body) else {
            throw StreaidError.invalidRequest("parameters are not JSON-serializable")
        }
        return try JSONSerialization.data(withJSONObject: body)
    }

    private static func dispatch(_ request: Data) throws -> Data {
        let requestString = String(decoding: request, as: UTF8.self)
        let responsePointer = requestString.withCString { streaid_dispatch($0) }
        guard let responsePointer else {
            throw StreaidError.invalidResponse("core returned NULL")
        }
        defer { streaid_free(responsePointer) }

        let response = String(cString: responsePointer)
        guard let responseData = response.data(using: .utf8) else {
            throw StreaidError.invalidResponse("response is not UTF-8")
        }
        return try extractResult(responseData)
    }

    private static func extractResult(_ data: Data) throws -> Data {
        guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw StreaidError.invalidResponse("response is not a JSON object")
        }
        guard object["ok"] as? Bool == true else {
            throw StreaidError.core(object["error"] as? String ?? "unknown core error")
        }
        guard let result = object["result"] else {
            throw StreaidError.invalidResponse("missing result")
        }
        if result is NSNull {
            return Data("null".utf8)
        }
        do {
            return try JSONSerialization.data(
                withJSONObject: result, options: [.fragmentsAllowed])
        } catch {
            throw StreaidError.invalidResponse("failed to re-encode result: \(error)")
        }
    }

    private static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return decoder
    }
}
