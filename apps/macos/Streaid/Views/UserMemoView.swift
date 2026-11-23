import SwiftUI

struct UserMemoView: View {
    @EnvironmentObject private var state: AppState

    @State private var showForm = false
    @State private var editing: MemoRecord?

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .bottom) {
                PageHeader(
                    L10n.t("User Memo"),
                    subtitle: L10n.t("Notes about chatters and streamers.")
                )
                Spacer()
                Button {
                    editing = nil
                    showForm = true
                } label: {
                    Label(L10n.t("New Memo"), systemImage: "plus")
                }
                .buttonStyle(PrimaryButtonStyle(compact: true))
            }

            SectionCard(L10n.f("Memos (%d)", state.memos.count)) {
                if state.memos.isEmpty {
                    EmptyState(
                        icon: "note.text",
                        title: L10n.t("No memos yet"),
                        message: L10n.t("Store a nickname or a note for a user.")
                    )
                } else {
                    VStack(spacing: 0) {
                        ForEach(state.memos) { memo in
                            row(memo)
                            Divider().overlay(Theme.border)
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showForm) {
            MemoFormView(editing: editing)
                .id(editing?.id ?? "new")
                .environmentObject(state)
        }
    }

    private func row(_ memo: MemoRecord) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Text(memo.nickname.isEmpty ? memo.username : memo.nickname)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Theme.textPrimary)
                Text("@\(memo.username)")
                    .font(.caption2)
                    .foregroundStyle(Theme.textDim)
                Spacer()
                Text(EventTime.clock(memo.updatedAt))
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(Theme.textDim)
                Button(L10n.t("Edit")) {
                    editing = memo
                    showForm = true
                }
                .buttonStyle(SecondaryButtonStyle(compact: true))
                ShoutOutButton(username: memo.username)

                Button {
                    Task { await state.deleteMemo(id: memo.id) }
                } label: {
                    Image(systemName: "trash")
                }
                .buttonStyle(DangerButtonStyle())
            }

            if !memo.memo.isEmpty {
                Text(memo.memo)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textMuted)
                    .textSelection(.enabled)
            }
        }
        .padding(.vertical, 10)
    }
}

private struct MemoFormView: View {
    @EnvironmentObject private var state: AppState
    @Environment(\.dismiss) private var dismiss

    let editing: MemoRecord?

    @State private var username: String
    @State private var nickname: String
    @State private var memo: String
    @State private var saving = false

    init(editing: MemoRecord?) {
        self.editing = editing
        _username = State(initialValue: editing?.username ?? "")
        _nickname = State(initialValue: editing?.nickname ?? "")
        _memo = State(initialValue: editing?.memo ?? "")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(editing == nil ? L10n.t("New Memo") : L10n.t("Edit Memo"))
                .font(.headline)
                .foregroundStyle(Theme.textPrimary)

            LabeledField(L10n.t("Username")) {
                TextField("username", text: $username)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13, design: .monospaced))
                    .padding(10)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
                    .disabled(editing != nil)
            }

            LabeledField(L10n.t("Nickname (optional)")) {
                TextField("nickname", text: $nickname)
                    .textFieldStyle(.plain)
                    .padding(10)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }

            LabeledField(L10n.t("Memo")) {
                TextEditor(text: $memo)
                    .font(.system(size: 13))
                    .scrollContentBackground(.hidden)
                    .padding(8)
                    .frame(minHeight: 100)
                    .background(Theme.cardStrong)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(Theme.border, lineWidth: 1)
                    )
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
            let ok = await state.saveMemo(
                id: editing?.id ?? "",
                username: username,
                nickname: nickname,
                memo: memo
            )
            saving = false
            if ok { dismiss() }
        }
    }
}
