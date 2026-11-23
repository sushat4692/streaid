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
    case chatters
    case raiders
    case commands
    case userMemo
    case modelTest
    case config
    case vocabulary
    case log
    case credits

    var id: String { rawValue }

    var title: String {
        switch self {
        case .dashboard: return "Dashboard"
        case .chatters: return "Chatters"
        case .raiders: return "Raiders"
        case .commands: return "Commands"
        case .userMemo: return "User Memo"
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
        case .chatters: return "person.2"
        case .raiders: return "tornado"
        case .commands: return "terminal"
        case .userMemo: return "note.text"
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
    @Published var chatters: [Chatter] = []
    @Published var raiders: [RaiderRecord] = []
    @Published var commands: [CommandRecord] = []
    @Published var memos: [MemoRecord] = []
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
    @Published var notificationsEnabled = true
    @Published var soundChatter: SoundFile?
    @Published var soundChat: SoundFile?
    @Published var soundRaid: SoundFile?
    @Published var volumeChatter: Double = 1.0
    @Published var volumeChat: Double = 1.0
    @Published var volumeRaid: Double = 1.0

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
        loadNotificationSettings()
        NotificationService.shared.setup()
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
            await refreshRaiders()
            await refreshCommands()
            await refreshMemos()
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

            if isFirst {
                chatters.insert(
                    Chatter(
                        id: value.userId ?? value.username,
                        username: value.username,
                        displayName: value.displayName,
                        color: value.color,
                        firstSeen: Date()
                    ),
                    at: 0
                )
                if notificationsEnabled {
                    NotificationService.shared.post(
                        title: "Chatter has come",
                        body: "Thank you for coming \"\(value.displayName)\""
                    )
                }
            }

            let sound = isFirst ? soundChatter : soundChat
            let volume = isFirst ? volumeChatter : volumeChat
            if let sound {
                Task { try? await core.playSound(path: sound.path, volume: volume) }
            }
        case .raid(let value):
            if let sound = soundRaid {
                Task { try? await core.playSound(path: sound.path, volume: volumeRaid) }
            }
            if notificationsEnabled {
                NotificationService.shared.post(
                    title: "\(value.viewers) Raider has come",
                    body: "Thank you for raiding \"\(value.fromDisplayName)\""
                )
            }
            Task { [weak self] in await self?.refreshRaiders() }
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
        chatters.removeAll()
        raiders.removeAll()
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
        do { soundChatter = try await core.sound(slot: "chatter") } catch {
            soundChatter = nil
        }
        do { soundChat = try await core.sound(slot: "chat") } catch { soundChat = nil }
        do { soundRaid = try await core.sound(slot: "raid") } catch { soundRaid = nil }
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
        let sound = sound(for: slot)
        let volume = volume(for: slot)
        guard let sound else { return }
        Task { try? await core.playSound(path: sound.path, volume: volume) }
    }

    func sound(for slot: String) -> SoundFile? {
        switch slot {
        case "chatter": return soundChatter
        case "chat": return soundChat
        case "raid": return soundRaid
        default: return nil
        }
    }

    func volume(for slot: String) -> Double {
        switch slot {
        case "chatter": return volumeChatter
        case "chat": return volumeChat
        case "raid": return volumeRaid
        default: return 1.0
        }
    }

    func setVolume(slot: String, value: Double) {
        let clamped = min(max(value, 0.0), 1.0)
        switch slot {
        case "chatter":
            volumeChatter = clamped
            UserDefaults.standard.set(clamped, forKey: "volumeChatter")
        case "chat":
            volumeChat = clamped
            UserDefaults.standard.set(clamped, forKey: "volumeChat")
        case "raid":
            volumeRaid = clamped
            UserDefaults.standard.set(clamped, forKey: "volumeRaid")
        default:
            break
        }
    }

    func setNotificationsEnabled(_ enabled: Bool) {
        notificationsEnabled = enabled
        UserDefaults.standard.set(enabled, forKey: "notificationsEnabled")
    }

    private struct LegacyVolumes: Decodable {
        let first: Double
        let remaining: Double
    }

    private func loadVolumes() {
        let defaults = UserDefaults.standard

        // Carry over the previous slot names.
        if defaults.object(forKey: "volumeChatter") == nil,
            let old = defaults.object(forKey: "volumeFirst") as? Double
        {
            defaults.set(old, forKey: "volumeChatter")
        }
        if defaults.object(forKey: "volumeChat") == nil,
            let old = defaults.object(forKey: "volumeRemaining") as? Double
        {
            defaults.set(old, forKey: "volumeChat")
        }

        // One-time import from the previous app's volumes.json.
        if defaults.object(forKey: "volumeChatter") == nil,
            defaults.object(forKey: "volumeChat") == nil
        {
            let legacy = FileManager.default.homeDirectoryForCurrentUser
                .appendingPathComponent("Library/Application Support/im.sush.streaid/volumes.json")
            if let data = try? Data(contentsOf: legacy),
                let volumes = try? JSONDecoder().decode(LegacyVolumes.self, from: data)
            {
                defaults.set(volumes.first, forKey: "volumeChatter")
                defaults.set(volumes.remaining, forKey: "volumeChat")
            }
        }

        if defaults.object(forKey: "volumeChatter") != nil {
            volumeChatter = defaults.double(forKey: "volumeChatter")
        }
        if defaults.object(forKey: "volumeChat") != nil {
            volumeChat = defaults.double(forKey: "volumeChat")
        }
        if defaults.object(forKey: "volumeRaid") != nil {
            volumeRaid = defaults.double(forKey: "volumeRaid")
        }
    }

    private func loadNotificationSettings() {
        let defaults = UserDefaults.standard
        if defaults.object(forKey: "notificationsEnabled") != nil {
            notificationsEnabled = defaults.bool(forKey: "notificationsEnabled")
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

    // MARK: - Chatters / raiders

    func removeChatter(_ chatter: Chatter) {
        chatters.removeAll { $0.id == chatter.id }
        seenUsers.remove(chatter.username)
    }

    func refreshRaiders() async {
        do {
            raiders = try await core.listRaiders()
        } catch {
            showError(error.localizedDescription)
        }
    }

    func deleteRaider(id: String) async {
        do {
            raiders = try await core.deleteRaider(id: id)
        } catch {
            showError(error.localizedDescription)
        }
    }

    // MARK: - Commands

    func refreshCommands() async {
        do {
            commands = try await core.listCommands()
        } catch {
            showError(error.localizedDescription)
        }
    }

    func saveCommand(
        id: String,
        command: String,
        body: String,
        memo: String,
        allow: String
    ) async -> Bool {
        do {
            commands = try await core.saveCommand(
                id: id,
                command: command,
                body: body,
                memo: memo,
                allow: allow
            )
            return true
        } catch {
            showError(error.localizedDescription)
            return false
        }
    }

    func deleteCommand(id: String) async {
        do {
            commands = try await core.deleteCommand(id: id)
        } catch {
            showError(error.localizedDescription)
        }
    }

    // MARK: - User memos

    func refreshMemos() async {
        do {
            memos = try await core.listMemos()
        } catch {
            showError(error.localizedDescription)
        }
    }

    func saveMemo(
        id: String,
        username: String,
        nickname: String,
        memo: String
    ) async -> Bool {
        do {
            memos = try await core.saveMemo(
                id: id,
                username: username,
                nickname: nickname,
                memo: memo
            )
            return true
        } catch {
            showError(error.localizedDescription)
            return false
        }
    }

    func deleteMemo(id: String) async {
        do {
            memos = try await core.deleteMemo(id: id)
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
