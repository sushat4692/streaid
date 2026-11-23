import SwiftUI

@main
struct StreaidApp: App {
    @StateObject private var state = AppState()
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(state)
                .preferredColorScheme(.dark)
                .frame(minWidth: 820, minHeight: 560)
                .onAppear { appDelegate.state = state }
        }
        .windowStyle(.titleBar)
        .windowToolbarStyle(.unifiedCompact)
        .windowResizability(.contentMinSize)
        .commands {
            CommandGroup(replacing: .newItem) {}
            CommandGroup(replacing: .appSettings) {
                Button(L10n.t("Settings…")) {
                    state.page = .config
                }
                .keyboardShortcut(",", modifiers: .command)
                .disabled(!state.loggedIn)
            }
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        Group {
            if state.loggedIn {
                ShellView()
            } else {
                LoginView()
            }
        }
        .overlay(alignment: .topTrailing) {
            if let toast = state.toast {
                ToastBanner(message: toast, kind: state.toastKind) {
                    state.toast = nil
                }
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.18), value: state.toast)
        .id(state.resolvedLocale)
        .background(Theme.background)
        .preferredColorScheme(.dark)
    }
}
