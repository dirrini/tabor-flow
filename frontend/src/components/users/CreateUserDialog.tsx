import { useState, type FormEvent } from "react";

import { useI18n } from "../../lib/i18n";
import type { UserRole } from "../../types/User";

export type CreateUserFormValues = {
  name: string;
  email: string;
  role: UserRole;
};

interface CreateUserDialogProps {
  creating: boolean;
  errorMessage?: string;
  onClose: () => void;
  onCreate: (values: CreateUserFormValues) => Promise<void>;
}

export default function CreateUserDialog({
  creating,
  errorMessage,
  onClose,
  onCreate
}: CreateUserDialogProps) {
  const { tr } = useI18n();
  const [form, setForm] = useState<CreateUserFormValues>({
    name: "",
    email: "",
    role: "MEMBER"
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreate({
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase()
    });
  };

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-semibold">{tr("Convidar usuário", "Invite user")}</h3>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">
            {tr("Fechar", "Close")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{tr("Nome", "Name")}</span>
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{tr("Função", "Role")}</span>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className={inputClass}>
              <option value="MEMBER">{tr("Membro", "Member")}</option>
              <option value="PROJECT_MANAGER">{tr("Gerente de projetos", "Project Manager")}</option>
            </select>
          </label>

          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            {tr(
              "O usuário receberá um convite por e-mail para confirmar a conta e definir sua senha.",
              "The user will receive an email invitation to confirm the account and set a password."
            )}
          </p>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-100">
              {tr("Cancelar", "Cancel")}
            </button>
            <button type="submit" disabled={creating || !form.name.trim() || !form.email.trim()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
              {creating ? tr("Enviando...", "Sending...") : tr("Enviar convite", "Send invitation")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
