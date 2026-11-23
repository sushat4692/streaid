import SwiftUI

struct LogView: View {
    @EnvironmentObject private var state: AppState

    enum Tab: String, CaseIterable, Identifiable {
        case translations
        case dictionary

        var id: String { rawValue }
        var title: String {
            self == .translations ? L10n.t("Translations") : L10n.t("Dictionary")
        }
    }

    @State private var tab: Tab = .translations

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            PageHeader(L10n.t("Log"), subtitle: L10n.t("Events received during this app session."))

            Picker(L10n.t("Log"), selection: $tab) {
                ForEach(Tab.allCases) { tab in
                    Text(tab.title).tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .frame(width: 260)
            .labelsHidden()

            if tab == .translations {
                translationLog
            } else {
                dictionaryLog
            }
        }
    }

    private var translationLog: some View {
        Card(padding: 0) {
            if state.translations.isEmpty {
                EmptyState(
                    icon: "character.bubble",
                    title: L10n.t("No translations yet"),
                    message: L10n.t("Messages with !ts will appear here.")
                )
            } else {
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(state.translations.enumerated()), id: \.offset) { index, event in
                        translationRow(event)
                        if index < state.translations.count - 1 {
                            Divider().overlay(Theme.border)
                        }
                    }
                }
            }
        }
    }

    private var dictionaryLog: some View {
        Card(padding: 0) {
            if state.lookups.isEmpty {
                EmptyState(
                    icon: "character.book.closed",
                    title: L10n.t("No lookups yet"),
                    message: L10n.t("Words looked up with !d will appear here.")
                )
            } else {
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(state.lookups.enumerated()), id: \.offset) { index, event in
                        dictionaryRow(event)
                        if index < state.lookups.count - 1 {
                            Divider().overlay(Theme.border)
                        }
                    }
                }
            }
        }
    }

    private func translationRow(_ event: TranslationEvent) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Text(event.originalUser)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Theme.purpleLight)
                Text("·").foregroundStyle(Theme.textDim)
                Text(EventTime.clock(event.timestamp))
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(Theme.textDim)
                Spacer()
                Pill(text: "\(event.sourceLang) → \(event.targetLang)", color: Theme.blue)
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
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(Array(event.points.enumerated()), id: \.offset) { _, point in
                        Text("• \(point)")
                            .font(.caption2)
                            .foregroundStyle(Theme.textDim)
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func dictionaryRow(_ event: DictionaryEvent) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Text(event.originalUser)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Theme.purpleLight)
                Text("·").foregroundStyle(Theme.textDim)
                Text(EventTime.clock(event.timestamp))
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(Theme.textDim)
                Spacer()
                Pill(text: "\(event.sourceLang) → \(event.targetLang)", color: Theme.blue)
            }

            Text(event.word)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Theme.textPrimary)
                .textSelection(.enabled)

            Text(event.meaning)
                .font(.system(size: 13))
                .foregroundStyle(Theme.textMuted)
                .fixedSize(horizontal: false, vertical: true)

            if !event.examples.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(Array(event.examples.enumerated()), id: \.offset) { _, example in
                        Text("“\(example)”")
                            .font(.caption)
                            .foregroundStyle(Theme.textDim)
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
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func formalityColor(_ value: String) -> Color {
        switch value {
        case "casual": return Theme.green
        case "formal": return Theme.blue
        default: return Theme.purpleLight
        }
    }

}
