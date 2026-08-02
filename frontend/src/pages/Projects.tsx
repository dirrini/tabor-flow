import {
  useMemo,
  useState
} from "react";
import {
  useMutation,
  useQuery
} from "@apollo/client/react";
import { Link } from "react-router-dom";

import CreateProjectDialog, {
  type CreateProjectFormValues
} from "../components/projects/CreateProjectDialog";
import ProjectCard from "../components/projects/ProjectCard";
import SearchBar from "../components/projects/SearchBar";

import { useProjects } from "../hooks/useProjects";
import {
  CREATE_PROJECT_MUTATION,
  PROJECTS_QUERY
} from "../graphql/queries/projects";
import { ME_QUERY }
  from "../graphql/queries/auth";
import { useI18n } from "../lib/i18n";

type MeQueryData = {
  me: {
    role: string;
    tenant: {
      plan: "FREE" | "PREMIUM";
      usage: {
        activeProjects: number;
        activeProjectLimit: number | null;
      };
    };
  } | null;
};

export default function Projects() {
  const { tr } = useI18n();
  const { data, loading } = useProjects();
  const { data: meData } =
    useQuery<MeQueryData>(ME_QUERY);
  const canManageProjects =
    meData?.me?.role === "ADMIN" ||
    meData?.me?.role ===
      "PROJECT_MANAGER";
  const projectUsage =
    meData?.me?.tenant.usage;
  const activeProjectLimitReached = Boolean(
    projectUsage?.activeProjectLimit !== null &&
      projectUsage?.activeProjectLimit !== undefined &&
      projectUsage.activeProjects >=
        projectUsage.activeProjectLimit
  );
  const [
    createProject,
    { loading: creating, error: createError }
  ] = useMutation(CREATE_PROJECT_MUTATION, {
    refetchQueries: [
      { query: PROJECTS_QUERY },
      { query: ME_QUERY }
    ]
  });
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);
  const [statusFilter, setStatusFilter] =
    useState<
      "ALL" |
      "ON_TRACK" |
      "AT_RISK" |
      "COMPLETED"
    >("ALL");

  const filteredProjects =
    useMemo(() => {
      if (!data?.projects)
        return [];

      return data.projects.filter(
        (project) => {

          const matchesSearch =
            project.name
              .toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesStatus =
            statusFilter === "ALL"
              ? true
              : project.status ===
                statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      data,
      search,
      statusFilter
    ]);

  const closeCreateDialog = () => {
    setIsCreateOpen(false);
  };

  const handleCreateProject = async (
    values: CreateProjectFormValues
  ) => {
    await createProject({
      variables: {
        input: values
      }
    });

    closeCreateDialog();
  };

  return (
    <div>
      <div
        className="
          flex
          justify-between
          items-center
          mb-4
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <span
            className="
              text-sm
              text-slate-500
            "
          >
            {filteredProjects.length}
            {" "}
            {tr("projetos", "projects")}
          </span>

          {canManageProjects && !activeProjectLimitReached && (
            <button
              type="button"
              onClick={() =>
                setIsCreateOpen(true)
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
              "
            >
              {tr("Novo projeto", "New project")}
            </button>
          )}
          {canManageProjects && activeProjectLimitReached && meData?.me?.role === "ADMIN" && (
            <Link
              to="/app/workspace"
              className="rounded-lg bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-200"
            >
              {tr("Limite atingido · Fazer upgrade", "Limit reached · Upgrade")}
            </Link>
          )}
          {canManageProjects && activeProjectLimitReached && meData?.me?.role !== "ADMIN" && (
            <span className="rounded-lg bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
              {tr("Limite do plano atingido", "Plan limit reached")}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-slate-500">
          {tr("Gerencie e acompanhe todos os projetos ativos.", "Manage and monitor all active projects.")}
        </p>
      </div>

      <div className="mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
        />
      </div>

      <div
        className="
          flex
          gap-2
          mb-6
          flex-wrap
        "
      >
        {[
          "ALL",
          "ON_TRACK",
          "AT_RISK",
          "COMPLETED"
        ].map((status) => (
          <button
            key={status}
            onClick={() =>
              setStatusFilter(
                status as
                  | "ALL"
                  | "ON_TRACK"
                  | "AT_RISK"
                  | "COMPLETED"
              )
            }
            className={`
              px-4
              py-2
              rounded-lg
              border
              text-sm
              transition

              ${
                statusFilter === status
                  ? "bg-slate-900 text-white"
                  : "bg-white hover:bg-slate-100"
              }
            `}
          >
            {{
              ALL: tr("Todos", "All"),
              ON_TRACK: tr("No prazo", "On Track"),
              AT_RISK: tr("Em risco", "At Risk"),
              COMPLETED: tr("Concluídos", "Completed")
            }[status]}
          </button>
        ))}
      </div>

      {loading && (
        <p>{tr("Carregando projetos...", "Loading projects...")}</p>
      )}

      {!loading &&
        filteredProjects.length === 0 && (
          <div
            className="
              bg-white
              rounded-xl
              border
              p-10
              text-center
            "
          >
            {tr("Nenhum projeto encontrado.", "No projects found.")}
          </div>
        )}

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-3
          gap-6
        "
      >
        {filteredProjects.map(
          (project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              description={
                project.description
              }
              progress={
                project.progress
              }
              status={
                project.status
              }
            />
          )
        )}
      </div>

      {isCreateOpen && canManageProjects && !activeProjectLimitReached && (
        <CreateProjectDialog
          creating={creating}
          errorMessage={
            createError
              ? tr("Não foi possível criar o projeto.", "Could not create project.")
              : undefined
          }
          onClose={closeCreateDialog}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  );
}
