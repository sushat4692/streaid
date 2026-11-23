import SwiftUI

struct ShellView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        HStack(spacing: 0) {
            sidebar
                .frame(width: Theme.sidebarWidth)
                .background(Theme.sidebar)

            Divider().overlay(Theme.border)

            ScrollView {
                pageContent
                    .padding(24)
                    .frame(maxWidth: 1000, alignment: .leading)
                    .frame(maxWidth: .infinity, alignment: .top)
            }
            .background(Theme.background)
        }
    }

    private var sidebar: some View {
        VStack(spacing: 0) {
            brand
            nav
            Spacer(minLength: 16)
            account
        }
        .frame(maxHeight: .infinity, alignment: .top)
    }

    private var brand: some View {
        HStack(spacing: 9) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Theme.purpleDim, Theme.purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 26, height: 26)
                Text("S")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
            }
            Text("Streaid")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(Theme.purpleDim)
            Spacer()
        }
        .padding(.horizontal, 16)
        .frame(height: 54)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Theme.border).frame(height: 1)
        }
    }

    private var nav: some View {
        ScrollView {
            VStack(spacing: 3) {
                ForEach(Page.allCases) { page in
                    Button {
                        state.page = page
                    } label: {
                        HStack(spacing: 9) {
                            Image(systemName: page.icon)
                                .frame(width: 16)
                            Text(page.title)
                            Spacer()
                        }
                        .font(.system(size: 13, weight: .medium))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 8)
                        .foregroundStyle(
                            state.page == page ? Theme.textPrimary : Theme.textDim
                        )
                        .background(
                            state.page == page
                                ? Color.white.opacity(0.08)
                                : Color.clear
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 10)
            .padding(.top, 12)
            .padding(.bottom, 8)
        }
        .scrollIndicators(.hidden)
    }

    private var account: some View {
        VStack(spacing: 10) {
            HStack(spacing: 9) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Theme.purpleDim, Theme.purpleDark],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 28, height: 28)
                    Text(initial)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)
                }
                Text(state.username ?? "Unknown User")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textMuted)
                    .lineLimit(1)
                Spacer()
            }

            StatusPill(status: state.status)

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

            Button {
                Task { await state.logout() }
            } label: {
                Text("Logout")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(SecondaryButtonStyle(compact: true))
        }
        .padding(12)
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.border).frame(height: 1)
        }
    }

    private var initial: String {
        guard let first = state.username?.first else { return "?" }
        return String(first).uppercased()
    }

    @ViewBuilder
    private var pageContent: some View {
        switch state.page {
        case .dashboard:
            DashboardView()
        case .chatters:
            ChattersView()
        case .raiders:
            RaidersView()
        case .commands:
            CommandsView()
        case .userMemo:
            UserMemoView()
        case .modelTest:
            ModelTestView()
        case .config:
            ConfigView()
        case .vocabulary:
            VocabularyView()
        case .log:
            LogView()
        case .credits:
            CreditsView()
        }
    }
}
