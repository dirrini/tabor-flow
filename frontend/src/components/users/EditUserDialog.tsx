import {
  useState,
  type FormEvent
} from "react";

import type {
  User,
  UserRole
} from "../../types/User";
import { useI18n } from "../../lib/i18n";

export type EditUserFormValues = {
  name: string;
  email: string;
  role: UserRole;
};

interface EditUserDialogProps {
  user: User;
  saving: boolean;
  deleting: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSave: (
    values: EditUserFormValues
  ) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function EditUserDialog({
  user,
  saving,
  deleting,
  errorMessage,
  onClose,
  onSave,
  onDelete
}: EditUserDialogProps) {
  const { tr } = useI18n();
  const [form, setForm] =
    useState<EditUserFormValues>({
      name: user.name,
      email: user.email,
      role: user.role
    });

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await onSave({
      ...form,
      name: form.name.trim(),
      email: form.email
        .trim()
        .toLowerCase()
    });
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-950/40
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-lg
          rounded-xl
          bg-white
          p-6
          shadow-xl
        "
      >
        <div
          className="
            mb-5
            flex
            items-center
            justify-between
          "
        >
          <h3 className="text-xl font-semibold">
            {tr("Editar usuário", "Edit user")}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              px-3
              py-1
              text-sm
              text-slate-500
              hover:bg-slate-100
            "
          >
            {tr("Fechar", "Close")}
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <label className="block">
            <span
              className="
                mb-1
                block
                text-sm
                font-medium
                text-slate-700
              "
            >
              {tr("Nome", "Name")}
            </span>
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value
                })
              }
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                px-3
                py-2
                outline-none
                focus:border-slate-900
              "
            />
          </label>

          <label className="block">
            <span
              className="
                mb-1
                block
                text-sm
                font-medium
                text-slate-700
              "
            >
              Email
            </span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email: event.target.value
                })
              }
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                px-3
                py-2
                outline-none
                focus:border-slate-900
              "
            />
          </label>

          <label className="block">
            <span
              className="
                mb-1
                block
                text-sm
                font-medium
                text-slate-700
              "
            >
              {tr("Função", "Role")}
            </span>
            <select
              value={form.role}
              disabled={user.role === "ADMIN"}
              onChange={(event) =>
                setForm({
                  ...form,
                  role:
                    event.target
                      .value as UserRole
                })
              }
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                px-3
                py-2
                outline-none
                focus:border-slate-900
                disabled:cursor-not-allowed
                disabled:bg-slate-100
                disabled:text-slate-600
              "
            >
              {user.role === "ADMIN" && (
                <option value="ADMIN">
                  {tr(
                    "Administrador e gerente de projetos",
                    "Administrator and Project Manager"
                  )}
                </option>
              )}
              <option value="MEMBER">
                {tr("Membro", "Member")}
              </option>
              <option value="PROJECT_MANAGER">
                {tr("Gerente de projetos", "Project Manager")}
              </option>
            </select>
          </label>

          {errorMessage && (
            <p className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-wrap justify-between gap-3 pt-2">
            {user.role !== "ADMIN" && (
              <button
                type="button"
                disabled={saving || deleting}
                onClick={() => void onDelete()}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {deleting
                  ? tr("Removendo...", "Removing...")
                  : tr("Remover usuário", "Remove user")}
              </button>
            )}
            <div className="ml-auto flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-lg
                border
                px-4
                py-2
                text-sm
                hover:bg-slate-100
              "
            >
              {tr("Cancelar", "Cancel")}
            </button>

            <button
              type="submit"
              disabled={
                saving || deleting ||
                !form.name.trim() ||
                !form.email.trim()
              }
              className="
                rounded-lg
                bg-slate-900
                px-4
                py-2
                text-sm
                font-medium
                text-white
                transition
                hover:bg-slate-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {saving
                ? tr("Salvando...", "Saving...")
                : tr("Salvar alterações", "Save changes")}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
