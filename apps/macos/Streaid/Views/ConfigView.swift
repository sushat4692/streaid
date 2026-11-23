import AppKit
import SwiftUI
import UniformTypeIdentifiers

struct ConfigView: View {
    @EnvironmentObject private var state: AppState

    @State private var geminiKey = ""
    @State private var showImporter = false
    @State private var importSlot = "chatter"

    @State private var shoutoutMessage = ""
    @State private var shoutoutNotFound = ""
    @State private var shoutoutFailed = ""
    @State private var shoutoutInfoLength: Double = 8
    @State private var savingShoutout = false
    @State private var discordWebhook = ""
    @State private var savingDiscord = false

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            PageHeader(L10n.t("Config"), subtitle: L10n.t("Credentials, chat behaviour, sounds and the OBS overlay."))

            languageSettings
            translationSettings
            chatListener
            shoutoutSettings
            localModel
            soundSettings
            discordSettings
            overlaySettings
        }
        .onAppear { syncShoutoutSettings() }
        .onChange(of: state.settingsLoaded) { _ in syncShoutoutSettings() }
        .fileImporter(
            isPresented: $showImporter,
            allowedContentTypes: [.audio],
            allowsMultipleSelection: false
        ) { result in
            guard case .success(let urls) = result, let url = urls.first else { return }
            let slot = importSlot
            Task { await state.uploadSound(slot: slot, url: url) }
        }
    }

    // MARK: - Language

    private var languageSettings: some View {
        SectionCard(
            L10n.t("Language"),
            subtitle: L10n.t("Choose the app language.")
        ) {
            Picker(
                L10n.t("Language"),
                selection: Binding(
                    get: { state.settings.locale },
                    set: { state.setLocale($0) }
                )
            ) {
                Text(L10n.t("System")).tag("system")
                Text(L10n.t("English")).tag("en")
                Text("日本語").tag("ja")
            }
            .pickerStyle(.segmented)
            .frame(width: 360)
            .labelsHidden()
        }
    }

    // MARK: - Translation

    private var translationSettings: some View {
        SectionCard(
            L10n.t("Translation Settings"),
            subtitle: L10n.t("Gemini is used for !ts and !d unless the local model is enabled.")
        ) {
            LabeledField(L10n.t("Gemini API Key")) {
                HStack(spacing: 8) {
                    SecureField(
                        state.geminiKeyConfigured
                            ? L10n.t("•••••••• (saved in Keychain)")
                            : L10n.t("Enter your Gemini API key"),
                        text: $geminiKey
                    )
                    .textFieldStyle(.plain)
                    .font(.system(size: 13, design: .monospaced))
                    .padding(10)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )

                    Button(L10n.t("Save API Key")) {
                        let key = geminiKey.trimmingCharacters(in: .whitespacesAndNewlines)
                        Task {
                            if await state.saveGeminiKey(key) {
                                geminiKey = ""
                            }
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle(compact: true))
                    .disabled(geminiKey.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }

            HStack(spacing: 8) {
                Pill(
                    text: state.geminiKeyConfigured ? L10n.t("Configured") : L10n.t("Not configured"),
                    color: state.geminiKeyConfigured ? Theme.green : Theme.yellow
                )
                Text(L10n.t("Stored in the macOS Keychain."))
                    .font(.caption2)
                    .foregroundStyle(Theme.textDim)
                Spacer()
                Link(
                    L10n.t("Get a key from Google AI Studio"),
                    destination: URL(string: "https://aistudio.google.com/app/apikey")!
                )
                .font(.caption)
                .tint(Theme.purpleLight)
            }
        }
    }

    // MARK: - Chat listener

    private var chatListener: some View {
        SectionCard(
            L10n.t("Chat Listener"),
            subtitle: L10n.t("Blank channel = monitor the authenticated account's own channel.")
        ) {
            LabeledField(L10n.t("Target Channel")) {
                TextField(L10n.t("your_channel"), text: $state.targetChannel)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13, design: .monospaced))
                    .padding(10)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }

            HStack(spacing: 10) {
                StatusPill(status: state.status)

                Toggle(
                    L10n.t("Enable !ts / !d"),
                    isOn: Binding(
                        get: { state.translationEnabled },
                        set: { value in
                            Task { await state.setTranslationEnabled(value) }
                        }
                    )
                )
                .toggleStyle(.switch)
                .tint(Theme.purple)
                .font(.caption)
                .foregroundStyle(Theme.textMuted)

                Spacer()

                Button {
                    Task {
                        if state.isRunning {
                            await state.stopListener()
                        } else {
                            await state.startListener()
                        }
                    }
                } label: {
                    Text(state.isRunning ? L10n.t("Stop Listening") : L10n.t("Start Listening"))
                }
                .buttonStyle(PrimaryButtonStyle(compact: true))
                .disabled(state.isBusy)
            }
        }
    }

    // MARK: - Shoutout

    private var shoutoutSettings: some View {
        SectionCard(
            L10n.t("Shoutout"),
            subtitle: L10n.t("Used by !so and the ShoutOut buttons. Placeholders: %username%, %user_id%, %url%, %category%.")
        ) {
            LabeledField(L10n.t("Shoutout Message")) {
                textArea($shoutoutMessage, minHeight: 64)
            }
            LabeledField(L10n.t("Not Found Message")) {
                textArea($shoutoutNotFound, minHeight: 48)
            }
            LabeledField(L10n.t("Failed Message")) {
                textArea($shoutoutFailed, minHeight: 48)
            }

            HStack(spacing: 10) {
                Text(L10n.t("Info Display Time"))
                    .font(.caption2)
                    .foregroundStyle(Theme.textDim)
                Slider(value: $shoutoutInfoLength, in: 0...60, step: 1)
                    .frame(width: 220)
                Text("\(Int(shoutoutInfoLength))s")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(Theme.textDim)
                Spacer()
                Button(L10n.t("Reset to Defaults")) {
                    applyDefaultShoutout()
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))
                .disabled(savingShoutout)

                Button {
                    saveShoutout()
                } label: {
                    if savingShoutout {
                        ProgressView().controlSize(.small)
                    } else {
                        Text(L10n.t("Save Shoutout Settings"))
                    }
                }
                .buttonStyle(PrimaryButtonStyle(compact: true))
                .disabled(savingShoutout)
            }
        }
    }

    private func textArea(_ text: Binding<String>, minHeight: CGFloat) -> some View {
        TextEditor(text: text)
            .font(.system(size: 13))
            .scrollContentBackground(.hidden)
            .padding(8)
            .frame(minHeight: minHeight)
            .background(Theme.cardStrong)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(Theme.border, lineWidth: 1)
            )
    }

    private func syncShoutoutSettings() {
        discordWebhook = state.settings.discordWebhook
        shoutoutMessage = state.settings.shoutoutMessage
        shoutoutNotFound = state.settings.shoutoutNotFound
        shoutoutFailed = state.settings.shoutoutFailed
        shoutoutInfoLength = Double(state.settings.shoutoutInfoLength)
    }

    private func applyDefaultShoutout() {
        let defaults = AppSettings.defaults(for: state.resolvedLocale)
        shoutoutMessage = defaults.shoutoutMessage
        shoutoutNotFound = defaults.shoutoutNotFound
        shoutoutFailed = defaults.shoutoutFailed
        shoutoutInfoLength = Double(defaults.shoutoutInfoLength)
    }

    private func saveShoutout() {
        savingShoutout = true
        Task {
            _ = await state.saveShoutoutSettings(
                message: shoutoutMessage,
                notFound: shoutoutNotFound,
                failed: shoutoutFailed,
                infoLength: UInt64(shoutoutInfoLength)
            )
            savingShoutout = false
        }
    }

    // MARK: - Local model

    @ViewBuilder
    private var localModel: some View {
        if state.localModelSupported {
            SectionCard(
                L10n.t("Local Model (Bonsai)"),
                subtitle: L10n.t("Answer !ts and !d on-device with MLX. No API key required.")
            ) {
                HStack {
                    Toggle(
                        L10n.t("Enable Local Model"),
                        isOn: Binding(
                            get: { state.localModelEnabled },
                            set: { value in
                                Task { await state.setLocalModel(enabled: value) }
                            }
                        )
                    )
                    .toggleStyle(.switch)
                    .tint(Theme.purple)
                    .font(.caption)
                    .disabled(state.localModelBusy)

                    if state.localModelBusy {
                        HStack(spacing: 7) {
                            ProgressView().controlSize(.small)
                            Text(L10n.t("Starting local model… (up to 90s)"))
                                .font(.caption2)
                                .foregroundStyle(Theme.textMuted)
                        }
                    }

                    Spacer()

                    Picker(
                        L10n.t("Chat model"),
                        selection: Binding(
                            get: { state.activeModel },
                            set: { value in
                                Task { await state.setLocalModelVariant(value) }
                            }
                        )
                    ) {
                        Text("8B").tag("8b")
                        Text("4B").tag("4b")
                    }
                    .pickerStyle(.segmented)
                    .frame(width: 140)
                    .disabled(!state.localModelEnabled || state.localModelBusy)
                }

                if let bonsai = state.bonsai {
                    HStack(spacing: 8) {
                        Pill(
                            text: bonsai.runtimeFound ? L10n.t("Runtime ready") : L10n.t("Runtime missing"),
                            color: bonsai.runtimeFound ? Theme.green : Theme.yellow
                        )
                        ForEach(bonsai.models, id: \.name) { model in
                            Pill(
                                text: modelStatus(model),
                                color: model.running
                                    ? Theme.green
                                    : (model.modelFound ? Theme.textDim : Theme.yellow)
                            )
                        }
                        Spacer()
                    }

                    if !bonsai.runtimeFound || bonsai.models.contains(where: { !$0.modelFound }) {
                        Text(
                            L10n.t("Run scripts/setup-bonsai.sh to download the MLX runtime and models.")
                        )
                        .font(.caption2)
                        .foregroundStyle(Theme.textDim)
                    }
                }
            }
        }
    }

    private func modelStatus(_ model: BonsaiModelStatus) -> String {
        let name = model.name.uppercased()
        if model.running { return L10n.f("%@ running", name) }
        if model.modelFound { return L10n.f("%@ ready", name) }
        return L10n.f("%@ missing", name)
    }

    // MARK: - Sounds

    private var soundSettings: some View {
        SectionCard(
            L10n.t("Sound Notifications"),
            subtitle: L10n.t("First-message tracking resets on app restart.")
        ) {
            Toggle(
                L10n.t("Desktop notifications"),
                isOn: Binding(
                    get: { state.notificationsEnabled },
                    set: { state.setNotificationsEnabled($0) }
                )
            )
            .toggleStyle(.switch)
            .tint(Theme.purple)
            .font(.caption)

            Divider().overlay(Theme.border)

            soundSlot(
                slot: "chatter",
                title: L10n.t("New Chatter Sound"),
                subtitle: L10n.t("Plays the first time a user speaks in this session.")
            )
            Divider().overlay(Theme.border)
            soundSlot(
                slot: "chat",
                title: L10n.t("Returning Chatter Sound"),
                subtitle: L10n.t("Plays for every later message from that user.")
            )
            Divider().overlay(Theme.border)
            soundSlot(
                slot: "raid",
                title: L10n.t("Raid Sound"),
                subtitle: L10n.t("Plays when someone raids your channel.")
            )
        }
    }

    private func soundSlot(slot: String, title: String, subtitle: String) -> some View {
        let file = state.sound(for: slot)
        let volume = state.volume(for: slot)

        return VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .center, spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Theme.textPrimary)
                    Text(file?.fileName ?? L10n.t("No file set"))
                        .font(.caption2)
                        .foregroundStyle(Theme.textDim)
                        .lineLimit(1)
                }
                Spacer()

                Button(L10n.t("Choose")) {
                    importSlot = slot
                    showImporter = true
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))

                Button(L10n.t("Preview")) {
                    state.previewSound(slot: slot)
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))
                .disabled(file == nil)

                Button(L10n.t("Clear")) {
                    Task { await state.deleteSound(slot: slot) }
                }
                .buttonStyle(DangerButtonStyle())
                .disabled(file == nil)
            }

            HStack(spacing: 10) {
                Text(L10n.t("Volume"))
                    .font(.caption2)
                    .foregroundStyle(Theme.textDim)
                Slider(
                    value: Binding(
                        get: { volume },
                        set: { state.setVolume(slot: slot, value: $0) }
                    ),
                    in: 0...1
                )
                .frame(width: 180)
                Text("\(Int(volume * 100))%")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(Theme.textDim)
                    .frame(width: 38, alignment: .trailing)
                Spacer()
            }

            Text(subtitle)
                .font(.caption2)
                .foregroundStyle(Theme.textDim)
        }
    }

    // MARK: - Discord

    private var discordSettings: some View {
        SectionCard(
            L10n.t("Discord Webhook"),
            subtitle: L10n.t("Post !d lookups to a Discord channel.")
        ) {
            LabeledField(L10n.t("Webhook URL")) {
                HStack(spacing: 8) {
                    TextField("https://discord.com/api/webhooks/...", text: $discordWebhook)
                        .textFieldStyle(.plain)
                        .font(.system(size: 12, design: .monospaced))
                        .padding(10)
                        .background(Theme.cardStrong)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .stroke(Theme.border, lineWidth: 1)
                        )

                    Button {
                        saveDiscord()
                    } label: {
                        if savingDiscord {
                            ProgressView().controlSize(.small)
                        } else {
                            Text(L10n.t("Save Webhook"))
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle(compact: true))
                    .disabled(savingDiscord)
                }
            }
        }
    }

    private func saveDiscord() {
        savingDiscord = true
        Task {
            _ = await state.saveDiscordWebhook(discordWebhook)
            savingDiscord = false
        }
    }

    // MARK: - Overlay

    private var overlaySettings: some View {
        SectionCard(
            L10n.t("OBS Overlay"),
            subtitle: L10n.t("Add two Browser Sources in OBS: one for translations, one for alerts.")
        ) {
            urlRow(
                label: L10n.t("Translation / Dictionary"),
                url: state.overlayURL,
                copy: { state.copyOverlayURL() }
            )
            Divider().overlay(Theme.border)
            urlRow(
                label: L10n.t("Shoutout Alert"),
                url: state.alertURL,
                copy: { state.copyAlertURL() }
            )

            Text(L10n.t("Enable a transparent background in OBS. Alert cards scale with the source size."))
                .font(.caption2)
                .foregroundStyle(Theme.textDim)
        }
    }

    private func urlRow(label: String, url: String, copy: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(Theme.textDim)
            HStack(spacing: 8) {
                Text(url)
                    .font(.system(size: 13, design: .monospaced))
                    .foregroundStyle(Theme.purpleLight)
                    .textSelection(.enabled)
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )

                Button(L10n.t("Copy"), action: copy)
                    .buttonStyle(SecondaryButtonStyle(compact: true))

                Button(L10n.t("Open")) {
                    if let url = URL(string: url) {
                        NSWorkspace.shared.open(url)
                    }
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))
            }
        }
    }
}
