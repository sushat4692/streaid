import AppKit
import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Theme.background, Color(hex: 0x141024), Theme.background],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            Circle()
                .fill(Theme.purple.opacity(0.18))
                .frame(width: 520, height: 520)
                .blur(radius: 120)
                .offset(x: -260, y: -220)

            VStack(spacing: 22) {
                header

                Card(padding: 24) {
                    VStack(alignment: .leading, spacing: 18) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Connect your Twitch account")
                                .font(.title3.weight(.semibold))
                                .foregroundStyle(Theme.textPrimary)
                            Text(
                                "Streaid reads chat with a bot account so it can answer !ts and !d. Use the Client ID of your Twitch application."
                            )
                            .font(.caption)
                            .foregroundStyle(Theme.textDim)
                            .fixedSize(horizontal: false, vertical: true)
                        }

                        LabeledField("Client ID") {
                            TextField("Twitch application Client ID", text: $state.clientID)
                                .textFieldStyle(.plain)
                                .font(.system(size: 13, design: .monospaced))
                                .padding(10)
                                .disabled(state.isAuthenticating)
                                .background(Theme.cardStrong)
                                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                                        .stroke(Theme.border, lineWidth: 1)
                                )
                        }

                        HStack(spacing: 10) {
                            Button {
                                state.saveClientID()
                            } label: {
                                Text("Save Client ID")
                            }
                            .buttonStyle(SecondaryButtonStyle())
                            .disabled(
                                state.isAuthenticating
                                    || state.clientID.trimmingCharacters(in: .whitespaces).isEmpty
                            )

                            Button {
                                state.startAuthentication()
                            } label: {
                                HStack(spacing: 7) {
                                    if state.isAuthenticating {
                                        ProgressView().controlSize(.small)
                                    }
                                    Text(
                                        state.isAuthenticating
                                            ? "Waiting for authorization…"
                                            : "Log in with Twitch")
                                }
                            }
                            .buttonStyle(PrimaryButtonStyle())
                            .disabled(state.isAuthenticating)

                            if state.isAuthenticating {
                                Button("Cancel") {
                                    state.cancelAuthentication()
                                }
                                .buttonStyle(SecondaryButtonStyle())
                            }
                        }

                        if let info = state.deviceCode {
                            deviceCodeBox(info)
                        }

                        if let error = state.loginError {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(Theme.red)
                                .fixedSize(horizontal: false, vertical: true)
                        }

                        Divider().overlay(Theme.border)

                        Link(
                            "Create a Twitch application",
                            destination: URL(string: "https://dev.twitch.tv/console/apps")!
                        )
                        .font(.caption)
                        .tint(Theme.purpleLight)

                        Text(
                            "Scopes used: chat:read, chat:edit. Tokens are stored in the macOS Keychain."
                        )
                        .font(.caption2)
                        .foregroundStyle(Theme.textDim)
                    }
                }
                .frame(maxWidth: 520)
            }
            .padding(40)
        }
    }

    private var header: some View {
        VStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Theme.purpleDim, Theme.purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 56, height: 56)
                Text("S")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(.white)
            }
            Text("Streaid")
                .font(.system(size: 30, weight: .bold))
                .foregroundStyle(Theme.textPrimary)
            Text("This app is aiding your streaming.")
                .font(.subheadline)
                .foregroundStyle(Theme.textDim)
        }
    }

    private func deviceCodeBox(_ info: DeviceCodeInfo) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Enter this code on Twitch")
                .font(.caption.weight(.medium))
                .foregroundStyle(Theme.textMuted)

            HStack(spacing: 12) {
                Text(info.userCode)
                    .font(.system(size: 28, weight: .bold, design: .monospaced))
                    .foregroundStyle(Theme.purpleLight)
                    .textSelection(.enabled)

                Button("Open Twitch") {
                    state.openVerificationURL()
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))
            }

            Text("This code expires in about \(info.expiresIn / 60) minutes.")
                .font(.caption2)
                .foregroundStyle(Theme.textDim)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.purple.opacity(0.10))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(Theme.purple.opacity(0.30), lineWidth: 1)
        )
    }
}
