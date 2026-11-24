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
        case .dashboard: return L10n.t("Dashboard")
        case .chatters: return L10n.t("Chatters")
        case .raiders: return L10n.t("Raiders")
        case .commands: return L10n.t("Commands")
        case .userMemo: return L10n.t("User Memo")
        case .modelTest: return L10n.t("Model Test")
        case .config: return L10n.t("Config")
        case .vocabulary: return L10n.t("Vocabulary")
        case .log: return L10n.t("Log")
        case .credits: return L10n.t("Credits")
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
    @Published var settings = AppSettings.default
    @Published var settingsLoaded = false
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
        applyLocale()
        loadVolumes()

        if Self.demoMode {
            applyDemoData()
        } else {
            loadNotificationSettings()
            NotificationService.shared.setup()
            startEventPump()
            startStatusPolling()
            Task { [weak self] in await self?.bootstrap() }
        }
    }

    /// `STREAID_DEMO=1` shows populated sample data for screenshots/UI work.
    static var demoMode: Bool {
        ProcessInfo.processInfo.environment["STREAID_DEMO"] == "1"
    }

    private func applyDemoData() {
        let now = Date()
        func timestamp(_ offset: TimeInterval) -> String {
            ISO8601DateFormatter().string(from: now.addingTimeInterval(offset))
        }

        loggedIn = true
        username = "sushat4692"
        clientID = "demo-client-id"
        targetChannel = "sushat4692"
        page = .dashboard
        isBusy = false
        toast = nil

        status = ChatStatus(
            connected: true,
            isRunning: true,
            isEnabled: true,
            reconnecting: false,
            channel: "sushat4692",
            lastTargetChannel: "sushat4692"
        )
        capabilities = StreaidCapabilities(
            apiVersion: 1,
            os: "macos",
            platform: "macOS",
            localModelSupported: true,
            appDataDir: "~/Library/Application Support/im.sush.streaid",
            overlayUrl: "http://localhost:4242"
        )
        bonsai = BonsaiStatus(
            enabled: true,
            runtimeFound: true,
            activeModel: "8b",
            models: [
                BonsaiModelStatus(name: "8b", running: true, modelFound: true),
                BonsaiModelStatus(name: "4b", running: false, modelFound: true),
            ]
        )
        geminiKeyConfigured = true
        notificationsEnabled = true
        settings = AppSettings(
            locale: "en",
            notificationsEnabled: true,
            shoutoutMessage: "Please check this Recommended Streamer \"%username%\". %url% The last streaming was \"%category%\".",
            shoutoutNotFound: "Target user \"%user_id%\" wasn't found, please check again.",
            shoutoutFailed: "Failed to get Channel information of \"%username%\" channel, please try again later.",
            shoutoutInfoLength: 8,
            discordWebhook: "https://discord.com/api/webhooks/demo"
        )
        settingsLoaded = true
        applyLocale()

        chatters = [
            Chatter(id: "u1", username: "kiritan", displayName: "Kiritan", color: "#FF8A65", firstSeen: now.addingTimeInterval(-420)),
            Chatter(id: "u2", username: "sush", displayName: "SUSH", color: "#9146FF", firstSeen: now.addingTimeInterval(-380)),
            Chatter(id: "u3", username: "mochi", displayName: "Mochi", color: "#4ADE80", firstSeen: now.addingTimeInterval(-240)),
            Chatter(id: "u4", username: "aoi", displayName: "Aoi", color: "#60A5FA", firstSeen: now.addingTimeInterval(-120)),
            Chatter(id: "u5", username: "tomo", displayName: "Tomo", color: "#FACC15", firstSeen: now.addingTimeInterval(-60)),
        ]

        raiders = [
            RaiderRecord(id: "r1", channel: "sushat4692", username: "raider_one", displayName: "RaiderOne", viewers: 128, timestamp: timestamp(-300)),
            RaiderRecord(id: "r2", channel: "sushat4692", username: "night_owl", displayName: "NightOwl", viewers: 42, timestamp: timestamp(-900)),
        ]

        commands = [
            CommandRecord(id: "c1", command: "hello", body: "Welcome to the stream! Enjoy your stay.", memo: "Greeting", allow: "everyone", createdAt: timestamp(-86400 * 5)),
            CommandRecord(id: "c2", command: "socials", body: "Twitter: @sushat4692 / GitHub: sushat4692", memo: "Links", allow: "everyone", createdAt: timestamp(-86400 * 3)),
            CommandRecord(id: "c3", command: "discord", body: "Join the community Discord for updates and chat.", memo: "Community", allow: "mod", createdAt: timestamp(-86400)),
        ]

        memos = [
            MemoRecord(id: "m1", username: "kiritan", nickname: "Kiritan", memo: "Regular viewer. Likes retro games and coffee.", createdAt: timestamp(-86400 * 10), updatedAt: timestamp(-3600)),
            MemoRecord(id: "m2", username: "night_owl", nickname: "NightOwl", memo: "Raids often on weekends.", createdAt: timestamp(-86400 * 4), updatedAt: timestamp(-1800)),
        ]

        translations = [
            TranslationEvent(
                originalUser: "kiritan",
                originalMessage: "今日の配信めっちゃ面白かった！",
                suggestions: [
                    TranslationSuggestion(text: "That stream was so much fun!", formality: "casual"),
                    TranslationSuggestion(text: "Today's stream was really interesting.", formality: "neutral"),
                    TranslationSuggestion(text: "I found today's broadcast quite enjoyable.", formality: "formal"),
                ],
                points: [
                    "「めっちゃ」is a casual intensifier",
                    "「面白かった」is the past tense of 面白い (interesting/fun)",
                ],
                timestamp: timestamp(-45),
                sourceLang: "Japanese",
                targetLang: "English"
            ),
            TranslationEvent(
                originalUser: "mochi",
                originalMessage: "I'll be there for the next stream!",
                suggestions: [
                    TranslationSuggestion(text: "次の配信も見に行くね！", formality: "casual"),
                    TranslationSuggestion(text: "次の配信にも参加します。", formality: "neutral"),
                    TranslationSuggestion(text: "次回の配信も拝見いたします。", formality: "formal"),
                ],
                points: [
                    "Casual future intent with 〜に行く",
                    "Adds friendly reassurance",
                ],
                timestamp: timestamp(-240),
                sourceLang: "English",
                targetLang: "Japanese"
            ),
        ]

        lookups = [
            DictionaryEvent(
                originalUser: "sush",
                originalWord: "serendipity",
                word: "serendipity",
                meaning: "The occurrence of events by chance in a happy or beneficial way.",
                examples: ["Meeting her was pure serendipity."],
                similarWords: ["chance", "fortune", "luck"],
                timestamp: timestamp(-120),
                sourceLang: "English",
                targetLang: "Japanese"
            ),
            DictionaryEvent(
                originalUser: "kiritan",
                originalWord: "木漏れ日",
                word: "木漏れ日",
                meaning: "Sunlight filtering through the leaves of trees.",
                examples: ["木漏れ日がとてもきれいだった。"],
                similarWords: ["日差し", "光", "木陰"],
                timestamp: timestamp(-600),
                sourceLang: "Japanese",
                targetLang: "English"
            ),
        ]

        vocabSummary = VocabularySummary(
            totalWords: 128,
            totalLookups: 342,
            topWords: [],
            ambiguous: []
        )
    }

    // MARK: - Derived

    var isRunning: Bool { status.isRunning }
    var translationEnabled: Bool { status.isEnabled }
    var localModelSupported: Bool { capabilities?.localModelSupported ?? true }
    var localModelEnabled: Bool { bonsai?.enabled ?? false }
    var activeModel: String { bonsai?.activeModel ?? "8b" }
    var overlayURL: String { capabilities?.overlayUrl ?? "http://localhost:4242" }
    var alertURL: String {
        let base = overlayURL.hasSuffix("/") ? String(overlayURL.dropLast()) : overlayURL
        let suffix = resolvedLocale == "ja" ? "?lang=ja" : ""
        return "\(base)/alert\(suffix)"
    }

    /// "system" resolves from the OS preferred language.
    var resolvedLocale: String {
        // UI-test / screenshot override.
        if let forced = ProcessInfo.processInfo.environment["STREAID_FORCE_LOCALE"] {
            return forced == "ja" ? "ja" : "en"
        }
        if settings.locale == "system" {
            return Locale.preferredLanguages.first?.hasPrefix("ja") == true ? "ja" : "en"
        }
        return settings.locale == "ja" ? "ja" : "en"
    }

    func applyLocale() {
        L10n.locale = resolvedLocale
    }

    func setLocale(_ locale: String) {
        settings.locale = locale
        applyLocale()
        Task {
            if self.settingsLoaded {
                _ = await self.saveSettings()
            }
        }
    }

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
            await refreshSettings()
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
                        title: L10n.t("Chatter has come"),
                        body: L10n.f("Thank you for coming \"%@\"", value.displayName)
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
                    title: L10n.f("%d Raider has come", Int(value.viewers)),
                    body: L10n.f("Thank you for raiding \"%@\"", value.fromDisplayName)
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
                self?.showSuccess(L10n.t("Client ID saved."))
            } catch {
                self?.showError(error.localizedDescription)
            }
        }
    }

    func authenticate() async {
        let id = clientID.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !id.isEmpty else {
            loginError = L10n.t("Enter your Twitch Client ID first.")
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
            loginError = L10n.t("Authentication timed out. Please try again.")
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
            showSuccess(L10n.t("Sound saved."))
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
        settings.notificationsEnabled = enabled
        Task {
            if self.settingsLoaded {
                _ = await self.saveSettings()
            }
        }
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

    // MARK: - Settings / shoutout

    func refreshSettings() async {
        do {
            let loaded = try await core.getSettings()
            settings = loaded
            settingsLoaded = true
            applyLocale()

            // UserDefaults is the source of truth for the notification toggle
            // if it was already set (Sprint 1).
            let defaults = UserDefaults.standard
            if defaults.object(forKey: "notificationsEnabled") == nil {
                notificationsEnabled = loaded.notificationsEnabled
            } else {
                settings.notificationsEnabled = notificationsEnabled
            }
        } catch {
            showError(error.localizedDescription)
        }
    }

    func saveSettings() async -> Bool {
        do {
            settings = try await core.saveSettings(settings)
            return true
        } catch {
            showError(error.localizedDescription)
            return false
        }
    }

    func saveShoutoutSettings(
        message: String,
        notFound: String,
        failed: String,
        infoLength: UInt64
    ) async -> Bool {
        var copy = settings
        copy.shoutoutMessage = message
        copy.shoutoutNotFound = notFound
        copy.shoutoutFailed = failed
        copy.shoutoutInfoLength = infoLength
        settings = copy
        let ok = await saveSettings()
        if ok { showSuccess(L10n.t("Shoutout settings saved.")) }
        return ok
    }

    func saveDiscordWebhook(_ url: String) async -> Bool {
        var copy = settings
        copy.discordWebhook = url.trimmingCharacters(in: .whitespacesAndNewlines)
        settings = copy
        let ok = await saveSettings()
        if ok { showSuccess(L10n.t("Discord webhook saved.")) }
        return ok
    }

    func runShoutout(username: String, mode: String? = nil) async {
        do {
            _ = try await core.runShoutout(username: username, mode: mode)
        } catch {
            showError(error.localizedDescription)
        }
    }

    func copyAlertURL() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(alertURL, forType: .string)
        showSuccess(L10n.t("Alert URL copied."))
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
        showSuccess(L10n.t("Overlay URL copied."))
    }
}
