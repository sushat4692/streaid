import SwiftUI

private struct CreditItem: Identifiable {
    let name: String
    let role: String
    let license: String
    let url: String?

    var id: String { name }
}

struct CreditsView: View {
    private let models: [CreditItem] = [
        CreditItem(
            name: "Bonsai (Ternary) by Prism ML",
            role: "Local on-device LLM (8B / 4B)",
            license: "Apache-2.0",
            url: "https://prismml.com"
        ),
        CreditItem(
            name: "MLX / mlx-lm (Apple)",
            role: "Local inference runtime",
            license: "MIT",
            url: "https://github.com/ml-explore/mlx-lm"
        ),
        CreditItem(
            name: "Gemini 3.1 Flash Lite (Google)",
            role: "Cloud translation API",
            license: "Google AI terms of service",
            url: "https://ai.google.dev/gemini-api"
        ),
    ]

    private let app: [CreditItem] = [
        CreditItem(
            name: "SwiftUI / AppKit (Apple)",
            role: "Native macOS UI",
            license: "Apple SDK terms",
            url: "https://developer.apple.com/xcode/swiftui/"
        ),
        CreditItem(
            name: "streaid-ffi",
            role: "C ABI between Swift and Rust",
            license: "MIT",
            url: nil
        ),
        CreditItem(
            name: "Open (Rust)",
            role: "Open URLs in browser",
            license: "MIT",
            url: "https://github.com/Byron/open-rs"
        ),
        CreditItem(
            name: "dirs",
            role: "App data directories",
            license: "MIT / Apache-2.0",
            url: "https://github.com/dirs-dev/dirs-rs"
        ),
    ]

    private let core: [CreditItem] = [
        CreditItem(
            name: "tokio / tokio-tungstenite",
            role: "Async runtime / Twitch IRC",
            license: "MIT",
            url: "https://tokio.rs"
        ),
        CreditItem(
            name: "reqwest",
            role: "HTTP client (Gemini API)",
            license: "MIT / Apache-2.0",
            url: "https://github.com/seanmonstar/reqwest"
        ),
        CreditItem(
            name: "axum",
            role: "OBS overlay server",
            license: "MIT",
            url: "https://github.com/tokio-rs/axum"
        ),
        CreditItem(
            name: "serde / serde_json",
            role: "Serialization",
            license: "MIT / Apache-2.0",
            url: "https://serde.rs"
        ),
        CreditItem(
            name: "keyring",
            role: "OS keychain storage",
            license: "MIT / Apache-2.0",
            url: "https://github.com/hwchen/keyring-rs"
        ),
        CreditItem(
            name: "twitch_oauth2",
            role: "Twitch OAuth device flow",
            license: "MIT / Apache-2.0",
            url: "https://github.com/Emilgardis/twitch_api"
        ),
        CreditItem(
            name: "rodio",
            role: "Audio playback",
            license: "MIT",
            url: "https://github.com/RustAudio/rodio"
        ),
        CreditItem(
            name: "chrono",
            role: "Timestamps",
            license: "MIT / Apache-2.0",
            url: "https://github.com/chronotope/chrono"
        ),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            PageHeader(
                "Credits",
                subtitle: "Streaid is built on the work of these projects and models."
            )

            section("Models & APIs", items: models)
            section("macOS App", items: app)
            section("Rust Core", items: core)

            Text("Streaid is released under the MIT License.")
                .font(.caption2)
                .foregroundStyle(Theme.textDim)
                .padding(.top, 4)
        }
    }

    private func section(_ title: String, items: [CreditItem]) -> some View {
        SectionCard(title) {
            VStack(alignment: .leading, spacing: 10) {
                ForEach(items) { item in
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Theme.textPrimary)
                            Text(item.role)
                                .font(.caption2)
                                .foregroundStyle(Theme.textDim)
                        }

                        Spacer()

                        Text(item.license)
                            .font(.caption2)
                            .foregroundStyle(Theme.textMuted)

                        if let url = item.url, let link = URL(string: url) {
                            Link(destination: link) {
                                Image(systemName: "arrow.up.right.square")
                                    .font(.caption)
                                    .foregroundStyle(Theme.purpleLight)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Open \(item.name)")
                        }
                    }
                    Divider().overlay(Theme.border)
                }
            }
        }
    }
}
