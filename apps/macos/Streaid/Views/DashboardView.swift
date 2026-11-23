import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            PageHeader(
                L10n.t("Dashboard"),
                subtitle: L10n.t("Real-time Japanese ↔ English translation and dictionary lookup for Twitch chat.")
            )

            HStack(alignment: .top, spacing: 14) {
                listenerCard
                statsCard
            }

            HStack(alignment: .top, spacing: 14) {
                latestTranslationCard
                latestDictionaryCard
            }

            if !state.isRunning {
                Card {
                    HStack(spacing: 10) {
                        Image(systemName: "info.circle")
                            .foregroundStyle(Theme.blue)
                        Text(
                            L10n.t("Start the listener to answer !ts (translation) and !d (dictionary) in chat.")
                        )
                        .font(.caption)
                        .foregroundStyle(Theme.textMuted)
                    }
                }
            }
        }
    }

    private var listenerCard: some View {
        SectionCard(L10n.t("Chat Listener")) {
            HStack {
                StatusPill(status: state.status)
                Spacer()
                if state.status.reconnecting {
                    Text(L10n.t("Retrying connection…"))
                        .font(.caption2)
                        .foregroundStyle(Theme.yellow)
                }
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(L10n.t("Channel"))
                    .font(.caption.weight(.medium))
                    .foregroundStyle(Theme.textDim)
                Text(channelLabel)
                    .font(.system(size: 15, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Theme.textPrimary)
            }

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
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(state.isBusy)
        }
        .frame(maxWidth: .infinity)
    }

    private var statsCard: some View {
        SectionCard(L10n.t("Session")) {
            HStack(spacing: 18) {
                stat(value: "\(state.translations.count)", label: L10n.t("Translations"), color: Theme.purpleLight)
                stat(value: "\(state.lookups.count)", label: L10n.t("Lookups"), color: Theme.blue)
            }

            Divider().overlay(Theme.border)

            VStack(alignment: .leading, spacing: 4) {
                Text(L10n.t("Provider"))
                    .font(.caption.weight(.medium))
                    .foregroundStyle(Theme.textDim)
                Text(providerLabel)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Theme.textPrimary)
            }
        }
        .frame(width: 260)
    }

    private func stat(value: String, label: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(.system(size: 28, weight: .semibold, design: .rounded))
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(Theme.textDim)
        }
    }

    private var latestTranslationCard: some View {
        SectionCard(L10n.t("Latest Translation")) {
            if let latest = state.translations.first {
                translationRow(latest)
            } else {
                EmptyState(
                    icon: "character.bubble",
                    title: L10n.t("No translations yet"),
                    message: L10n.t("Japanese or English messages with !ts will appear here.")
                )
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var latestDictionaryCard: some View {
        SectionCard(L10n.t("Latest Dictionary Lookup")) {
            if let latest = state.lookups.first {
                dictionaryRow(latest)
            } else {
                EmptyState(
                    icon: "character.book.closed",
                    title: L10n.t("No lookups yet"),
                    message: L10n.t("Words looked up with !d will appear here.")
                )
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func translationRow(_ event: TranslationEvent) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Text(event.originalUser)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Theme.purpleLight)
                Text("·")
                    .foregroundStyle(Theme.textDim)
                Text(EventTime.clock(event.timestamp))
                    .font(.caption2)
                    .foregroundStyle(Theme.textDim)
                Spacer()
                Pill(
                    text: "\(event.sourceLang) → \(event.targetLang)",
                    color: Theme.blue
                )
            }

            Text(event.originalMessage)
                .font(.system(size: 13))
                .foregroundStyle(Theme.textMuted)
                .textSelection(.enabled)

            ForEach(Array(event.suggestions.enumerated()), id: \.offset) { _, suggestion in
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Pill(
                        text: L10n.t(suggestion.formality),
                        color: formalityColor(suggestion.formality)
                    )
                    Text(suggestion.text)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Theme.textPrimary)
                        .textSelection(.enabled)
                }
            }

            if !event.points.isEmpty {
                VStack(alignment: .leading, spacing: 3) {
                    ForEach(Array(event.points.enumerated()), id: \.offset) { _, point in
                        Text("• \(point)")
                            .font(.caption2)
                            .foregroundStyle(Theme.textDim)
                    }
                }
            }
        }
    }

    private func dictionaryRow(_ event: DictionaryEvent) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 6) {
                Text(event.originalUser)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Theme.purpleLight)
                Text("·")
                    .foregroundStyle(Theme.textDim)
                Text(EventTime.clock(event.timestamp))
                    .font(.caption2)
                    .foregroundStyle(Theme.textDim)
                Spacer()
            }

            Text(event.word)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(Theme.textPrimary)
                .textSelection(.enabled)

            Text(event.meaning)
                .font(.system(size: 13))
                .foregroundStyle(Theme.textMuted)
                .fixedSize(horizontal: false, vertical: true)

            if !event.examples.isEmpty {
                VStack(alignment: .leading, spacing: 3) {
                    Text(L10n.t("Examples"))
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(Theme.textDim)
                    ForEach(Array(event.examples.enumerated()), id: \.offset) { _, example in
                        Text("“\(example)”")
                            .font(.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                }
            }

            if !event.similarWords.isEmpty {
                HStack(spacing: 5) {
                    Text(L10n.t("Similar:"))
                        .font(.caption2)
                        .foregroundStyle(Theme.textDim)
                    ForEach(event.similarWords, id: \.self) { word in
                        Pill(text: word, color: Theme.purpleLight)
                    }
                }
            }
        }
    }

    private var channelLabel: String {
        if let channel = state.status.channel {
            return "#\(channel)"
        }
        if !state.targetChannel.isEmpty {
            return "#\(state.targetChannel)"
        }
        return L10n.t("Your channel")
    }

    private var providerLabel: String {
        guard let bonsai = state.bonsai, bonsai.enabled else {
            return L10n.t("Gemini API")
        }
        return L10n.f("Local model (Bonsai %@)", bonsai.activeModel.uppercased())
    }

    private func formalityColor(_ value: String) -> Color {
        switch value {
        case "casual": return Theme.green
        case "formal": return Theme.blue
        default: return Theme.purpleLight
        }
    }

}
