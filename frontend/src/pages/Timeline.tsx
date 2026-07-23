import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  useMutation,
  useQuery
}
  from "@apollo/client/react";
import {
  Plus,
  X
} from "lucide-react";
import moment from "moment";
import {
  Timeline as VisTimeline,
  type DataGroup,
  type DataItem,
  type MomentConstructor,
  type TimelineItem,
  type TimelineOptions
} from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

import CreateTaskDialog, {
  type CreateTaskFormValues
} from "../components/projects/CreateTaskDialog";
import EditTaskDialog, {
  type EditTaskFormValues
} from "../components/projects/EditTaskDialog";
import StatusBadge from "../components/projects/StatusBadge";
import {
  CREATE_TASK_MUTATION,
  UPDATE_TASK_MUTATION
}
  from "../graphql/queries/projects";
import { TIMELINE_PROJECTS_QUERY }
  from "../graphql/queries/timeline";

import type {
  Project,
  Task,
  TaskStatus,
  TaskUser
} from "../types/Project";
import { useI18n } from "../lib/i18n";
import type { User }
  from "../types/User";

type TimelineProjectsData = {
  timelineProjects: Project[];
};

type TimelineAssignment = TaskUser & {
  task: Task;
};

type TimelineTaskItem = DataItem & {
  taskDescription?: string;
  taskTitle?: string;
};

moment.locale("en");

const englishMoment =
  moment as MomentConstructor;

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getUserInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getTimelineUserLabel(user: User) {
  const initials =
    getUserInitials(user.name) || "U";
  const label = document.createElement("div");
  const avatar = document.createElement("span");
  const name = document.createElement("span");
  const hideButton =
    document.createElement("button");

  label.className = "timeline-user-label";
  avatar.className = "timeline-user-avatar";
  name.className = "timeline-user-name";
  hideButton.className = "timeline-user-hide";
  hideButton.type = "button";
  hideButton.title = "Hide user";
  hideButton.ariaLabel = `Hide ${user.name}`;
  hideButton.dataset.userId = user.id;
  avatar.textContent = initials;
  name.textContent = user.name;
  hideButton.textContent = "x";

  label.append(avatar, name, hideButton);

  return label;
}

function addOneDay(date: string) {
  const nextDate = new Date(`${date}T00:00:00`);
  nextDate.setDate(nextDate.getDate() + 1);

  return nextDate;
}

function subtractOneDay(date: Date) {
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);

  return previousDate;
}

function startOfDay(date: Date) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  return normalizedDate;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1)
    .padStart(2, "0");
  const day = String(date.getDate())
    .padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateId(date: Date) {
  return formatLocalDate(date);
}

function getMonthRange() {
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );
  const end = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  );

  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end)
  };
}

function getDateFromInput(value: string) {
  return startOfDay(
    new Date(`${value}T00:00:00`)
  );
}

function getTimelineWindow(
  startDate: string,
  endDate: string
) {
  const minDate =
    getDateFromInput(startDate);
  const maxDate = addOneDay(endDate);

  return {
    minDate,
    maxDate
  };
}

function getAssignmentClass(
  status: TaskStatus
) {
  if (status === "DONE")
    return "timeline-item-done";

  if (status === "IN_PROGRESS")
    return "timeline-item-in-progress";

  return "timeline-item-todo";
}

function getTimelineTaskContent(task: {
  title: string;
  description?: string | null;
}) {
  const description =
    task.description?.trim();
  const content =
    document.createElement("div");
  const title =
    document.createElement("span");

  content.className =
    "timeline-task-content";
  title.className = "timeline-task-title";
  title.textContent = task.title;
  content.append(title);

  if (description) {
    const descriptionElement =
      document.createElement("span");

    descriptionElement.className =
      "timeline-task-description";
    descriptionElement.textContent =
      description;
    content.append(descriptionElement);
  }

  return content;
}

function buildTimelineGroups(
  users: User[]
): DataGroup[] {
  return users.map((user) => ({
    id: user.id,
    content: getTimelineUserLabel(user),
    title: user.email
  }));
}

function buildTimelineItems(
  assignments: TimelineAssignment[]
): TimelineTaskItem[] {
  return assignments.map((assignment) => ({
    id: assignment.id,
    group: assignment.user.id,
    content: assignment.task.title,
    taskDescription:
      assignment.task.description ?? "",
    taskTitle: assignment.task.title,
    start: new Date(
      `${assignment.estimatedStartDate}T00:00:00`
    ),
    end: addOneDay(
      assignment.estimatedEndDate
    ),
    type: "range",
    editable: {
      remove: false,
      updateGroup: false,
      updateTime: true
    },
    className: getAssignmentClass(
      assignment.status
    )
  }));
}

function buildWeekendItems(
  startDate: string,
  endDate: string
): DataItem[] {
  const {
    minDate,
    maxDate
  } = getTimelineWindow(
    startDate,
    endDate
  );
  const cursor = startOfDay(minDate);
  const finalDate = startOfDay(maxDate);
  const weekendItems: DataItem[] = [];

  while (cursor <= finalDate) {
    const day = cursor.getDay();

    if (day === 0 || day === 6) {
      const start = new Date(cursor);
      const end = new Date(cursor);
      end.setDate(end.getDate() + 1);

      weekendItems.push({
        id: `weekend-${formatDateId(start)}`,
        content: "",
        start,
        end,
        type: "background",
        editable: false,
        selectable: false,
        className: "timeline-weekend"
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return weekendItems;
}

function buildTimelineOptions(
  startDate: string,
  endDate: string
): TimelineOptions {
  const {
    minDate,
    maxDate
  } = getTimelineWindow(
    startDate,
    endDate
  );

  return {
    editable: {
      add: false,
      remove: false,
      updateGroup: false,
      updateTime: true
    },
    stack: true,
    selectable: true,
    locale: "en",
    moment: englishMoment,
    orientation: {
      axis: "top",
      item: "bottom"
    },
    horizontalScroll: false,
    min: minDate,
    max: maxDate,
    moveable: true,
    zoomable: true,
    zoomFriction: 8,
    zoomKey: "",
    zoomMax:
      maxDate.getTime() -
      minDate.getTime(),
    zoomMin: 1000 * 60 * 60 * 24,
    template: (item) => {
      const taskItem =
        item as TimelineTaskItem;

      return getTimelineTaskContent({
        title:
          taskItem.taskTitle ??
          String(taskItem.content ?? ""),
        description:
          taskItem.taskDescription ?? ""
      });
    },
    margin: {
      axis: 18,
      item: {
        horizontal: 0,
        vertical: 20
      }
    }
  };
}

export default function Timeline() {
  const { tr } = useI18n();
  const containerRef =
    useRef<HTMLDivElement | null>(null);
  const timelineRef =
    useRef<VisTimeline | null>(null);
  const [
    selectedProjectId,
    setSelectedProjectId
  ] = useState("");
  const initialDateRange = useMemo(
    () => getMonthRange(),
    []
  );
  const [
    rangeStartDate,
    setRangeStartDate
  ] = useState(initialDateRange.start);
  const [
    rangeEndDate,
    setRangeEndDate
  ] = useState(initialDateRange.end);
  const [
    hiddenUserIds,
    setHiddenUserIds
  ] = useState<Set<string>>(
    () => new Set()
  );
  const [
    isTaskDialogOpen,
    setIsTaskDialogOpen
  ] = useState(false);
  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const {
    data,
    loading,
    error
  } = useQuery<TimelineProjectsData>(
    TIMELINE_PROJECTS_QUERY,
    {
      fetchPolicy: "cache-and-network"
    }
  );
  const [
    updateTask,
    {
      loading: updatingTask,
      error: updateTaskError
    }
  ] = useMutation(
    UPDATE_TASK_MUTATION,
    {
      refetchQueries: [
        {
          query: TIMELINE_PROJECTS_QUERY
        }
      ],
      awaitRefetchQueries: true
    }
  );
  const [
    createTask,
    {
      loading: creatingTask,
      error: createTaskError
    }
  ] = useMutation(
    CREATE_TASK_MUTATION,
    {
      refetchQueries: [
        {
          query: TIMELINE_PROJECTS_QUERY
        }
      ],
      awaitRefetchQueries: true
    }
  );

  const projects =
    data?.timelineProjects ?? [];

  useEffect(() => {
    if (
      selectedProjectId ||
      projects.length === 0
    ) {
      return;
    }

    setSelectedProjectId(projects[0].id);
  }, [projects, selectedProjectId]);

  useEffect(() => {
    setHiddenUserIds(new Set());
  }, [selectedProjectId]);

  useEffect(() => {
    if (rangeStartDate > rangeEndDate) {
      setRangeEndDate(rangeStartDate);
    }
  }, [rangeEndDate, rangeStartDate]);

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) =>
          project.id === selectedProjectId
      ) ?? projects[0],
    [projects, selectedProjectId]
  );

  const projectUsers = useMemo(
    () =>
      selectedProject?.users?.filter(
        (user) =>
          user.role === "PROJECT_MANAGER" ||
          user.role === "MEMBER"
      ) ?? [],
    [selectedProject]
  );
  const visibleProjectUsers = useMemo(
    () =>
      projectUsers.filter(
        (user) =>
          !hiddenUserIds.has(user.id)
      ),
    [hiddenUserIds, projectUsers]
  );
  const hiddenProjectUsers = useMemo(
    () =>
      projectUsers.filter((user) =>
        hiddenUserIds.has(user.id)
      ),
    [hiddenUserIds, projectUsers]
  );

  const assignments = useMemo(
    () =>
      selectedProject?.tasks?.flatMap(
        (task) =>
          task.users.map((taskUser) => ({
            ...taskUser,
            task
          }))
      ) ?? [],
    [selectedProject]
  );
  const visibleAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          !hiddenUserIds.has(
            assignment.user.id
          )
      ),
    [assignments, hiddenUserIds]
  );

  const completedAssignments =
    assignments.filter(
      (assignment) =>
        assignment.status === "DONE"
    ).length;

  const timelineOptions = useMemo(
    () =>
      buildTimelineOptions(
        rangeStartDate,
        rangeEndDate
      ),
    [rangeEndDate, rangeStartDate]
  );

  const handleCreateTask = async (
    values: CreateTaskFormValues
  ) => {
    if (!selectedProject)
      return;

    await createTask({
      variables: {
        input: {
          ...values,
          projectId: selectedProject.id
        }
      }
    });

    setIsTaskDialogOpen(false);
  };

  const handleUpdateTask = async (
    values: EditTaskFormValues
  ) => {
    if (!editingTask)
      return;

    await updateTask({
      variables: {
        id: editingTask.id,
        input: values
      }
    });

    setEditingTask(null);
  };

  const handleResizeAssignment = async (
    item: TimelineItem,
    callback: (
      item: TimelineItem | null
    ) => void
  ) => {
    const assignmentId =
      item.id?.toString();
    const selectedAssignment =
      assignments.find(
        (assignment) =>
          assignment.id === assignmentId
      );

    if (
      !selectedAssignment ||
      !item.start ||
      !item.end
    ) {
      callback(null);
      return;
    }

    const nextStartDate =
      formatLocalDate(
        startOfDay(new Date(item.start))
      );
    const nextEndDate =
      formatLocalDate(
        subtractOneDay(
          startOfDay(new Date(item.end))
        )
      );
    const currentStartDate =
      selectedAssignment.estimatedStartDate;
    const currentEndDate =
      selectedAssignment.estimatedEndDate;
    const changedStart =
      nextStartDate !== currentStartDate;
    const changedEnd =
      nextEndDate !== currentEndDate;

    if (
      (!changedStart && !changedEnd) ||
      nextStartDate > nextEndDate
    ) {
      callback(null);
      return;
    }

    callback(item);

    await updateTask({
      variables: {
        id: selectedAssignment.task.id,
        input: {
          users:
            selectedAssignment.task.users.map(
              (taskUser) => ({
                userId: taskUser.user.id,
                status: taskUser.status,
                estimatedStartDate:
                  taskUser.id === assignmentId
                    ? nextStartDate
                    : taskUser.estimatedStartDate,
                estimatedEndDate:
                  taskUser.id === assignmentId
                    ? nextEndDate
                    : taskUser.estimatedEndDate
              })
            )
        }
      }
    });
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !selectedProject) {
      return;
    }

    const groups =
      buildTimelineGroups(visibleProjectUsers);
    const items = [
      ...buildWeekendItems(
        rangeStartDate,
        rangeEndDate
      ),
      ...buildTimelineItems(
        visibleAssignments
      )
    ];
    const options: TimelineOptions = {
      ...timelineOptions,
      onMove: (item, callback) => {
        void handleResizeAssignment(
          item,
          callback
        );
      }
    };

    if (!timelineRef.current) {
      timelineRef.current = new VisTimeline(
        container,
        items,
        groups,
        options
      );
    } else {
      timelineRef.current.setGroups(groups);
      timelineRef.current.setItems(items);
      timelineRef.current.setOptions(
        options
      );
    }

    const handleDoubleClick = (properties: {
      item?: string | number;
    }) => {
      const selectedAssignmentId =
        properties.item?.toString();

      if (!selectedAssignmentId)
        return;

      const selectedAssignment =
        assignments.find(
          (assignment) =>
            assignment.id ===
            selectedAssignmentId
        );

      if (selectedAssignment) {
        setEditingTask(
          selectedAssignment.task
        );
      }
    };

    timelineRef.current.on(
      "doubleClick",
      handleDoubleClick
    );

    const handleTimelineClick = (
      event: MouseEvent
    ) => {
      const target =
        event.target as HTMLElement;
      const hideButton =
        target.closest<HTMLButtonElement>(
          ".timeline-user-hide"
        );

      if (!hideButton?.dataset.userId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const userId =
        hideButton.dataset.userId;

      setHiddenUserIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.add(userId);
        return nextIds;
      });
    };

    container.addEventListener(
      "click",
      handleTimelineClick
    );

    const {
      minDate,
      maxDate
    } = getTimelineWindow(
      rangeStartDate,
      rangeEndDate
    );

    timelineRef.current.setWindow(
      minDate,
      maxDate,
      {
        animation: false
      }
    );

    return () => {
      timelineRef.current?.off(
        "doubleClick",
        handleDoubleClick
      );
      container.removeEventListener(
        "click",
        handleTimelineClick
      );
    };
  }, [
    assignments,
    rangeEndDate,
    rangeStartDate,
    selectedProject,
    timelineOptions,
    visibleAssignments,
    visibleProjectUsers
  ]);

  useEffect(
    () => () => {
      timelineRef.current?.destroy();
      timelineRef.current = null;
    },
    []
  );

  if (loading && projects.length === 0) {
    return <p>{tr("Carregando cronograma...", "Loading timeline...")}</p>;
  }

  if (error) {
    return (
      <div
        className="
          rounded-xl
          border
          bg-white
          p-10
          text-center
          text-slate-500
        "
      >
        {tr("Você não tem acesso ao cronograma.", "You do not have access to the timeline.")}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div
        className="
          rounded-xl
          border
          bg-white
          p-10
          text-center
          text-slate-500
        "
      >
        {tr("Não há projetos disponíveis para o cronograma.", "No projects available for timeline view.")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-start
          md:justify-between
        "
      >
        <div>
          <p className="mt-1 text-sm text-slate-500">
            {tr("Mantenha seus projetos no prazo. Acompanhe a distribuição de trabalho e as datas estimadas de entrega de toda a equipe em uma visão dinâmica.", "Keep your projects on schedule. Monitor workload distribution and track estimated delivery dates across your entire team in one dynamic timeline view.")}
          </p>
        </div>

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
            {tr("Projeto", "Project")}
          </span>
          <select
            value={
              selectedProject?.id ?? ""
            }
            onChange={(event) =>
              setSelectedProjectId(
                event.target.value
              )
            }
            className="
              min-w-64
              rounded-lg
              border
              border-slate-300
              bg-white
              px-3
              py-2
              text-sm
              outline-none
              focus:border-slate-900
            "
          >
            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedProject && (
        <section
          className="
            rounded-xl
            border
            bg-white
            p-5
            shadow-sm
          "
        >
          <div
            className="
              mb-5
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >
            <div>
              <div
                className="
                  mb-2
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >
                <h3
                  className="
                    text-xl
                    font-semibold
                    text-slate-900
                  "
                >
                  {selectedProject.name}
                </h3>

                <StatusBadge
                  status={
                    selectedProject.status
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setIsTaskDialogOpen(true)
                  }
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-slate-300
                    text-slate-600
                    transition
                    hover:bg-slate-100
                    hover:text-slate-900
                  "
                  aria-label="Add task"
                  title="Add task"
                >
                  <Plus size={16} />
                </button>
              </div>

              <p className="text-sm text-slate-500">
                {selectedProject.description}
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-3
                gap-3
                text-center
              "
            >
              <div
                className="
                  rounded-lg
                  bg-slate-50
                  px-4
                  py-3
                "
              >
                <p className="text-lg font-semibold">
                  {projectUsers.length}
                </p>
                <p className="text-xs text-slate-500">
                  {tr("Usuários", "Users")}
                </p>
              </div>

              <div
                className="
                  rounded-lg
                  bg-slate-50
                  px-4
                  py-3
                "
              >
                <p className="text-lg font-semibold">
                  {assignments.length}
                </p>
                <p className="text-xs text-slate-500">
                  {tr("Atribuições", "Assignments")}
                </p>
              </div>

              <div
                className="
                  rounded-lg
                  bg-slate-50
                  px-4
                  py-3
                "
              >
                <p className="text-lg font-semibold">
                  {completedAssignments}
                </p>
                <p className="text-xs text-slate-500">
                  {tr("Concluídas", "Done")}
                </p>
              </div>
            </div>
          </div>

          <div
            className="
              mb-5
              flex
              flex-col
              gap-3
              rounded-lg
              bg-slate-50
              p-3
              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div
              className="
                grid
                grid-cols-1
                gap-3
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
                  {tr("Início", "Start")}
                </span>
                <input
                  type="date"
                  value={rangeStartDate}
                  onChange={(event) =>
                    setRangeStartDate(
                      event.target.value
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-3
                    py-2
                    text-sm
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
                  {tr("Fim", "End")}
                </span>
                <input
                  type="date"
                  value={rangeEndDate}
                  min={rangeStartDate}
                  onChange={(event) =>
                    setRangeEndDate(
                      event.target.value
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-3
                    py-2
                    text-sm
                    outline-none
                    focus:border-slate-900
                  "
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                const monthRange =
                  getMonthRange();
                setRangeStartDate(
                  monthRange.start
                );
                setRangeEndDate(
                  monthRange.end
                );
              }}
              className="
                rounded-lg
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-slate-700
                transition
                hover:bg-slate-100
              "
            >
              {tr("Mês atual", "Current month")}
            </button>
          </div>

          {hiddenProjectUsers.length > 0 && (
            <div
              className="
                mb-4
                flex
                flex-wrap
                gap-2
              "
            >
              {hiddenProjectUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() =>
                    setHiddenUserIds(
                      (currentIds) => {
                        const nextIds =
                          new Set(currentIds);
                        nextIds.delete(user.id);
                        return nextIds;
                      }
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-slate-300
                    bg-white
                    px-3
                    py-1.5
                    text-xs
                    font-medium
                    text-slate-600
                    transition
                    hover:bg-slate-100
                    hover:text-slate-900
                  "
                >
                  <X size={14} />
                  {tr("Mostrar", "Show")} {user.name}
                </button>
              ))}
            </div>
          )}

          {assignments.length === 0 && (
            <div
              className="
                mb-4
                rounded-xl
                border
                border-dashed
                p-10
                text-center
                text-slate-500
              "
            >
              {tr("Ainda não há atribuições de tarefas com datas estimadas.", "No task assignments with estimated dates yet.")}
            </div>
          )}

          <div
            className="
              mb-4
              flex
              flex-wrap
              gap-3
              text-xs
              text-slate-600
            "
          >
            <span className="timeline-legend timeline-legend-todo">
              {tr("A fazer", "To do")}
            </span>
            <span className="timeline-legend timeline-legend-in-progress">
              {tr("Em andamento", "In progress")}
            </span>
            <span className="timeline-legend timeline-legend-done">
              {tr("Concluída", "Done")}
            </span>
          </div>

          <div
            ref={containerRef}
            className="
              timeline-viewer
              rounded-lg
              border
              border-slate-200
            "
          />
        </section>
      )}

      {isTaskDialogOpen && selectedProject && (
        <CreateTaskDialog
          creating={creatingTask}
          projectUsers={projectUsers}
          errorMessage={
            createTaskError
              ? tr("Não foi possível criar a tarefa.", "Could not create task.")
              : undefined
          }
          onClose={() =>
            setIsTaskDialogOpen(false)
          }
          onCreate={handleCreateTask}
        />
      )}

      {editingTask && selectedProject && (
        <EditTaskDialog
          task={editingTask}
          saving={updatingTask}
          projectUsers={projectUsers}
          errorMessage={
            updateTaskError
              ? tr("Não foi possível atualizar a tarefa.", "Could not update task.")
              : undefined
          }
          onClose={() =>
            setEditingTask(null)
          }
          onSave={handleUpdateTask}
        />
      )}
    </div>
  );
}
