import { GraphQLError } from "graphql";

import { ensurePremiumAccess } from "../../lib/planLimits";
import { prisma } from "../../lib/prisma";
import {
  requireAuth,
  type GraphQLContext
} from "../context";

function projectScopeWhere(currentUser: {
  id: number;
  role: string;
  tenantId: number;
}) {
  if (currentUser.role === "PROJECT_MANAGER") {
    return {
      tenantId: currentUser.tenantId,
      users: { some: { userId: currentUser.id } }
    };
  }

  return { tenantId: currentUser.tenantId };
}

const reportInclude = {
  users: true,
  tasks: {
    include: {
      users: {
        include: { user: true }
      }
    }
  }
};

type ReportProject = Awaited<
  ReturnType<typeof findReportProject>
> & object;

function overdueCutoff() {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
}

function countOverdueAssignments(
  project: NonNullable<ReportProject>
) {
  const cutoff = overdueCutoff();
  return project.tasks.reduce(
    (total, task) =>
      total +
      task.users.filter(
        (assignment) =>
          assignment.status !== "DONE" &&
          assignment.estimatedEndDate < cutoff
      ).length,
    0
  );
}

function mapProjectHealth(
  project: NonNullable<ReportProject>
) {
  return {
    projectId: project.id,
    projectName: project.name,
    status: project.status,
    progress: project.progress,
    totalTasks: project.tasks.length,
    todoTasks: project.tasks.filter(
      (task) => task.status === "TODO"
    ).length,
    inProgressTasks: project.tasks.filter(
      (task) => task.status === "IN_PROGRESS"
    ).length,
    completedTasks: project.tasks.filter(
      (task) => task.status === "DONE"
    ).length,
    assignedUsers: project.users.length,
    overdueAssignments:
      countOverdueAssignments(project)
  };
}

function findReportProject(
  projectId: number,
  currentUser: {
    id: number;
    role: string;
    tenantId: number;
  }
) {
  return prisma.project.findFirst({
    where: {
      AND: [
        { id: projectId },
        projectScopeWhere(currentUser)
      ]
    },
    include: reportInclude
  });
}

export const reportResolver = {
  Query: {
    projectHealthReport: async (
      _: unknown,
      args: { projectId: string },
      context: GraphQLContext
    ) => {
      const currentUser = requireAuth(context);
      const project = await findReportProject(
        Number(args.projectId),
        currentUser
      );

      if (!project) {
        throw new GraphQLError("Project not found.", {
          extensions: { code: "NOT_FOUND" }
        });
      }

      return mapProjectHealth(project);
    },

    portfolioReport: async (
      _: unknown,
      __: unknown,
      context: GraphQLContext
    ) => {
      const currentUser = requireAuth(context);
      await ensurePremiumAccess(currentUser.tenantId);

      const projects = await prisma.project.findMany({
        where: projectScopeWhere(currentUser),
        include: reportInclude,
        orderBy: { name: "asc" }
      });
      const projectRows = projects.map((project) => ({
        projectId: project.id,
        projectName: project.name,
        status: project.status,
        progress: project.progress,
        totalTasks: project.tasks.length,
        completedTasks: project.tasks.filter(
          (task) => task.status === "DONE"
        ).length,
        assignedUsers: project.users.length,
        overdueAssignments:
          countOverdueAssignments(project)
      }));
      const workload = new Map<
        number,
        {
          userId: number;
          userName: string;
          assignedTasks: number;
          completedAssignments: number;
          overdueAssignments: number;
        }
      >();
      const cutoff = overdueCutoff();

      for (const project of projects) {
        for (const task of project.tasks) {
          for (const assignment of task.users) {
            const row = workload.get(assignment.userId) ?? {
              userId: assignment.userId,
              userName: assignment.user.name,
              assignedTasks: 0,
              completedAssignments: 0,
              overdueAssignments: 0
            };
            row.assignedTasks += 1;
            if (assignment.status === "DONE") {
              row.completedAssignments += 1;
            } else if (
              assignment.estimatedEndDate < cutoff
            ) {
              row.overdueAssignments += 1;
            }
            workload.set(assignment.userId, row);
          }
        }
      }

      const totalTasks = projectRows.reduce(
        (total, project) => total + project.totalTasks,
        0
      );
      const completedTasks = projectRows.reduce(
        (total, project) =>
          total + project.completedTasks,
        0
      );

      return {
        totalProjects: projects.length,
        activeProjects: projects.filter(
          (project) => project.status !== "COMPLETED"
        ).length,
        completedProjects: projects.filter(
          (project) => project.status === "COMPLETED"
        ).length,
        atRiskProjects: projects.filter(
          (project) => project.status === "AT_RISK"
        ).length,
        averageProgress: projects.length
          ? Math.round(
              projects.reduce(
                (total, project) =>
                  total + project.progress,
                0
              ) / projects.length
            )
          : 0,
        totalTasks,
        completedTasks,
        overdueAssignments: projectRows.reduce(
          (total, project) =>
            total + project.overdueAssignments,
          0
        ),
        projects: projectRows,
        workload: [...workload.values()].sort((a, b) =>
          a.userName.localeCompare(b.userName)
        )
      };
    }
  }
};
