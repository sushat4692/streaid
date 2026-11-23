import SwiftUI

struct CommandsView: View {
    @EnvironmentObject private var state: AppState

    @State private var showForm = false
    @State private var editing: CommandRecord?

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .bottom) {
                PageHeader(
                    "Commands",
                    subtitle: "Built-ins: !ts, !d, !dice. Custom commands cannot override them."
                )
                Spacer()
                Button {
                    editing = nil
                    showForm = true
                } label: {
                    Label("New Command", systemImage: "plus")
                }
                .buttonStyle(PrimaryButtonStyle(compact: true))
            }

            SectionCard("Custom Commands (\(state.commands.count))") {
                if state.commands.isEmpty {
                    EmptyState(
                        icon: "terminal",
                        title: "No custom commands",
                        message: "Add a command such as !hello and choose who can use it."
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
                .environmentObject(state)
        }
    }

    private func row(_ command: CommandRecord) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Text("!\(command.command)")
                    .font(.system(size: 13, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Theme.purpleLight)
                Pill(text: command.allow, color: allowColor(command.allow))
                Spacer()
                Text(EventTime.clock(command.createdAt))
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(Theme.textDim)
                Button("Edit") {
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
            Text(editing == nil ? "New Command" : "Edit Command")
                .font(.headline)
                .foregroundStyle(Theme.textPrimary)

            LabeledField("Command") {
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

            LabeledField("Response") {
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

            LabeledField("Memo (optional)") {
                TextField("What is this command for?", text: $memo)
                    .textFieldStyle(.plain)
                    .padding(10)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }

            LabeledField("Allowed") {
                Picker("Allowed", selection: $allow) {
                    Text("Everyone").tag("everyone")
                    Text("VIP").tag("vip")
                    Text("Moderator").tag("mod")
                    Text("Broadcaster").tag("broadcaster")
                }
                .pickerStyle(.segmented)
                .labelsHidden()
            }

            HStack {
                Spacer()
                Button("Cancel") { dismiss() }
                    .buttonStyle(SecondaryButtonStyle())
                Button {
                    save()
                } label: {
                    if saving {
                        ProgressView().controlSize(.small)
                    } else {
                        Text("Save")
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
