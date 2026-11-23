import AppKit

/// AppKit lifecycle hooks that SwiftUI does not expose directly.
final class AppDelegate: NSObject, NSApplicationDelegate {
    /// Set by `StreaidApp` on appear.
    weak var state: AppState?

    /// Closing the last window quits Streaid.
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }

    /// Kill the local-model sidecars before the process disappears.
    func applicationWillTerminate(_ notification: Notification) {
        state?.core.shutdownSync()
    }
}
