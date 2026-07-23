import type { Request } from "express";
import type {
  IntegrationClient,
  User
} from "@prisma/client";
import { GraphQLError } from "graphql";

import {
  hashApiKey,
  verifyIntegrationToken,
  verifyAuthToken
}
  from "../lib/auth";
import { prisma } from "../lib/prisma";

export type GraphQLContext = {
  currentUser: User | null;
  currentIntegration:
    | IntegrationClient
    | null;
};

export function requireAuth(
  context: GraphQLContext
) {
  if (!context.currentUser) {
    throw new GraphQLError(
      "Authentication required.",
      {
        extensions: {
          code: "UNAUTHENTICATED"
        }
      }
    );
  }

  if (!context.currentUser.emailVerifiedAt) {
    throw new GraphQLError(
      "Email verification required.",
      {
        extensions: {
          code: "EMAIL_NOT_VERIFIED"
        }
      }
    );
  }

  return context.currentUser;
}

export function requireAuthenticatedUser(
  context: GraphQLContext
) {
  if (!context.currentUser) {
    throw new GraphQLError(
      "Authentication required.",
      {
        extensions: {
          code: "UNAUTHENTICATED"
        }
      }
    );
  }

  return context.currentUser;
}

export function requireAdmin(
  context: GraphQLContext
) {
  const currentUser =
    requireAuth(context);

  if (currentUser.role !== "ADMIN") {
    throw new GraphQLError(
      "Admin access required.",
      {
        extensions: {
          code: "FORBIDDEN"
        }
      }
    );
  }

  return currentUser;
}

export function requireUserManager(
  context: GraphQLContext
) {
  const currentUser =
    requireAuth(context);

  if (
    currentUser.role !== "ADMIN" &&
    currentUser.role !== "PROJECT_MANAGER"
  ) {
    throw new GraphQLError(
      "User management access required.",
      {
        extensions: {
          code: "FORBIDDEN"
        }
      }
    );
  }

  return currentUser;
}

export function requireProjectManager(
  context: GraphQLContext
) {
  const currentUser =
    requireAuth(context);

  if (
    currentUser.role !== "ADMIN" &&
    currentUser.role !== "PROJECT_MANAGER"
  ) {
    throw new GraphQLError(
      "Project management access required.",
      {
        extensions: {
          code: "FORBIDDEN"
        }
      }
    );
  }

  return currentUser;
}

export function requireIntegrationScope(
  context: GraphQLContext,
  requiredScope: string
) {
  if (!context.currentIntegration) {
    throw new GraphQLError(
      "Integration authentication required.",
      {
        extensions: {
          code: "UNAUTHENTICATED"
        }
      }
    );
  }

  const scopes =
    context.currentIntegration.scopes
      .split(/[,\s]+/)
      .filter(Boolean);

  if (!scopes.includes(requiredScope)) {
    throw new GraphQLError(
      "Integration scope required.",
      {
        extensions: {
          code: "FORBIDDEN"
        }
      }
    );
  }

  return context.currentIntegration;
}

function getTokenFromRequest(req: Request) {
  const authorization =
    req.headers.authorization;

  if (!authorization) {
    return null;
  }

  const [
    type,
    token
  ] = authorization.split(" ");

  if (
    type !== "Bearer" ||
    !token
  ) {
    return null;
  }

  return token;
}

export async function createGraphQLContext(
  req: Request
): Promise<GraphQLContext> {
  const token = getTokenFromRequest(req);

  if (!token) {
    return {
      currentUser: null,
      currentIntegration: null
    };
  }

  const payload = verifyAuthToken(token);

  if (payload) {
    const currentUser =
      await prisma.user.findFirst({
        where: {
          id: payload.userId,
          tenantId: payload.tenantId
        }
      });

    return {
      currentUser,
      currentIntegration: null
    };
  }

  const integrationToken =
    verifyIntegrationToken(token);

  if (integrationToken) {
    const currentIntegration =
      await prisma.integrationClient.findUnique({
        where: {
          id: integrationToken
            .integrationClientId
        }
      });

    if (!currentIntegration?.isActive) {
      return {
        currentUser: null,
        currentIntegration: null
      };
    }

    await prisma.integrationClient.update({
      where: {
        id: currentIntegration.id
      },
      data: {
        lastUsedAt: new Date()
      }
    });

    return {
      currentUser: null,
      currentIntegration
    };
  }

  const currentIntegration =
    await prisma.integrationClient.findUnique({
      where: {
        keyHash: hashApiKey(token)
      }
    });

  if (!currentIntegration?.isActive) {
    return {
      currentUser: null,
      currentIntegration: null
    };
  }

  await prisma.integrationClient.update({
    where: {
      id: currentIntegration.id
    },
    data: {
      lastUsedAt: new Date()
    }
  });

  return {
    currentUser: null,
    currentIntegration
  };
}
