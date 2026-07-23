import {
  useState,
  type FormEvent
} from "react";

import type { TaskStatus }
  from "../../types/Project";
import type { User }
  from "../../types/User";
import TaskAssignmentEditor, {
  type TaskAssignmentFormValues
} from "./TaskAssignmentEditor";
import { useI18n } from "../../lib/i18n";

export type CreateTaskFormValues = {
  title: string;
  description: string;
  status: TaskStatus;
  users: TaskAssignmentFormValues[];
};

interface CreateTaskDialogProps {
  creating: boolean;
  errorMessage?: string;
  projectUsers: User[];
  onClose: () => void;
  onCreate: (
    values: CreateTaskFormValues
  ) => Promise<void>;
}

const initialTaskForm: CreateTaskFormValues = {
  title: "",
  description: "",
  status: "TODO",
  users: []
};

export default function CreateTaskDialog({
  creating,
  errorMessage,
  projectUsers,
  onClose,
  onCreate
}: CreateTaskDialogProps) {
  const { tr } = useI18n();
  const [taskForm, setTaskForm] =
    useState<CreateTaskFormValues>(
      initialTaskForm
    );

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await onCreate({
      ...taskForm,
      title: taskForm.title.trim(),
      description:
        taskForm.description.trim()
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
          max-h-[90vh]
          w-full
          max-w-4xl
          overflow-y-auto
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
            {tr("Nova tarefa", "New task")}
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
              {tr("Título", "Title")}
            </span>
            <input
              required
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm({
                  ...taskForm,
                  title: event.target.value
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
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm({
                  ...taskForm,
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
              value={taskForm.status}
              onChange={(event) =>
                setTaskForm({
                  ...taskForm,
                  status:
                    event.target.value as TaskStatus
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
              <option value="TODO">
                {tr("A fazer", "To do")}
              </option>
              <option value="IN_PROGRESS">
                {tr("Em andamento", "In progress")}
              </option>
              <option value="DONE">
                {tr("Concluída", "Done")}
              </option>
            </select>
          </label>

          <TaskAssignmentEditor
            assignments={taskForm.users}
            projectUsers={projectUsers}
            onChange={(users) =>
              setTaskForm({
                ...taskForm,
                users
              })
            }
          />

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
                !taskForm.title.trim() ||
                taskForm.users.length === 0 ||
                taskForm.users.some(
                  (user) =>
                    !user.estimatedStartDate ||
                    !user.estimatedEndDate ||
                    user.estimatedStartDate >
                      user.estimatedEndDate
                )
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
                : tr("Criar tarefa", "Create task")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
