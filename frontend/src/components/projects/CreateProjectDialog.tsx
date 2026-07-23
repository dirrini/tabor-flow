import {
  useState,
  type FormEvent
} from "react";

import type { ProjectStatus }
  from "../../types/Project";
import { useI18n } from "../../lib/i18n";

export type CreateProjectFormValues = {
  externalCode?: string | null;
  name: string;
  description: string;
  progress: number;
  status: ProjectStatus;
};

interface CreateProjectDialogProps {
  creating: boolean;
  errorMessage?: string;
  onClose: () => void;
  onCreate: (
    values: CreateProjectFormValues
  ) => Promise<void>;
}

const initialProjectForm: CreateProjectFormValues = {
  externalCode: "",
  name: "",
  description: "",
  progress: 0,
  status: "ON_TRACK"
};

export default function CreateProjectDialog({
  creating,
  errorMessage,
  onClose,
  onCreate
}: CreateProjectDialogProps) {
  const { tr } = useI18n();
  const [projectForm, setProjectForm] =
    useState<CreateProjectFormValues>(
      initialProjectForm
    );

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await onCreate({
      ...projectForm,
      externalCode:
        projectForm.externalCode?.trim() ||
        null,
      name: projectForm.name.trim(),
      description:
        projectForm.description.trim(),
      progress: Math.min(
        100,
        Math.max(
          0,
          Number(projectForm.progress)
        )
      )
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
          <h3
            className="
              text-xl
              font-semibold
            "
          >
            {tr("Novo projeto", "New project")}
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
              value={projectForm.name}
              onChange={(event) =>
                setProjectForm({
                  ...projectForm,
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
              {tr("Código externo do projeto", "External project code")}
            </span>
            <input
              value={
                projectForm.externalCode ?? ""
              }
              onChange={(event) =>
                setProjectForm({
                  ...projectForm,
                  externalCode:
                    event.target.value
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
              {tr("Descrição", "Description")}
            </span>
            <textarea
              required
              value={projectForm.description}
              onChange={(event) =>
                setProjectForm({
                  ...projectForm,
                  description:
                    event.target.value
                })
              }
              rows={4}
              className="
                w-full
                resize-none
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

          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
            "
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
                {tr("Status", "Status")}
              </span>
              <select
                value={projectForm.status}
                onChange={(event) =>
                  setProjectForm({
                    ...projectForm,
                    status:
                      event.target
                        .value as ProjectStatus
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
              >
                <option value="ON_TRACK">
                  {tr("No prazo", "On Track")}
                </option>
                <option value="AT_RISK">
                  {tr("Em risco", "At Risk")}
                </option>
                <option value="COMPLETED">
                  {tr("Concluído", "Completed")}
                </option>
              </select>
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
                {tr("Progresso", "Progress")}
              </span>
              <input
                required
                type="number"
                min={0}
                max={100}
                value={projectForm.progress}
                onChange={(event) =>
                  setProjectForm({
                    ...projectForm,
                    progress:
                      Number(
                        event.target.value
                      )
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
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <div
            className="
              flex
              justify-end
              gap-3
              pt-2
            "
          >
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
                creating ||
                !projectForm.name.trim() ||
                !projectForm.description.trim()
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
              {creating
                ? tr("Criando...", "Creating...")
                : tr("Criar projeto", "Create project")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
