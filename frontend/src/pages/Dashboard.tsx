import { useQuery } from "@apollo/client/react";

import { PROJECTS_QUERY } from "../graphql/queries/projects";
import { DASHBOARD_STATS_QUERY } from "../graphql/queries/dashboard";

import ProjectCard from "../components/projects/ProjectCard";
import StatsCard from "../components/dashboard/StatsCard";

import type { Project } from "../types/Project";
import type { DashboardStats } from "../types/DashboardStats";
import { useI18n } from "../lib/i18n";

type ProjectsQueryData = {
  projects: Project[];
};

export default function Dashboard() {
  const { tr } = useI18n();
  const { data, loading } =
    useQuery<ProjectsQueryData>(
      PROJECTS_QUERY,
      {
        fetchPolicy: "cache-and-network"
      }
    );
  const projectCount =
    data?.projects.length ?? 0;

  type DashboardStatsQueryData = {
    dashboardStats: DashboardStats;
  };
  const { data: statsData } =
    useQuery<DashboardStatsQueryData>(
      DASHBOARD_STATS_QUERY,
      {
        fetchPolicy: "cache-and-network"
      }
    );

  return (
    <div>
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-4
          gap-6
          mb-8
        "
      >
        <StatsCard
          title={tr("Projetos", "Projects")}
          value={
            statsData?.dashboardStats
              .totalProjects ?? 0
          }
        />

        <StatsCard
          title={tr("Tarefas", "Tasks")}
          value={
            statsData?.dashboardStats
              .totalTasks ?? 0
          }
        />

        <StatsCard
          title={tr("Concluídas", "Completed")}
          value={
            statsData?.dashboardStats
              .completedTasks ?? 0
          }
        />

        <StatsCard
          title={tr("Equipe", "Team")}
          value={
            statsData?.dashboardStats
              .teamMembers ?? 0
          }
        />
      </div>

      <h3
        className="
          text-xl
          font-semibold
          mb-4
        "
      >
        {tr("Projetos recentes", "Recent Projects")}
      </h3>

      {loading && (
        <p>{tr("Carregando projetos...", "Loading projects...")}</p>
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
        {data?.projects.map(
          (project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              description={project.description}
              progress={project.progress}
              status={project.status}
            />
          )
        )}
      </div>
    </div>
  );
}
