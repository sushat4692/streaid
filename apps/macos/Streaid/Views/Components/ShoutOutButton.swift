import SwiftUI

/// Compact ShoutOut menu used in the Chatters / Raiders / User Memo lists.
struct ShoutOutButton: View {
    @EnvironmentObject private var state: AppState
    let username: String

    var body: some View {
        Menu {
            Button("Shoutout") { run(nil) }
            Button("Show Info") { run("info") }
            Button("Show Clip") { run("clip") }
        } label: {
            Image(systemName: "speaker.wave.2")
        }
        .menuStyle(.borderlessButton)
        .fixedSize()
        .help("Shoutout @\(username)")
    }

    private func run(_ mode: String?) {
        Task { await state.runShoutout(username: username, mode: mode) }
    }
}
