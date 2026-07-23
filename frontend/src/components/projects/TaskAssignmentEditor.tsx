import {
  useMemo,
  useState
} from "react";

import type {
  TaskStatus
} from "../../types/Project";
import type { User }
  from "../../types/User";
import { useI18n } from "../../lib/i18n";

export type TaskAssignmentFormValues = {
  userId: string;
  status: TaskStatus;
  estimatedStartDate: string;
  estimatedEndDate: string;
};

interface TaskAssignmentEditorProps {
  assignments: TaskAssignmentFormValues[];
  projectUsers: User[];
  onChange: (
    assignments: TaskAssignmentFormValues[]
  ) => void;
}

function getToday() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function formatStatus(status: string) {
  return status
    .replace("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

export default function TaskAssignmentEditor({
  assignments,
  projectUsers,
  onChange
}: TaskAssignmentEditorProps) {
  const { tr } = useI18n();
  const roleLabel = (role: string) => role === "PROJECT_MANAGER"
    ? tr("Gerente de projetos", "Project Manager")
    : role === "MEMBER"
      ? tr("Membro", "Member")
      : formatStatus(role);
  const today = getToday();
  const [selectedUserId, setSelectedUserId] =
    useState("");
  const [status, setStatus] =
    useState<TaskStatus>("TODO");
  const [
    estimatedStartDate,
    setEstimatedStartDate
  ] = useState(today);
  const [
    estimatedEndDate,
    setEstimatedEndDate
  ] = useState(today);

  const availableUsers = useMemo(
    () =>
      projectUsers.filter(
        (user) =>
          !assignments.some(
            (assignment) =>
              assignment.userId === user.id
          )
      ),
    [assignments, projectUsers]
  );

  const canAddAssignment =
    selectedUserId &&
    estimatedStartDate &&
    estimatedEndDate &&
    estimatedStartDate <= estimatedEndDate;

  const handleAddAssignment = () => {
    if (!canAddAssignment)
      return;

    onChange([
      ...assignments,
      {
        userId: selectedUserId,
        status,
        estimatedStartDate,
        estimatedEndDate
      }
    ]);
    setSelectedUserId("");
    setStatus("TODO");
    setEstimatedStartDate(today);
    setEstimatedEndDate(today);
  };

  const updateAssignment = (
    userId: string,
    values: Partial<TaskAssignmentFormValues>
  ) => {
    onChange(
      assignments.map((assignment) =>
        assignment.userId === userId
          ? {
              ...assignment,
              ...values
            }
          : assignment
      )
    );
  };

  const removeAssignment = (userId: string) => {
    onChange(
      assignments.filter(
        (assignment) =>
          assignment.userId !== userId
      )
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <span
          className="
            mb-1
            block
            text-sm
            font-medium
            text-slate-700
          "
        >
          {tr("Responsáveis", "Assignees")}
        </span>

        {projectUsers.length === 0 && (
          <p className="text-sm text-slate-500">
            {tr("Adicione usuários ao projeto antes de atribuir tarefas.", "Add users to the project before assigning tasks.")}
          </p>
        )}
      </div>

      {projectUsers.length > 0 && (
        <div
          className="
            grid
            grid-cols-1
            gap-3
            rounded-lg
            border
            border-slate-200
            p-3
            md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))_auto]
          "
        >
          <select
            value={selectedUserId}
            onChange={(event) =>
              setSelectedUserId(
                event.target.value
              )
            }
            className="
              rounded-lg
              border
              border-slate-300
              px-3
              py-2
              text-sm
              outline-none
              focus:border-slate-900
            "
          >
            <option value="">
              {tr("Selecione um usuário", "Select user")}
            </option>

            {availableUsers.map((user) => (
              <option
                key={user.id}
                value={user.id}
              >
                {user.name} ({roleLabel(user.role)})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={estimatedStartDate}
            onChange={(event) =>
              setEstimatedStartDate(
                event.target.value
              )
            }
            className="
              rounded-lg
              border
              border-slate-300
              px-3
              py-2
              text-sm
              outline-none
              focus:border-slate-900
            "
          />

          <input
            type="date"
            value={estimatedEndDate}
            onChange={(event) =>
              setEstimatedEndDate(
                event.target.value
              )
            }
            className="
              rounded-lg
              border
              border-slate-300
              px-3
              py-2
              text-sm
              outline-none
              focus:border-slate-900
            "
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as TaskStatus
              )
            }
            className="
              rounded-lg
              border
              border-slate-300
              px-3
              py-2
              text-sm
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

          <button
            type="button"
            onClick={handleAddAssignment}
            disabled={!canAddAssignment}
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
          {tr("Adicionar", "Add")}
          </button>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="space-y-2">
          {assignments.map((assignment) => {
            const user = projectUsers.find(
              (projectUser) =>
                projectUser.id ===
                assignment.userId
            );

            return (
              <div
                key={assignment.userId}
                className="
                  grid
                  grid-cols-1
                  gap-3
                  rounded-lg
                  border
                  border-slate-200
                  p-3
                  md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))_auto]
                "
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {user?.name ?? tr("Usuário desconhecido", "Unknown user")}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user?.email}
                  </p>
                </div>

                <input
                  type="date"
                  value={
                    assignment.estimatedStartDate
                  }
                  onChange={(event) =>
                    updateAssignment(
                      assignment.userId,
                      {
                        estimatedStartDate:
                          event.target.value
                      }
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-slate-300
                    px-3
                    py-2
                    text-sm
                    outline-none
                    focus:border-slate-900
                  "
                />

                <input
                  type="date"
                  value={
                    assignment.estimatedEndDate
                  }
                  onChange={(event) =>
                    updateAssignment(
                      assignment.userId,
                      {
                        estimatedEndDate:
                          event.target.value
                      }
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-slate-300
                    px-3
                    py-2
                    text-sm
                    outline-none
                    focus:border-slate-900
                  "
                />

                <select
                  value={assignment.status}
                  onChange={(event) =>
                    updateAssignment(
                      assignment.userId,
                      {
                        status:
                          event.target
                            .value as TaskStatus
                      }
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-slate-300
                    px-3
                    py-2
                    text-sm
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

                <button
                  type="button"
                  onClick={() =>
                    removeAssignment(
                      assignment.userId
                    )
                  }
                  className="
                    rounded-lg
                    border
                    px-3
                    py-2
                    text-sm
                    hover:bg-slate-100
                  "
                >
                  {tr("Remover", "Remove")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
