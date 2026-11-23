import SwiftUI

struct ChattersView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            PageHeader(
                "Chatters",
                subtitle: "Users who spoke in this session. First-message tracking resets on restart."
            )

            SectionCard("Chatters (\(state.chatters.count))") {
                if state.chatters.isEmpty {
                    EmptyState(
                        icon: "person.2",
                        title: "No chatters yet",
                        message: "Users will appear here when they speak in chat."
                    )
                } else {
                    VStack(spacing: 0) {
                        ForEach(state.chatters) { chatter in
                            row(chatter)
                            Divider().overlay(Theme.border)
                        }
                    }
                }
            }
        }
    }

    private func row(_ chatter: Chatter) -> some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(avatarColor(chatter))
                    .frame(width: 28, height: 28)
                Text(initial(chatter.displayName))
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(chatter.displayName)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Theme.textPrimary)
                Text("@\(chatter.username)")
                    .font(.caption2)
                    .foregroundStyle(Theme.textDim)
            }

            Spacer()

            Text(clock(chatter.firstSeen))
                .font(.caption2.monospacedDigit())
                .foregroundStyle(Theme.textDim)

            Button {
                state.removeChatter(chatter)
            } label: {
                Image(systemName: "trash")
            }
            .buttonStyle(DangerButtonStyle())
            .help("Remove from this session")
        }
        .padding(.vertical, 8)
    }

    private func initial(_ name: String) -> String {
        name.first.map { String($0).uppercased() } ?? "?"
    }

    private func avatarColor(_ chatter: Chatter) -> Color {
        guard let hex = chatter.color, hex.hasPrefix("#"),
            let value = UInt32(hex.dropFirst(), radix: 16)
        else {
            return Theme.purpleDim
        }
        return Color(hex: value)
    }

    private func clock(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: date)
    }
}
