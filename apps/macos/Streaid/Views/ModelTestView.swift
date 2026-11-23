import SwiftUI

struct ModelTestView: View {
    @EnvironmentObject private var state: AppState

    @State private var text = ""
    @State private var provider = "gemini"
    @State private var mode = "ts"
    @State private var result: ModelTestResult?
    @State private var running = false
    @State private var error: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            PageHeader(
                L10n.t("Model Test"),
                subtitle: L10n.t("Try a translation or dictionary lookup without posting to Twitch.")
            )

            SectionCard(L10n.t("Input")) {
                TextEditor(text: $text)
                    .font(.system(size: 13))
                    .scrollContentBackground(.hidden)
                    .padding(8)
                    .frame(minHeight: 110)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )

                HStack(spacing: 14) {
                    Picker(L10n.t("Mode"), selection: $mode) {
                        Text(L10n.t("Translation")).tag("ts")
                        Text(L10n.t("Dictionary")).tag("d")
                    }
                    .pickerStyle(.segmented)
                    .frame(width: 220)
                    .labelsHidden()

                    Picker(L10n.t("Provider"), selection: $provider) {
                        Text("Gemini").tag("gemini")
                        Text("Bonsai 8B").tag("bonsai-8b")
                        Text("Bonsai 4B").tag("bonsai-4b")
                    }
                    .frame(width: 180)

                    Spacer()

                    Button {
                        run()
                    } label: {
                        HStack(spacing: 7) {
                            if running {
                                ProgressView().controlSize(.small)
                            }
                            Text(running ? L10n.t("Running…") : L10n.t("Run Test"))
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(
                        running
                            || text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                            || !providerAvailable
                    )
                }

                if !providerAvailable {
                    Text(L10n.t("Enable the local model in Config before using a Bonsai provider."))
                        .font(.caption2)
                        .foregroundStyle(Theme.yellow)
                }

                if mode == "ts" {
                    Text(L10n.t("Japanese input returns English suggestions (and vice versa)."))
                        .font(.caption2)
                        .foregroundStyle(Theme.textDim)
                } else {
                    Text(L10n.t("Only the first word is looked up."))
                        .font(.caption2)
                        .foregroundStyle(Theme.textDim)
                }
            }

            SectionCard(L10n.t("Result")) {
                if running {
                    HStack(spacing: 8) {
                        ProgressView().controlSize(.small)
                        Text(L10n.t("Asking the model…"))
                            .font(.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                    .padding(.vertical, 12)
                } else if let error {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(Theme.red)
                        .fixedSize(horizontal: false, vertical: true)
                } else if let result {
                    resultView(result)
                } else {
                    EmptyState(
                        icon: "wand.and.stars",
                        title: L10n.t("No result yet"),
                        message: L10n.t("Enter text above and run a test.")
                    )
                }
            }
        }
    }

    @ViewBuilder
    private func resultView(_ result: ModelTestResult) -> some View {
        switch result {
        case .ts(let value):
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Pill(
                        text: "\(value.sourceLang) → \(value.targetLang)",
                        color: Theme.blue
                    )
                    Spacer()
                    Text("\(value.durationMs) ms")
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(Theme.textDim)
                }

                ForEach(Array(value.suggestions.enumerated()), id: \.offset) { _, suggestion in
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Pill(text: L10n.t(suggestion.formality), color: formalityColor(suggestion.formality))
                        Text(suggestion.text)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Theme.textPrimary)
                            .textSelection(.enabled)
                    }
                }

                if !value.points.isEmpty {
                    Divider().overlay(Theme.border)
                    ForEach(Array(value.points.enumerated()), id: \.offset) { _, point in
                        Text("• \(point)")
                            .font(.caption)
                            .foregroundStyle(Theme.textDim)
                    }
                }
            }

        case .d(let value):
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text(value.word)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(Theme.textPrimary)
                        .textSelection(.enabled)
                    Spacer()
                    Text("\(value.durationMs) ms")
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(Theme.textDim)
                }

                Text(value.meaning)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textMuted)
                    .fixedSize(horizontal: false, vertical: true)

                if !value.examples.isEmpty {
                    Text(L10n.t("Examples"))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Theme.textDim)
                    ForEach(Array(value.examples.enumerated()), id: \.offset) { _, example in
                        Text("“\(example)”")
                            .font(.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                }

                if !value.similarWords.isEmpty {
                    HStack(spacing: 5) {
                        Text(L10n.t("Similar:"))
                            .font(.caption2)
                            .foregroundStyle(Theme.textDim)
                        ForEach(value.similarWords, id: \.self) { word in
                            Pill(text: word, color: Theme.purpleLight)
                        }
                    }
                }
            }
        }
    }

    private func run() {
        let input = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !input.isEmpty, !running else { return }

        running = true
        error = nil
        result = nil

        Task { @MainActor in
            do {
                result = try await state.core.testModel(
                    text: input,
                    provider: provider,
                    mode: mode
                )
            } catch {
                self.error = error.localizedDescription
            }
            running = false
        }
    }

    private var providerAvailable: Bool {
        provider == "gemini" || state.localModelEnabled
    }

    private func formalityColor(_ value: String) -> Color {
        switch value {
        case "casual": return Theme.green
        case "formal": return Theme.blue
        default: return Theme.purpleLight
        }
    }
}
