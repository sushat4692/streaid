import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            PageHeader(
                "Dashboard",
                subtitle: "Real-time Japanese ↔ English translation and dictionary lookup for Twitch chat."
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
                            "Start the listener to answer !ts (translation) and !d (dictionary) in chat."
                        )
                        .font(.caption)
                        .foregroundStyle(Theme.textMuted)
                    }
                }
            }
        }
    }

    private var listenerCard: some View {
        SectionCard("Chat Listener") {
            HStack {
                StatusPill(status: state.status)
                Spacer()
                if state.status.reconnecting {
                    Text("Retrying connection…")
                        .font(.caption2)
                        .foregroundStyle(Theme.yellow)
                }
            }

            VStack(alignment: .leading, spacing: 3) {
                Text("Channel")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(Theme.textDim)
                Text(channelLabel)
                    .font(.system(size: 15, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Theme.textPrimary)
            }

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
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(state.isBusy)
        }
        .frame(maxWidth: .infinity)
    }

    private var statsCard: some View {
        SectionCard("Session") {
            HStack(spacing: 18) {
                stat(value: "\(state.translations.count)", label: "Translations", color: Theme.purpleLight)
                stat(value: "\(state.lookups.count)", label: "Lookups", color: Theme.blue)
            }

            Divider().overlay(Theme.border)

            VStack(alignment: .leading, spacing: 4) {
                Text("Provider")
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
        SectionCard("Latest Translation") {
            if let latest = state.translations.first {
                translationRow(latest)
            } else {
                EmptyState(
                    icon: "character.bubble",
                    title: "No translations yet",
                    message: "Japanese or English messages with !ts will appear here."
                )
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var latestDictionaryCard: some View {
        SectionCard("Latest Dictionary Lookup") {
            if let latest = state.lookups.first {
                dictionaryRow(latest)
            } else {
                EmptyState(
                    icon: "character.book.closed",
                    title: "No lookups yet",
                    message: "Words looked up with !d will appear here."
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
                        text: suggestion.formality,
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
                    Text("Examples")
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
                    Text("Similar:")
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
        return "Your channel"
    }

    private var providerLabel: String {
        guard let bonsai = state.bonsai, bonsai.enabled else {
            return "Gemini API"
        }
        return "Local model (Bonsai \(bonsai.activeModel.uppercased()))"
    }

    private func formalityColor(_ value: String) -> Color {
        switch value {
        case "casual": return Theme.green
        case "formal": return Theme.blue
        default: return Theme.purpleLight
        }
    }

}
