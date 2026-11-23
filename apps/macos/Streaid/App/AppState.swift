import AppKit
import Combine
import Foundation
import SwiftUI

enum ToastKind {
    case error
    case success
    case info
}

enum Page: String, CaseIterable, Identifiable {
    case dashboard
    case modelTest
    case config
    case vocabulary
    case log
    case credits

    var id: String { rawValue }

    var title: String {
        switch self {
        case .dashboard: return "Dashboard"
        case .modelTest: return "Model Test"
        case .config: return "Config"
        case .vocabulary: return "Vocabulary"
        case .log: return "Log"
        case .credits: return "Credits"
        }
    }

    var icon: String {
        switch self {
        case .dashboard: return "rectangle.grid.1x2"
        case .modelTest: return "wand.and.stars"
        case .config: return "gearshape"
        case .vocabulary: return "character.book.closed"
        case .log: return "list.bullet.rectangle"
        case .credits: return "heart.text.square"
        }
    }
}

@MainActor
final class AppState: ObservableObject {
    let core: StreaidCore

    @Published var loggedIn = false
    @Published var username: String?
    @Published var page: Page = .dashboard

    @Published var status = ChatStatus(
        connected: false,
        isRunning: false,
        isEnabled: true,
        reconnecting: false,
        channel: nil,
        lastTargetChannel: nil
    )
    @Published var bonsai: BonsaiStatus?
    @Published var capabilities: StreaidCapabilities?

    @Published var translations: [TranslationEvent] = []
    @Published var lookups: [DictionaryEvent] = []
    @Published var toast: String?
    @Published var toastKind: ToastKind = .error

    @Published var clientID = ""
    @Published var targetChannel = ""
    @Published var deviceCode: DeviceCodeInfo?
    @Published var loginError: String?
    @Published var isAuthenticating = false
    @Published var isBusy = false
    @Published var localModelBusy = false

    @Published var geminiKeyConfigured = false
    @Published var soundFirst: SoundFile?
    @Published var soundRemaining: SoundFile?
    @Published var volumeFirst: Double = 1.0
    @Published var volumeRemaining: Double = 1.0

    @Published var vocabSummary: VocabularySummary?
    @Published var vocabAnalysis: [CategoryResult] = []
    @Published var vocabAnalyzing = false

    private var seenUsers: Set<String> = []
    private var eventTask: Task<Void, Never>?
    private var statusTask: Task<Void, Never>?
    private var authTask: Task<Void, Never>?

    init() {
        self.core = StreaidCore()
        loadVolumes()
        startEventPump()
        startStatusPolling()
        Task { [weak self] in await self?.bootstrap() }
    }

    // MARK: - Derived

    var isRunning: Bool { status.isRunning }
    var translationEnabled: Bool { status.isEnabled }
    var localModelSupported: Bool { capabilities?.localModelSupported ?? true }
    var localModelEnabled: Bool { bonsai?.enabled ?? false }
    var activeModel: String { bonsai?.activeModel ?? "8b" }
    var overlayURL: String { capabilities?.overlayUrl ?? "http://localhost:4242" }

    // MARK: - Bootstrap

    private func bootstrap() async {
        // UI-development escape hatch: skip Keychain access and stay on the
        // login screen (used for screenshots / smoke tests).
        if ProcessInfo.processInfo.environment["STREAID_SKIP_AUTH"] == "1" {
            capabilities = try? await core.capabilities()
            return
        }

        do {
            capabilities = try await core.capabilities()
            if let auth = try? await core.authStatus() {
                loggedIn = auth.hasToken
                if let keychainError = auth.error {
                    showError("Keychain: \(keychainError)")
                }
            } else {
                loggedIn = false
            }
            do { clientID = try await core.loadClientID() ?? "" } catch { clientID = "" }
            do { targetChannel = try await core.lastChannel() ?? "" } catch { targetChannel = "" }
            status = (try? await core.chatStatus()) ?? status
            geminiKeyConfigured = (try? await core.hasGeminiAPIKey()) ?? false
            bonsai = try? await core.localModelStatus()

            if loggedIn {
                if let token = try? await core.storedToken() {
                    username = token.login
                }
            }
            await refreshSounds()
            await refreshVocabulary()
        } catch {
            showError(error.localizedDescription)
        }
    }

    private func startEventPump() {
        eventTask = Task { [weak self] in
            guard let self else { return }
            for await batch in self.core.eventStream() {
                for event in batch {
                    self.handle(event)
                }
            }
        }
    }

    private func startStatusPolling() {
        statusTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(2))
                guard let self else { return }
                await self.refreshStatus()
            }
        }
    }

    func refreshStatus() async {
        if let next = try? await core.chatStatus() {
            status = next
        }
        if let key = try? await core.hasGeminiAPIKey() {
            geminiKeyConfigured = key
        }
        bonsai = try? await core.localModelStatus()
    }

    private func handle(_ event: StreaidEvent) {
        switch event {
        case .translation(let value):
            translations.insert(value, at: 0)
            if translations.count > 50 {
                translations.removeLast(translations.count - 50)
            }
        case .dictionary(let value):
            lookups.insert(value, at: 0)
            if lookups.count > 50 {
                lookups.removeLast(lookups.count - 50)
            }
        case .chatMessage(let value):
            let isFirst = !seenUsers.contains(value.username)
            seenUsers.insert(value.username)
            let sound = isFirst ? soundFirst : soundRemaining
            let volume = isFirst ? volumeFirst : volumeRemaining
            if let sound {
                Task { try? await core.playSound(path: sound.path, volume: volume) }
            }
        case .unknown:
            break
        }
    }

    // MARK: - Toast

    func showError(_ message: String) {
        toastKind = .error
        toast = message
    }

    func showSuccess(_ message: String) {
        toastKind = .success
        toast = message
    }

    func showInfo(_ message: String) {
        toastKind = .info
        toast = message
    }

    // MARK: - Auth

    func startAuthentication() {
        guard authTask == nil else { return }
        authTask = Task { [weak self] in
            guard let self else { return }
            await self.authenticate()
            if !Task.isCancelled {
                self.authTask = nil
            }
        }
    }

    func cancelAuthentication() {
        authTask?.cancel()
        authTask = nil
        isAuthenticating = false
        deviceCode = nil
        loginError = nil
    }

    func saveClientID() {
        let id = clientID.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !id.isEmpty else { return }
        Task { [weak self] in
            do {
                try await self?.core.saveClientID(id)
                self?.showSuccess("Client ID saved.")
            } catch {
                self?.showError(error.localizedDescription)
            }
        }
    }

    func authenticate() async {
        let id = clientID.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !id.isEmpty else {
            loginError = "Enter your Twitch Client ID first."
            return
        }

        isAuthenticating = true
        loginError = nil
        defer { isAuthenticating = false }

        do {
            try await core.saveClientID(id)
            let info = try await core.startDeviceFlow(clientID: id)
            deviceCode = info
            if let url = URL(string: info.verificationUri) {
                NSWorkspace.shared.open(url)
            }

            var interval = max(info.interval, 2)
            let deadline = Date().addingTimeInterval(TimeInterval(info.expiresIn))
            while Date() < deadline {
                try Task.checkCancellation()
                try await Task.sleep(for: .seconds(Int(interval)))
                if let token = try await core.pollDeviceFlow() {
                    deviceCode = nil
                    loggedIn = true
                    username = token.login
                    await refreshSounds()
                    await refreshVocabulary()
                    return
                }
                // Twitch may have answered "slow_down" and bumped the interval.
                do {
                    if let next = try await core.deviceFlowInterval() {
                        interval = max(next, 2)
                    }
                } catch {
                    // Keep the previous interval.
                }
            }
            deviceCode = nil
            loginError = "Authentication timed out. Please try again."
        } catch is CancellationError {
            deviceCode = nil
            loginError = nil
        } catch {
            deviceCode = nil
            loginError = error.localizedDescription
        }
    }

    func openVerificationURL() {
        guard let deviceCode, let url = URL(string: deviceCode.verificationUri) else { return }
        NSWorkspace.shared.open(url)
    }

    func logout() async {
        try? await core.stopChat()
        try? await core.clearAuth()
        loggedIn = false
        username = nil
        deviceCode = nil
        translations.removeAll()
        lookups.removeAll()
        seenUsers.removeAll()
    }

    // MARK: - Chat listener

    func startListener() async {
        guard !isBusy else { return }
        isBusy = true
        defer { isBusy = false }

        do {
            let channel = targetChannel.trimmingCharacters(in: .whitespacesAndNewlines)
            try await core.startChat(channel: channel.isEmpty ? nil : channel)
            if !channel.isEmpty {
                try? await core.rememberChannel(channel)
            }
            status = (try? await core.chatStatus()) ?? status
            toast = nil
        } catch {
            showError(error.localizedDescription)
        }
    }

    func stopListener() async {
        guard !isBusy else { return }
        isBusy = true
        defer { isBusy = false }

        do {
            try await core.stopChat()
            status = (try? await core.chatStatus()) ?? status
        } catch {
            showError(error.localizedDescription)
        }
    }

    func setTranslationEnabled(_ enabled: Bool) async {
        do {
            try await core.toggleTranslation(enabled: enabled)
            status = (try? await core.chatStatus()) ?? status
        } catch {
            showError(error.localizedDescription)
        }
    }

    // MARK: - Gemini

    /// Returns true when the key was saved.
    func saveGeminiKey(_ key: String) async -> Bool {
        do {
            try await core.setGeminiAPIKey(key)
            geminiKeyConfigured = (try? await core.hasGeminiAPIKey()) ?? false
            return true
        } catch {
            showError(error.localizedDescription)
            return false
        }
    }

    // MARK: - Sounds

    func refreshSounds() async {
        do { soundFirst = try await core.sound(slot: "first") } catch { soundFirst = nil }
        do { soundRemaining = try await core.sound(slot: "remaining") } catch {
            soundRemaining = nil
        }
    }

    func uploadSound(slot: String, url: URL) async {
        let accessing = url.startAccessingSecurityScopedResource()
        defer { if accessing { url.stopAccessingSecurityScopedResource() } }

        do {
            let data = try Data(contentsOf: url)
            try await core.saveSound(
                slot: slot,
                fileName: url.lastPathComponent,
                data: data
            )
            await refreshSounds()
            showSuccess("Sound saved.")
        } catch {
            showError(error.localizedDescription)
        }
    }

    func deleteSound(slot: String) async {
        do {
            try await core.deleteSound(slot: slot)
            await refreshSounds()
        } catch {
            showError(error.localizedDescription)
        }
    }

    func previewSound(slot: String) {
        let sound = slot == "first" ? soundFirst : soundRemaining
        let volume = slot == "first" ? volumeFirst : volumeRemaining
        guard let sound else { return }
        Task { try? await core.playSound(path: sound.path, volume: volume) }
    }

    func sound(for slot: String) -> SoundFile? {
        slot == "first" ? soundFirst : soundRemaining
    }

    func volume(for slot: String) -> Double {
        slot == "first" ? volumeFirst : volumeRemaining
    }

    func setVolume(slot: String, value: Double) {
        let clamped = min(max(value, 0.0), 1.0)
        if slot == "first" {
            volumeFirst = clamped
            UserDefaults.standard.set(clamped, forKey: "volumeFirst")
        } else {
            volumeRemaining = clamped
            UserDefaults.standard.set(clamped, forKey: "volumeRemaining")
        }
    }

    private struct LegacyVolumes: Decodable {
        let first: Double
        let remaining: Double
    }

    private func loadVolumes() {
        let defaults = UserDefaults.standard

        // One-time import from the previous app's volumes.json.
        if defaults.object(forKey: "volumeFirst") == nil,
            defaults.object(forKey: "volumeRemaining") == nil
        {
            let legacy = FileManager.default.homeDirectoryForCurrentUser
                .appendingPathComponent("Library/Application Support/im.sush.streaid/volumes.json")
            if let data = try? Data(contentsOf: legacy),
                let volumes = try? JSONDecoder().decode(LegacyVolumes.self, from: data)
            {
                defaults.set(volumes.first, forKey: "volumeFirst")
                defaults.set(volumes.remaining, forKey: "volumeRemaining")
            }
        }

        if defaults.object(forKey: "volumeFirst") != nil {
            volumeFirst = defaults.double(forKey: "volumeFirst")
        }
        if defaults.object(forKey: "volumeRemaining") != nil {
            volumeRemaining = defaults.double(forKey: "volumeRemaining")
        }
    }

    // MARK: - Local model

    func setLocalModel(enabled: Bool) async {
        guard !localModelBusy else { return }
        localModelBusy = true
        defer { localModelBusy = false }

        do {
            try await core.setLocalModelEnabled(enabled)
        } catch {
            showError(error.localizedDescription)
        }
        bonsai = try? await core.localModelStatus()
    }

    func setLocalModelVariant(_ variant: String) async {
        do {
            try await core.setLocalModelVariant(variant)
            bonsai = try? await core.localModelStatus()
        } catch {
            showError(error.localizedDescription)
        }
    }

    // MARK: - Vocabulary

    func refreshVocabulary() async {
        do { vocabSummary = try await core.vocabularySummary() } catch { vocabSummary = nil }
    }

    func analyzeVocabulary() async {
        guard !vocabAnalyzing else { return }
        vocabAnalyzing = true
        defer { vocabAnalyzing = false }

        do {
            vocabAnalysis = try await core.analyzeVocabulary()
        } catch {
            showError(error.localizedDescription)
        }
    }

    func clearVocabulary() async {
        do {
            try await core.clearVocabulary()
            vocabAnalysis = []
            await refreshVocabulary()
        } catch {
            showError(error.localizedDescription)
        }
    }

    // MARK: - Overlay

    func copyOverlayURL() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(overlayURL, forType: .string)
        showSuccess("Overlay URL copied.")
    }
}
