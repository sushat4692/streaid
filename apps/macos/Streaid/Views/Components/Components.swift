import SwiftUI

// MARK: - Card

struct Card<Content: View>: View {
    let padding: CGFloat
    let content: Content

    init(padding: CGFloat = 16, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous)
                    .stroke(Theme.border, lineWidth: 1)
            )
    }
}

struct SectionCard<Content: View>: View {
    let title: String
    let subtitle: String?
    let content: Content

    init(_ title: String, subtitle: String? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.subtitle = subtitle
        self.content = content()
    }

    var body: some View {
        Card(padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(Theme.textPrimary)
                    if let subtitle {
                        Text(subtitle)
                            .font(.caption)
                            .foregroundStyle(Theme.textDim)
                    }
                }
                content
            }
        }
    }
}

// MARK: - Headers

struct PageHeader: View {
    let title: String
    let subtitle: String?

    init(_ title: String, subtitle: String? = nil) {
        self.title = title
        self.subtitle = subtitle
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(Theme.textPrimary)
            if let subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(Theme.textDim)
            }
            Divider().overlay(Theme.border).padding(.top, 4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Status

struct StatusPill: View {
    let status: ChatStatus

    private var color: Color {
        if status.reconnecting { return Theme.yellow }
        return status.isRunning ? Theme.green : Theme.textDim
    }

    private var label: String {
        if status.reconnecting { return L10n.t("Reconnecting…") }
        return status.isRunning ? L10n.t("Running") : L10n.t("Stopped")
    }

    var body: some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 7, height: 7)
            Text(label)
                .font(.caption.weight(.medium))
                .foregroundStyle(color)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(color.opacity(0.12))
        .clipShape(Capsule())
    }
}

struct Pill: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption.weight(.medium))
            .foregroundStyle(color)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
    }
}

// MARK: - Buttons

struct PrimaryButtonStyle: ButtonStyle {
    var compact = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: compact ? 12 : 13, weight: .semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, compact ? 12 : 16)
            .padding(.vertical, compact ? 6 : 9)
            .background(
                LinearGradient(
                    colors: [Theme.purpleDim, Theme.purple],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
            .opacity(configuration.isPressed ? 0.8 : 1.0)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    var compact = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: compact ? 12 : 13, weight: .medium))
            .foregroundStyle(Theme.textPrimary)
            .padding(.horizontal, compact ? 12 : 16)
            .padding(.vertical, compact ? 6 : 9)
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 9, style: .continuous)
                    .stroke(Theme.border, lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.7 : 1.0)
    }
}

struct DangerButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(Theme.red)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Theme.red.opacity(0.10))
            .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 9, style: .continuous)
                    .stroke(Theme.red.opacity(0.25), lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.7 : 1.0)
    }
}

// MARK: - Misc

struct EmptyState: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 28))
                .foregroundStyle(Theme.textDim)
            Text(title)
                .font(.headline)
                .foregroundStyle(Theme.textMuted)
            Text(message)
                .font(.caption)
                .foregroundStyle(Theme.textDim)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
    }
}

struct LabeledField<Content: View>: View {
    let label: String
    let content: Content

    init(_ label: String, @ViewBuilder content: () -> Content) {
        self.label = label
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption.weight(.medium))
                .foregroundStyle(Theme.textMuted)
            content
        }
    }
}

struct ToastBanner: View {
    let message: String
    let kind: ToastKind
    let onDismiss: () -> Void

    private var color: Color {
        switch kind {
        case .error: return Theme.red
        case .success: return Theme.green
        case .info: return Theme.blue
        }
    }

    private var icon: String {
        switch kind {
        case .error: return "exclamationmark.triangle.fill"
        case .success: return "checkmark.circle.fill"
        case .info: return "info.circle.fill"
        }
    }

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(color)
            Text(message)
                .font(.caption)
                .foregroundStyle(Theme.textPrimary)
                .lineLimit(3)
            Spacer(minLength: 12)
            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Theme.textDim)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(L10n.t("Dismiss"))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(color.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(color.opacity(0.25), lineWidth: 1)
        )
        .frame(maxWidth: 420, alignment: .leading)
        .padding(.top, 12)
        .padding(.trailing, 20)
        .shadow(color: .black.opacity(0.25), radius: 12, y: 4)
    }
}
