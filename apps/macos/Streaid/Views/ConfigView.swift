import AppKit
import SwiftUI
import UniformTypeIdentifiers

struct ConfigView: View {
    @EnvironmentObject private var state: AppState

    @State private var geminiKey = ""
    @State private var showImporter = false
    @State private var importSlot = "chatter"

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            PageHeader("Config", subtitle: "Credentials, chat behaviour, sounds and the OBS overlay.")

            translationSettings
            chatListener
            localModel
            soundSettings
            overlaySettings
        }
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

    // MARK: - Translation

    private var translationSettings: some View {
        SectionCard(
            "Translation Settings",
            subtitle: "Gemini is used for !ts and !d unless the local model is enabled."
        ) {
            LabeledField("Gemini API Key") {
                HStack(spacing: 8) {
                    SecureField(
                        state.geminiKeyConfigured
                            ? "•••••••• (saved in Keychain)"
                            : "Enter your Gemini API key",
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

                    Button("Save API Key") {
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
                    text: state.geminiKeyConfigured ? "Configured" : "Not configured",
                    color: state.geminiKeyConfigured ? Theme.green : Theme.yellow
                )
                Text("Stored in the macOS Keychain.")
                    .font(.caption2)
                    .foregroundStyle(Theme.textDim)
                Spacer()
                Link(
                    "Get a key from Google AI Studio",
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
            "Chat Listener",
            subtitle: "Blank channel = monitor the authenticated account's own channel."
        ) {
            LabeledField("Target Channel") {
                TextField("your_channel", text: $state.targetChannel)
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
                    "Enable !ts / !d",
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
                    Text(state.isRunning ? "Stop Listening" : "Start Listening")
                }
                .buttonStyle(PrimaryButtonStyle(compact: true))
                .disabled(state.isBusy)
            }
        }
    }

    // MARK: - Local model

    @ViewBuilder
    private var localModel: some View {
        if state.localModelSupported {
            SectionCard(
                "Local Model (Bonsai)",
                subtitle: "Answer !ts and !d on-device with MLX. No API key required."
            ) {
                HStack {
                    Toggle(
                        "Enable Local Model",
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
                            Text("Starting local model… (up to 90s)")
                                .font(.caption2)
                                .foregroundStyle(Theme.textMuted)
                        }
                    }

                    Spacer()

                    Picker(
                        "Chat model",
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
                            text: bonsai.runtimeFound ? "Runtime ready" : "Runtime missing",
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
                            "Run scripts/setup-bonsai.sh to download the MLX runtime and models."
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
        if model.running { return "\(name) running" }
        if model.modelFound { return "\(name) ready" }
        return "\(name) missing"
    }

    // MARK: - Sounds

    private var soundSettings: some View {
        SectionCard(
            "Sound Notifications",
            subtitle: "First-message tracking resets on app restart."
        ) {
            Toggle(
                "Desktop notifications",
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
                title: "New Chatter Sound",
                subtitle: "Plays the first time a user speaks in this session."
            )
            Divider().overlay(Theme.border)
            soundSlot(
                slot: "chat",
                title: "Returning Chatter Sound",
                subtitle: "Plays for every later message from that user."
            )
            Divider().overlay(Theme.border)
            soundSlot(
                slot: "raid",
                title: "Raid Sound",
                subtitle: "Plays when someone raids your channel."
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
                    Text(file?.fileName ?? "No file set")
                        .font(.caption2)
                        .foregroundStyle(Theme.textDim)
                        .lineLimit(1)
                }
                Spacer()

                Button("Choose") {
                    importSlot = slot
                    showImporter = true
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))

                Button("Preview") {
                    state.previewSound(slot: slot)
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))
                .disabled(file == nil)

                Button("Clear") {
                    Task { await state.deleteSound(slot: slot) }
                }
                .buttonStyle(DangerButtonStyle())
                .disabled(file == nil)
            }

            HStack(spacing: 10) {
                Text("Volume")
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

    // MARK: - Overlay

    private var overlaySettings: some View {
        SectionCard(
            "OBS Overlay",
            subtitle: "Add a Browser Source in OBS and point it at this URL."
        ) {
            HStack(spacing: 8) {
                Text(state.overlayURL)
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

                Button("Copy") {
                    state.copyOverlayURL()
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))

                Button("Open") {
                    if let url = URL(string: state.overlayURL) {
                        NSWorkspace.shared.open(url)
                    }
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))
            }

            Text("Recommended size: 800×300 · enable a transparent background in OBS.")
                .font(.caption2)
                .foregroundStyle(Theme.textDim)
        }
    }
}
