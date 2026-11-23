import SwiftUI

struct VocabularyView: View {
    @EnvironmentObject private var state: AppState

    @State private var showClearConfirmation = false

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            PageHeader(
                "Vocabulary",
                subtitle: "Words looked up with !d, normalized by the AI into base forms."
            )

            summaryCard
            analysisCard
            topWordsCard
            ambiguousCard
        }
        .task {
            await state.refreshVocabulary()
        }
        .confirmationDialog(
            "Clear the entire vocabulary?",
            isPresented: $showClearConfirmation,
            titleVisibility: .visible
        ) {
            Button("Clear Vocabulary", role: .destructive) {
                Task { await state.clearVocabulary() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This removes all recorded words and inflection history.")
        }
    }

    private var summaryCard: some View {
        SectionCard("Summary") {
            HStack(spacing: 22) {
                stat(
                    value: "\(state.vocabSummary?.totalWords ?? 0)",
                    label: "Base words",
                    color: Theme.purpleLight
                )
                stat(
                    value: "\(state.vocabSummary?.totalLookups ?? 0)",
                    label: "Lookups",
                    color: Theme.blue
                )
                Spacer()

                Button("Analyze with AI") {
                    Task { await state.analyzeVocabulary() }
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))
                .disabled(state.vocabAnalyzing)

                Button("Clear") {
                    showClearConfirmation = true
                }
                .buttonStyle(DangerButtonStyle())
                .disabled((state.vocabSummary?.totalWords ?? 0) == 0)
            }

            if state.vocabAnalyzing {
                HStack(spacing: 8) {
                    ProgressView().controlSize(.small)
                    Text("Classifying words…")
                        .font(.caption)
                        .foregroundStyle(Theme.textMuted)
                }
            }
        }
    }

    private var analysisCard: some View {
        Group {
            if !state.vocabAnalysis.isEmpty {
                SectionCard("AI Categories") {
                    ForEach(state.vocabAnalysis, id: \.category) { category in
                        VStack(alignment: .leading, spacing: 5) {
                            HStack {
                                Text(category.category)
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(Theme.textPrimary)
                                Spacer()
                                Text("\(category.totalCount) lookups")
                                    .font(.caption2)
                                    .foregroundStyle(Theme.textDim)
                            }
                            HStack(spacing: 5) {
                                ForEach(category.words, id: \.self) { word in
                                    Pill(text: word, color: Theme.purpleLight)
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        }
    }

    private var topWordsCard: some View {
        SectionCard("Top Words") {
            let words = state.vocabSummary?.topWords ?? []
            if words.isEmpty {
                EmptyState(
                    icon: "character.book.closed",
                    title: "No words yet",
                    message: "Run !d in chat, or use Model Test with the dictionary mode."
                )
            } else {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(words, id: \.word) { word in
                        HStack(alignment: .firstTextBaseline, spacing: 10) {
                            Text(word.word)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Theme.textPrimary)
                                .frame(minWidth: 120, alignment: .leading)

                            Text("\(word.count)×")
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(Theme.purpleLight)

                            if !word.sourceForms.isEmpty {
                                HStack(spacing: 4) {
                                    ForEach(word.sourceForms, id: \.form) { form in
                                        Text("\(form.form) (\(form.count))")
                                            .font(.caption2)
                                            .foregroundStyle(Theme.textDim)
                                    }
                                }
                            }
                            Spacer()
                        }
                        Divider().overlay(Theme.border)
                    }
                }
            }
        }
    }

    private var ambiguousCard: some View {
        let ambiguous = state.vocabSummary?.ambiguous ?? []
        return Group {
            if !ambiguous.isEmpty {
                SectionCard(
                    "Ambiguous Words",
                    subtitle: "Words the model interpreted as multiple base forms."
                ) {
                    ForEach(ambiguous, id: \.word) { entry in
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Text(entry.word)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Theme.textPrimary)
                            Text("→")
                                .foregroundStyle(Theme.textDim)
                            ForEach(entry.candidates, id: \.self) { candidate in
                                Pill(text: candidate, color: Theme.yellow)
                            }
                            Spacer()
                            Text("\(entry.count)×")
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(Theme.textDim)
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        }
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
}
