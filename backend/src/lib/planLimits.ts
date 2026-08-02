import { GraphQLError } from "graphql";

import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export const FREE_USER_LIMIT = 5;
export const FREE_ACTIVE_PROJECT_LIMIT = 3;

type TenantPlan = {
  plan: string;
  premiumExpiresAt: Date | null;
};

export function hasPremiumAccess(tenant: TenantPlan) {
  return (
    tenant.plan === "PREMIUM" &&
    Boolean(
      tenant.premiumExpiresAt &&
        tenant.premiumExpiresAt > new Date()
    )
  );
}

export async function getWorkspacePlanUsage(
  tenantId: number,
  database: Prisma.TransactionClient | typeof prisma = prisma
) {
  const tenant = await database.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan: true,
      premiumExpiresAt: true
    }
  });

  if (!tenant) {
    throw new GraphQLError("Workspace not found.", {
      extensions: { code: "NOT_FOUND" }
    });
  }

  const premium = hasPremiumAccess(tenant);
  const [users, activeProjects] = await Promise.all([
    database.user.count({ where: { tenantId } }),
    database.project.count({
      where: {
        tenantId,
        status: { not: "COMPLETED" }
      }
    })
  ]);

  return {
    users,
    userLimit: premium ? null : FREE_USER_LIMIT,
    activeProjects,
    activeProjectLimit: premium
      ? null
      : FREE_ACTIVE_PROJECT_LIMIT,
    consolidatedTimeline: premium
  };
}

function planLimitError(
  message: string,
  resource: "USERS" | "ACTIVE_PROJECTS",
  current: number,
  limit: number
) {
  return new GraphQLError(message, {
    extensions: {
      code: "PLAN_LIMIT_REACHED",
      resource,
      current,
      limit
    }
  });
}

export async function ensureCanCreateUser(
  tenantId: number,
  database: Prisma.TransactionClient | typeof prisma = prisma
) {
  const usage = await getWorkspacePlanUsage(
    tenantId,
    database
  );

  if (
    usage.userLimit !== null &&
    usage.users >= usage.userLimit
  ) {
    throw planLimitError(
      "The Free plan supports up to 5 users. Upgrade the workspace to add another user.",
      "USERS",
      usage.users,
      usage.userLimit
    );
  }
}

export async function ensureCanActivateProject(
  tenantId: number,
  database: Prisma.TransactionClient | typeof prisma = prisma
) {
  const usage = await getWorkspacePlanUsage(
    tenantId,
    database
  );

  if (
    usage.activeProjectLimit !== null &&
    usage.activeProjects >=
      usage.activeProjectLimit
  ) {
    throw planLimitError(
      "The Free plan supports up to 3 active projects. Complete an active project or upgrade the workspace.",
      "ACTIVE_PROJECTS",
      usage.activeProjects,
      usage.activeProjectLimit
    );
  }
}

export async function ensurePremiumAccess(
  tenantId: number
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan: true,
      premiumExpiresAt: true
    }
  });

  if (!tenant || !hasPremiumAccess(tenant)) {
    throw new GraphQLError(
      "This report is available on the Premium plan.",
      {
        extensions: { code: "PREMIUM_REQUIRED" }
      }
    );
  }
}

export async function lockTenantPlanUsage(
  transaction: Prisma.TransactionClient,
  tenantId: number
) {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(${tenantId})
  `;
}
