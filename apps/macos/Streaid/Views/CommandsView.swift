import SwiftUI

struct CommandsView: View {
    @EnvironmentObject private var state: AppState

    @State private var showForm = false
    @State private var editing: CommandRecord?

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .bottom) {
                PageHeader(
                    L10n.t("Commands"),
                    subtitle: L10n.t("Built-ins: !ts, !d, !dice. Custom commands cannot override them.")
                )
                Spacer()
                Button {
                    editing = nil
                    showForm = true
                } label: {
                    Label(L10n.t("New Command"), systemImage: "plus")
                }
                .buttonStyle(PrimaryButtonStyle(compact: true))
            }

            SectionCard(L10n.f("Custom Commands (%d)", state.commands.count)) {
                if state.commands.isEmpty {
                    EmptyState(
                        icon: "terminal",
                        title: L10n.t("No custom commands"),
                        message: L10n.t("Add a command such as !hello and choose who can use it.")
                    )
                } else {
                    VStack(spacing: 0) {
                        ForEach(state.commands) { command in
                            row(command)
                            Divider().overlay(Theme.border)
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showForm) {
            CommandFormView(editing: editing)
                .id(editing?.id ?? "new")
                .environmentObject(state)
        }
    }

    private func row(_ command: CommandRecord) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Text("!\(command.command)")
                    .font(.system(size: 13, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Theme.purpleLight)
                Pill(text: allowLabel(command.allow), color: allowColor(command.allow))
                Spacer()
                Text(EventTime.clock(command.createdAt))
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(Theme.textDim)
                Button(L10n.t("Edit")) {
                    editing = command
                    showForm = true
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))
                Button {
                    Task { await state.deleteCommand(id: command.id) }
                } label: {
                    Image(systemName: "trash")
                }
                .buttonStyle(DangerButtonStyle())
            }

            Text(command.body)
                .font(.system(size: 12))
                .foregroundStyle(Theme.textMuted)
                .textSelection(.enabled)

            if !command.memo.isEmpty {
                Text(command.memo)
                    .font(.caption2)
                    .foregroundStyle(Theme.textDim)
            }
        }
        .padding(.vertical, 10)
    }

    private func allowLabel(_ allow: String) -> String {
        switch allow {
        case "broadcaster": return L10n.t("Broadcaster")
        case "mod": return L10n.t("Moderator")
        case "vip": return "VIP"
        default: return L10n.t("Everyone")
        }
    }

    private func allowColor(_ allow: String) -> Color {
        switch allow {
        case "broadcaster": return Theme.red
        case "mod": return Theme.yellow
        case "vip": return Theme.purpleLight
        default: return Theme.green
        }
    }
}

private struct CommandFormView: View {
    @EnvironmentObject private var state: AppState
    @Environment(\.dismiss) private var dismiss

    let editing: CommandRecord?

    @State private var command: String
    @State private var body_: String
    @State private var memo: String
    @State private var allow: String
    @State private var saving = false

    init(editing: CommandRecord?) {
        self.editing = editing
        _command = State(initialValue: editing?.command ?? "")
        _body_ = State(initialValue: editing?.body ?? "")
        _memo = State(initialValue: editing?.memo ?? "")
        _allow = State(initialValue: editing?.allow ?? "everyone")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(editing == nil ? L10n.t("New Command") : L10n.t("Edit Command"))
                .font(.headline)
                .foregroundStyle(Theme.textPrimary)

            LabeledField(L10n.t("Command")) {
                TextField("!hello", text: $command)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13, design: .monospaced))
                    .padding(10)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }

            LabeledField(L10n.t("Response")) {
                TextEditor(text: $body_)
                    .font(.system(size: 13))
                    .scrollContentBackground(.hidden)
                    .padding(8)
                    .frame(minHeight: 90)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }

            LabeledField(L10n.t("Memo (optional)")) {
                TextField(L10n.t("What is this command for?"), text: $memo)
                    .textFieldStyle(.plain)
                    .padding(10)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }

            LabeledField(L10n.t("Allowed")) {
                Picker(L10n.t("Allowed"), selection: $allow) {
                    Text(L10n.t("Everyone")).tag("everyone")
                    Text("VIP").tag("vip")
                    Text(L10n.t("Moderator")).tag("mod")
                    Text(L10n.t("Broadcaster")).tag("broadcaster")
                }
                .pickerStyle(.segmented)
                .labelsHidden()
            }

            HStack {
                Spacer()
                Button(L10n.t("Cancel")) { dismiss() }
                    .buttonStyle(SecondaryButtonStyle())
                Button {
                    save()
                } label: {
                    if saving {
                        ProgressView().controlSize(.small)
                    } else {
                        Text(L10n.t("Save"))
                    }
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(saving)
            }
        }
        .padding(22)
        .frame(width: 520)
        .background(Theme.background)
    }

    private func save() {
        saving = true
        Task {
            let ok = await state.saveCommand(
                id: editing?.id ?? "",
                command: command,
                body: body_,
                memo: memo,
                allow: allow
            )
            saving = false
            if ok { dismiss() }
        }
    }
}
