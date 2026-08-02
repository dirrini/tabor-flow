import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  BarChart3,
  CheckCircle2,
  Crown,
  Download,
  FolderKanban,
  LockKeyhole,
  TriangleAlert,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

import { ME_QUERY } from "../graphql/queries/auth";
import { PROJECTS_QUERY } from "../graphql/queries/projects";
import {
  PORTFOLIO_REPORT_QUERY,
  PROJECT_HEALTH_REPORT_QUERY
} from "../graphql/queries/reports";
import { useI18n } from "../lib/i18n";
import type { Project } from "../types/Project";

type ProjectHealth = {
  projectId: string;
  projectName: string;
  status: string;
  progress: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  assignedUsers: number;
  overdueAssignments: number;
};

type PortfolioProjectRow = {
  projectId: string;
  projectName: string;
  status: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  assignedUsers: number;
  overdueAssignments: number;
};

type WorkloadRow = {
  userId: string;
  userName: string;
  assignedTasks: number;
  completedAssignments: number;
  overdueAssignments: number;
};

type PortfolioReport = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  atRiskProjects: number;
  averageProgress: number;
  totalTasks: number;
  completedTasks: number;
  overdueAssignments: number;
  projects: PortfolioProjectRow[];
  workload: WorkloadRow[];
};

export default function Reports() {
  const { tr } = useI18n();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { data: meData } = useQuery<{
    me: {
      role: string;
      tenant: { plan: "FREE" | "PREMIUM" };
    } | null;
  }>(ME_QUERY);
  const { data: projectsData, loading: loadingProjects } = useQuery<{
    projects: Project[];
  }>(PROJECTS_QUERY, { fetchPolicy: "cache-and-network" });
  const projects = projectsData?.projects ?? [];
  const isPremium = meData?.me?.tenant.plan === "PREMIUM";
  const isAdmin = meData?.me?.role === "ADMIN";

  useEffect(() => {
    if (!selectedProjectId && projects[0]) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data: healthData, loading: loadingHealth } = useQuery<{
    projectHealthReport: ProjectHealth;
  }>(PROJECT_HEALTH_REPORT_QUERY, {
    variables: { projectId: selectedProjectId },
    skip: !selectedProjectId,
    fetchPolicy: "cache-and-network"
  });
  const { data: portfolioData, loading: loadingPortfolio } = useQuery<{
    portfolioReport: PortfolioReport;
  }>(PORTFOLIO_REPORT_QUERY, {
    skip: !isPremium,
    fetchPolicy: "cache-and-network"
  });
  const health = healthData?.projectHealthReport;
  const portfolio = portfolioData?.portfolioReport;
  const filteredPortfolioProjects = useMemo(
    () =>
      portfolio?.projects.filter(
        (project) => statusFilter === "ALL" || project.status === statusFilter
      ) ?? [],
    [portfolio?.projects, statusFilter]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="rounded-2xl border bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-[.14em] text-emerald-700">
                {tr("Disponível no Free", "Available on Free")}
              </p>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                Free
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {tr("Saúde do projeto", "Project health")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {tr(
                "Acompanhe um projeto por vez, sem custo, e identifique riscos rapidamente.",
                "Review one project at a time for free and identify risks quickly."
              )}
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              {tr("Projeto", "Project")}
            </span>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              disabled={loadingProjects || projects.length === 0}
              className="min-w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:opacity-60"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {projects.length === 0 && !loadingProjects && (
          <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
            {tr("Crie um projeto para gerar seu primeiro relatório.", "Create a project to generate your first report.")}
          </p>
        )}
        {loadingHealth && <p className="mt-6 text-sm text-slate-500">{tr("Gerando relatório...", "Generating report...")}</p>}
        {health && (
          <div className="mt-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-950">{health.projectName}</p>
                <p className="mt-1 text-sm text-slate-500">{formatStatus(health.status, tr)}</p>
              </div>
              <div className="w-full max-w-xs">
                <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                  <span>{tr("Progresso", "Progress")}</span>
                  <span>{health.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${health.progress}%` }} />
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <ReportMetric label={tr("Tarefas", "Tasks")} value={health.totalTasks} />
              <ReportMetric label={tr("A fazer", "To do")} value={health.todoTasks} />
              <ReportMetric label={tr("Em andamento", "In progress")} value={health.inProgressTasks} />
              <ReportMetric label={tr("Concluídas", "Completed")} value={health.completedTasks} />
              <ReportMetric label={tr("Pessoas", "People")} value={health.assignedUsers} />
              <ReportMetric label={tr("Atribuições atrasadas", "Overdue assignments")} value={health.overdueAssignments} warning={health.overdueAssignments > 0} />
            </div>
          </div>
        )}
      </section>

      {!isPremium ? (
        <PremiumTeaser isAdmin={isAdmin} tr={tr} />
      ) : (
        <PremiumPortfolio
          report={portfolio}
          loading={loadingPortfolio}
          projects={filteredPortfolioProjects}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          tr={tr}
        />
      )}
    </div>
  );
}

function PremiumTeaser({ isAdmin, tr }: { isAdmin: boolean; tr: Translator }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-7 text-white shadow-sm sm:p-9">
      <Crown className="absolute -right-8 -top-8 h-40 w-40 text-orange-400/10" />
      <div className="relative max-w-3xl">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.14em] text-orange-300">
          <LockKeyhole size={16} /> Premium
        </p>
        <h2 className="mt-3 text-3xl font-semibold">
          {tr("Veja o portfólio inteiro em uma única análise", "Analyze your entire portfolio in one view")}
        </h2>
        <p className="mt-3 leading-7 text-white/60">
          {tr(
            "Compare projetos, acompanhe carga por pessoa, encontre atrasos e exporte os dados para compartilhar com sua equipe.",
            "Compare projects, review workload by person, find delays, and export data to share with your team."
          )}
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[tr("Visão consolidada", "Consolidated view"), tr("Carga da equipe", "Team workload"), tr("Exportação CSV", "CSV export")].map((item) => (
            <p key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/80">
              <CheckCircle2 size={17} className="text-orange-300" /> {item}
            </p>
          ))}
        </div>
        {isAdmin ? (
          <Link to="/app/workspace" className="mt-7 inline-flex rounded-lg bg-orange-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-300">
            {tr("Conhecer o Premium", "Explore Premium")}
          </Link>
        ) : (
          <p className="mt-7 text-sm text-white/60">
            {tr("Solicite o upgrade ao administrador do workspace.", "Ask the workspace administrator to upgrade the plan.")}
          </p>
        )}
      </div>
    </section>
  );
}

function PremiumPortfolio({ report, loading, projects, statusFilter, setStatusFilter, tr }: {
  report?: PortfolioReport;
  loading: boolean;
  projects: PortfolioProjectRow[];
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  tr: Translator;
}) {
  if (loading && !report) return <p className="text-sm text-slate-500">{tr("Gerando visão consolidada...", "Generating consolidated view...")}</p>;
  if (!report) return null;

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.14em] text-orange-600">Premium</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{tr("Visão consolidada", "Portfolio overview")}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton label={tr("Exportar projetos", "Export projects")} onClick={() => exportProjects(report.projects, tr)} />
          <ExportButton label={tr("Exportar carga", "Export workload")} onClick={() => exportWorkload(report.workload, tr)} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <SummaryCard icon={<FolderKanban size={18} />} label={tr("Projetos", "Projects")} value={report.totalProjects} />
        <SummaryCard icon={<BarChart3 size={18} />} label={tr("Ativos", "Active")} value={report.activeProjects} />
        <SummaryCard icon={<CheckCircle2 size={18} />} label={tr("Concluídos", "Completed")} value={report.completedProjects} />
        <SummaryCard icon={<TriangleAlert size={18} />} label={tr("Em risco", "At risk")} value={report.atRiskProjects} warning={report.atRiskProjects > 0} />
        <SummaryCard icon={<BarChart3 size={18} />} label={tr("Progresso médio", "Average progress")} value={`${report.averageProgress}%`} />
        <SummaryCard icon={<FolderKanban size={18} />} label={tr("Tarefas", "Tasks")} value={report.totalTasks} />
        <SummaryCard icon={<CheckCircle2 size={18} />} label={tr("Finalizadas", "Finished")} value={report.completedTasks} />
        <SummaryCard icon={<TriangleAlert size={18} />} label={tr("Atrasadas", "Overdue")} value={report.overdueAssignments} warning={report.overdueAssignments > 0} />
      </div>

      <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
          <h3 className="font-semibold text-slate-950">{tr("Desempenho dos projetos", "Project performance")}</h3>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="ALL">{tr("Todos os status", "All statuses")}</option>
            <option value="ON_TRACK">{tr("No prazo", "On track")}</option>
            <option value="AT_RISK">{tr("Em risco", "At risk")}</option>
            <option value="COMPLETED">{tr("Concluídos", "Completed")}</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500"><tr><Th>{tr("Projeto", "Project")}</Th><Th>{tr("Status", "Status")}</Th><Th>{tr("Progresso", "Progress")}</Th><Th>{tr("Tarefas", "Tasks")}</Th><Th>{tr("Pessoas", "People")}</Th><Th>{tr("Atrasadas", "Overdue")}</Th></tr></thead>
            <tbody>{projects.map((project) => <tr key={project.projectId} className="border-t"><Td strong>{project.projectName}</Td><Td>{formatStatus(project.status, tr)}</Td><Td>{project.progress}%</Td><Td>{project.completedTasks} / {project.totalTasks}</Td><Td>{project.assignedUsers}</Td><Td warning={project.overdueAssignments > 0}>{project.overdueAssignments}</Td></tr>)}</tbody>
          </table>
        </div>
      </article>

      <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5"><h3 className="flex items-center gap-2 font-semibold text-slate-950"><Users size={18} />{tr("Carga por pessoa", "Workload by person")}</h3></div>
        <div className="overflow-x-auto">
          <table className="min-w-[620px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500"><tr><Th>{tr("Pessoa", "Person")}</Th><Th>{tr("Atribuições", "Assignments")}</Th><Th>{tr("Concluídas", "Completed")}</Th><Th>{tr("Atrasadas", "Overdue")}</Th></tr></thead>
            <tbody>{report.workload.map((row) => <tr key={row.userId} className="border-t"><Td strong>{row.userName}</Td><Td>{row.assignedTasks}</Td><Td>{row.completedAssignments}</Td><Td warning={row.overdueAssignments > 0}>{row.overdueAssignments}</Td></tr>)}</tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

type Translator = (pt: string, en: string) => string;

function ReportMetric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return <div className={`rounded-xl border p-4 ${warning ? "border-orange-200 bg-orange-50" : "bg-slate-50"}`}><p className="text-xs font-medium text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${warning ? "text-orange-700" : "text-slate-950"}`}>{value}</p></div>;
}

function SummaryCard({ icon, label, value, warning = false }: { icon: React.ReactNode; label: string; value: number | string; warning?: boolean }) {
  return <div className={`rounded-xl border bg-white p-4 shadow-sm ${warning ? "border-orange-200" : ""}`}><p className={`flex items-center gap-2 text-xs font-medium ${warning ? "text-orange-700" : "text-slate-500"}`}>{icon}{label}</p><p className="mt-2 text-xl font-bold text-slate-950">{value}</p></div>;
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><Download size={16} />{label}</button>;
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-5 py-3 font-semibold">{children}</th>; }
function Td({ children, strong = false, warning = false }: { children: React.ReactNode; strong?: boolean; warning?: boolean }) { return <td className={`px-5 py-4 ${strong ? "font-semibold text-slate-900" : "text-slate-600"} ${warning ? "font-bold text-orange-700" : ""}`}>{children}</td>; }

function formatStatus(status: string, tr: Translator) {
  return ({ ON_TRACK: tr("No prazo", "On track"), AT_RISK: tr("Em risco", "At risk"), COMPLETED: tr("Concluído", "Completed") } as Record<string, string>)[status] ?? status;
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportProjects(projects: PortfolioProjectRow[], tr: Translator) {
  downloadCsv("taborflow-project-report.csv", [
    [tr("Projeto", "Project"), tr("Status", "Status"), tr("Progresso", "Progress"), tr("Tarefas", "Tasks"), tr("Concluídas", "Completed"), tr("Pessoas", "People"), tr("Atrasadas", "Overdue")],
    ...projects.map((project) => [project.projectName, formatStatus(project.status, tr), `${project.progress}%`, project.totalTasks, project.completedTasks, project.assignedUsers, project.overdueAssignments])
  ]);
}

function exportWorkload(workload: WorkloadRow[], tr: Translator) {
  downloadCsv("taborflow-workload-report.csv", [
    [tr("Pessoa", "Person"), tr("Atribuições", "Assignments"), tr("Concluídas", "Completed"), tr("Atrasadas", "Overdue")],
    ...workload.map((row) => [row.userName, row.assignedTasks, row.completedAssignments, row.overdueAssignments])
  ]);
}
