import SwiftUI

struct RaidersView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            PageHeader(
                "Raiders",
                subtitle: "Raid history for this channel (newest first)."
            )

            SectionCard("Raiders (\(state.raiders.count))") {
                if state.raiders.isEmpty {
                    EmptyState(
                        icon: "tornado",
                        title: "No raids yet",
                        message: "Raids will appear here with their viewer counts."
                    )
                } else {
                    VStack(spacing: 0) {
                        ForEach(state.raiders) { raider in
                            row(raider)
                            Divider().overlay(Theme.border)
                        }
                    }
                }
            }
        }
    }

    private func row(_ raider: RaiderRecord) -> some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(Theme.purple.opacity(0.35))
                    .frame(width: 28, height: 28)
                Image(systemName: "tornado")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Theme.purpleLight)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(raider.displayName)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Theme.textPrimary)
                Text("@\(raider.username)")
                    .font(.caption2)
                    .foregroundStyle(Theme.textDim)
            }

            Spacer()

            Pill(text: "\(raider.viewers) viewers", color: Theme.blue)
            Text(EventTime.clock(raider.timestamp))
                .font(.caption2.monospacedDigit())
                .foregroundStyle(Theme.textDim)

            Button {
                Task { await state.deleteRaider(id: raider.id) }
            } label: {
                Image(systemName: "trash")
            }
            .buttonStyle(DangerButtonStyle())
            .help("Delete this raid")
        }
        .padding(.vertical, 8)
    }
}
