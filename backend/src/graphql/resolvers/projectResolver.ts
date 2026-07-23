import {
  requireAuth,
  requireIntegrationScope,
  requireProjectManager,
  type GraphQLContext
} from "../context";
import { GraphQLError } from "graphql";
import { prisma } from "../../lib/prisma";

const projectInclude = {
  tasks: {
    include: {
      users: {
        include: {
          user: true
        }
      }
    }
  },
  users: {
    include: {
      user: true
    }
  },
  products: true
};

const taskInclude = {
  users: {
    include: {
      user: true
    }
  }
};

function projectScopeWhere(
  currentUser: {
    id: number;
    role: string;
    tenantId: number;
  }
) {
  if (currentUser.role === "PROJECT_MANAGER") {
    return {
      tenantId: currentUser.tenantId,
      users: {
        some: {
          userId: currentUser.id
        }
      }
    };
  }

  return { tenantId: currentUser.tenantId };
}

async function ensureCanManageProject(
  projectId: number,
  context: GraphQLContext
) {
  const currentUser =
    requireProjectManager(context);

  const projectUser =
    await prisma.projectUser.findFirst({
      where: {
        projectId,
        userId: currentUser.id,
        project: { tenantId: currentUser.tenantId }
      }
    });

  if (!projectUser) {
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

function mapTaskUsers<
  T extends {
    users?: Array<{
      user: unknown;
      estimatedStartDate: Date;
      estimatedEndDate: Date;
    }>;
  }
>(task: T) {
  return {
    ...task,
    users:
      task.users?.map((taskUser) => ({
        ...taskUser,
        estimatedStartDate:
          taskUser.estimatedStartDate
            .toISOString()
            .slice(0, 10),
        estimatedEndDate:
          taskUser.estimatedEndDate
            .toISOString()
            .slice(0, 10)
      })) ?? []
  };
}

function mapProduct<
  T extends {
    deliveryDate: Date;
  }
>(product: T) {
  return {
    ...product,
    deliveryDate: product.deliveryDate
      .toISOString()
      .slice(0, 10)
  };
}

function mapProjectUsers<
  T extends {
    users?: Array<{
      user: unknown;
    }>;
    tasks?: Array<{
      users?: Array<{
        user: unknown;
        estimatedStartDate: Date;
        estimatedEndDate: Date;
      }>;
    }>;
    products?: Array<{
      deliveryDate: Date;
    }>;
  }
>(project: T | null) {
  if (!project) {
    return project;
  }

  return {
    ...project,
    tasks:
      project.tasks?.map(mapTaskUsers) ??
      [],
    products:
      project.products?.map(mapProduct) ??
      [],
    users:
      project.users?.map(
        (projectUser) => projectUser.user
      ) ?? []
  };
}

async function ensureTaskUsersBelongToProject(
  projectId: number,
  users: Array<{
    userId: string;
    estimatedStartDate?: string;
    estimatedEndDate?: string;
  }>
) {
  if (users.length === 0) {
    throw new GraphQLError(
      "At least one task user is required.",
      {
        extensions: {
          code: "BAD_USER_INPUT"
        }
      }
    );
  }

  const userIds = users.map((user) =>
    Number(user.userId)
  );
  const uniqueUserIds = new Set(userIds);

  if (uniqueUserIds.size !== userIds.length) {
    throw new GraphQLError(
      "Task users cannot contain duplicates.",
      {
        extensions: {
          code: "BAD_USER_INPUT"
        }
      }
    );
  }

  const hasInvalidDates = users.some(
    (user) =>
      user.estimatedStartDate &&
      user.estimatedEndDate &&
      new Date(user.estimatedStartDate) >
        new Date(user.estimatedEndDate)
  );

  if (hasInvalidDates) {
    throw new GraphQLError(
      "Estimated end date must be after estimated start date.",
      {
        extensions: {
          code: "BAD_USER_INPUT"
        }
      }
    );
  }

  const projectUsers =
    await prisma.projectUser.findMany({
      where: {
        projectId,
        userId: {
          in: Array.from(uniqueUserIds)
        }
      }
    });

  if (projectUsers.length !== uniqueUserIds.size) {
    throw new GraphQLError(
      "Task users must already belong to the project.",
      {
        extensions: {
          code: "BAD_USER_INPUT"
        }
      }
    );
  }
}

function validateProductInput(input: {
  status?: string;
  vendor?: string;
  materialCode?: string;
  quantity?: number;
  materialDescription?: string;
  deliveryDate?: string;
}) {
  if (
    input.quantity !== undefined &&
    input.quantity <= 0
  ) {
    throw new GraphQLError(
      "Quantity must be greater than zero.",
      {
        extensions: {
          code: "BAD_USER_INPUT"
        }
      }
    );
  }

  if (
    input.deliveryDate !== undefined &&
    Number.isNaN(
      new Date(input.deliveryDate).getTime()
    )
  ) {
    throw new GraphQLError(
      "Delivery date is invalid.",
      {
        extensions: {
          code: "BAD_USER_INPUT"
        }
      }
    );
  }
}

async function ensureIntegrationCanAccessProject(
  integrationClientId: number,
  projectId: number
) {
  const integrationProject =
    await prisma.integrationClientProject.findUnique({
      where: {
        integrationClientId_projectId: {
          integrationClientId,
          projectId
        }
      }
    });

  if (!integrationProject) {
    throw new GraphQLError(
      "Integration project access required.",
      {
        extensions: {
          code: "FORBIDDEN"
        }
      }
    );
  }
}

function hasIntegrationScope(
  scopes: string,
  requiredScope: string
) {
  return scopes
    .split(/[,\s]+/)
    .filter(Boolean)
    .includes(requiredScope);
}

async function enableProductIntegrationsForProject(
  projectId: number
) {
  const integrationClients =
    await prisma.integrationClient.findMany({
      where: {
        isActive: true
      }
    });

  const productIntegrationClients =
    integrationClients.filter((client) =>
      hasIntegrationScope(
        client.scopes,
        "products:write"
      )
    );

  if (productIntegrationClients.length === 0) {
    return;
  }

  await prisma.integrationClientProject.createMany({
    data: productIntegrationClients.map(
      (client) => ({
        integrationClientId: client.id,
        projectId
      })
    ),
    skipDuplicates: true
  });
}

export const projectResolver = {
  Query: {
    projects: async (
      _: unknown,
      __: unknown,
      context: GraphQLContext
    ) => {
      const currentUser =
        requireAuth(context);
      const projects =
        await prisma.project.findMany({
          where:
            projectScopeWhere(currentUser),
          include: projectInclude
        });

      return projects.map(mapProjectUsers);
    },
    project: async (
      _: unknown,
      args: {
        id: string;
      },
      context: GraphQLContext
    ) => {
      const currentUser =
        requireAuth(context);

      const project =
        await prisma.project.findFirst({
        where: {
          AND: [
            {
              id: Number(args.id)
            },
            projectScopeWhere(currentUser)
          ]
        },
        include: projectInclude
      });

      return mapProjectUsers(project);
    },
    timelineProjects: async (
      _: unknown,
      __: unknown,
      context: GraphQLContext
    ) => {
      const currentUser = requireAuth(context);

      if (
        currentUser.role !== "ADMIN" &&
        currentUser.role !== "PROJECT_MANAGER"
      ) {
        throw new GraphQLError(
          "Timeline access required.",
          {
            extensions: {
              code: "FORBIDDEN"
            }
          }
        );
      }

      const projects =
        await prisma.project.findMany({
          where:
            currentUser.role === "ADMIN"
              ? { tenantId: currentUser.tenantId }
              : {
                  tenantId: currentUser.tenantId,
                  users: {
                    some: {
                      userId: currentUser.id
                    }
                  }
                },
          include: projectInclude,
          orderBy: {
            name: "asc"
          }
        });

      return projects.map(mapProjectUsers);
    }
  },
  Mutation: {
    createProject: async (
      _: unknown,
      args: {
        input: {
          name: string;
          externalCode?: string | null;
          description: string;
          progress: number;
          status: string;
        };
      },
      context: GraphQLContext
    ) => {
      const currentUser =
        requireProjectManager(context);

      const project =
        await prisma.project.create({
        data: {
          ...args.input,
          tenantId: currentUser.tenantId,
          externalCode:
            args.input.externalCode?.trim() ||
            null,
          users: {
            create: {
              userId: currentUser.id
            }
          }
        },
        include: projectInclude
      });

      if (project.externalCode) {
        await enableProductIntegrationsForProject(
          project.id
        );
      }

      return mapProjectUsers(project);
    },
    updateProject: async (
      _: unknown,
      args: {
        id: string;
        input: {
          name?: string;
          externalCode?: string | null;
          description?: string;
          progress?: number;
          status?: string;
        };
      },
      context: GraphQLContext
    ) => {
      await ensureCanManageProject(
        Number(args.id),
        context
      );

      const project =
        await prisma.project.update({
        where: {
          id: Number(args.id)
        },
        data: {
          ...args.input,
          ...(args.input.externalCode !== undefined
            ? {
                externalCode:
                  args.input.externalCode?.trim() ||
                  null
              }
            : {})
        },
        include: projectInclude
      });

      if (project.externalCode) {
        await enableProductIntegrationsForProject(
          project.id
        );
      }

      return mapProjectUsers(project);
    },
    deleteProject: async (
      _: unknown,
      args: {
        id: string;
      },
      context: GraphQLContext
    ) => {
      const projectId = Number(args.id);

      await ensureCanManageProject(
        projectId,
        context
      );

      await prisma.$transaction([
        prisma.taskUser.deleteMany({
          where: {
            task: {
              projectId
            }
          }
        }),
        prisma.task.deleteMany({
          where: {
            projectId
          }
        }),
        prisma.product.deleteMany({
          where: {
            projectId
          }
        }),
        prisma.integrationClientProject.deleteMany({
          where: {
            projectId
          }
        }),
        prisma.projectUser.deleteMany({
          where: {
            projectId
          }
        }),
        prisma.project.delete({
          where: {
            id: projectId
          }
        })
      ]);

      return true;
    },
    createTask: async (
      _: unknown,
      args: {
        input: {
          projectId: string;
          title: string;
          description?: string;
          status: string;
          users: Array<{
            userId: string;
            status: string;
            estimatedStartDate: string;
            estimatedEndDate: string;
          }>;
        };
      },
      context: GraphQLContext
    ) => {
      const projectId = Number(
        args.input.projectId
      );

      await ensureCanManageProject(
        projectId,
        context
      );

      await ensureTaskUsersBelongToProject(
        projectId,
        args.input.users
      );

      const task = await prisma.task.create({
        data: {
          title: args.input.title,
          description:
            args.input.description,
          status: args.input.status,
          projectId,
          users: {
            create: args.input.users.map(
              (user) => ({
                userId: Number(user.userId),
                status: user.status,
                estimatedStartDate:
                  new Date(
                    user.estimatedStartDate
                  ),
                estimatedEndDate:
                  new Date(
                    user.estimatedEndDate
                  )
              })
            )
          }
        },
        include: taskInclude
      });

      return mapTaskUsers(task);
    },
    updateTask: async (
      _: unknown,
      args: {
        id: string;
        input: {
          title?: string;
          description?: string;
          status?: string;
          users?: Array<{
            userId: string;
            status: string;
            estimatedStartDate: string;
            estimatedEndDate: string;
          }>;
        };
      },
      context: GraphQLContext
    ) => {
      const existingTask =
        await prisma.task.findUnique({
          where: {
            id: Number(args.id)
          }
        });

      if (!existingTask) {
        throw new GraphQLError(
          "Task not found.",
          {
            extensions: {
              code: "NOT_FOUND"
            }
          }
        );
      }

      await ensureCanManageProject(
        existingTask.projectId,
        context
      );

      if (args.input.users) {
        await ensureTaskUsersBelongToProject(
          existingTask.projectId,
          args.input.users
        );
      }

      await prisma.task.update({
        where: {
          id: Number(args.id)
        },
        data: {
          ...(args.input.title !== undefined
            ? {
                title:
                  args.input.title.trim()
              }
            : {}),
          ...(args.input.description !== undefined
            ? {
                description:
                  args.input.description
              }
            : {}),
          ...(args.input.status
            ? { status: args.input.status }
            : {})
        }
      });

      if (args.input.users) {
        await prisma.taskUser.deleteMany({
          where: {
            taskId: Number(args.id)
          }
        });

        await prisma.taskUser.createMany({
          data: args.input.users.map(
            (user) => ({
              taskId: Number(args.id),
              userId: Number(user.userId),
              status: user.status,
              estimatedStartDate:
                new Date(
                  user.estimatedStartDate
                ),
              estimatedEndDate:
                new Date(
                  user.estimatedEndDate
                )
            })
          )
        });
      }

      const task =
        await prisma.task.findUniqueOrThrow({
          where: {
            id: Number(args.id)
          },
          include: taskInclude
        });

      return mapTaskUsers(task);
    },
    addProjectUser: async (
      _: unknown,
      args: {
        input: {
          projectId: string;
          userId: string;
        };
      },
      context: GraphQLContext
    ) => {
      await ensureCanManageProject(
        Number(args.input.projectId),
        context
      );

      const user =
        await prisma.user.findFirst({
          where: {
            id: Number(args.input.userId),
            tenantId: context.currentUser!.tenantId
          }
        });

      if (
        !user ||
        (
          user.role !== "PROJECT_MANAGER" &&
          user.role !== "MEMBER" &&
          user.role !== "ADMIN"
        )
      ) {
        throw new GraphQLError(
          "User cannot be assigned to projects.",
          {
            extensions: {
              code: "BAD_USER_INPUT"
            }
          }
        );
      }

      await prisma.projectUser.upsert({
        where: {
          projectId_userId: {
            projectId: Number(
              args.input.projectId
            ),
            userId: Number(args.input.userId)
          }
        },
        update: {},
        create: {
          projectId: Number(
            args.input.projectId
          ),
          userId: Number(args.input.userId)
        }
      });

      const project =
        await prisma.project.findUnique({
          where: {
            id: Number(args.input.projectId)
          },
          include: projectInclude
        });

      return mapProjectUsers(project);
    },
    removeProjectUser: async (
      _: unknown,
      args: {
        input: {
          projectId: string;
          userId: string;
        };
      },
      context: GraphQLContext
    ) => {
      await ensureCanManageProject(
        Number(args.input.projectId),
        context
      );

      await prisma.taskUser.deleteMany({
        where: {
          userId: Number(args.input.userId),
          task: {
            projectId: Number(
              args.input.projectId
            )
          }
        }
      });

      await prisma.projectUser.deleteMany({
        where: {
          projectId: Number(
            args.input.projectId
          ),
          userId: Number(args.input.userId)
        }
      });

      const project =
        await prisma.project.findUnique({
          where: {
            id: Number(args.input.projectId)
          },
          include: projectInclude
        });

      return mapProjectUsers(project);
    },
    createProduct: async (
      _: unknown,
      args: {
        input: {
          projectId: string;
          status: string;
          vendor: string;
          materialCode: string;
          quantity: number;
          materialDescription: string;
          deliveryDate: string;
        };
      },
      context: GraphQLContext
    ) => {
      const projectId = Number(
        args.input.projectId
      );

      await ensureCanManageProject(
        projectId,
        context
      );
      validateProductInput(args.input);

      const product =
        await prisma.product.create({
          data: {
            projectId,
            status:
              args.input.status.trim(),
            vendor:
              args.input.vendor.trim(),
            materialCode:
              args.input.materialCode.trim(),
            quantity:
              args.input.quantity,
            materialDescription:
              args.input.materialDescription.trim(),
            deliveryDate:
              new Date(
                args.input.deliveryDate
              )
          }
        });

      return mapProduct(product);
    },
    updateProduct: async (
      _: unknown,
      args: {
        id: string;
        input: {
          status?: string;
          vendor?: string;
          materialCode?: string;
          quantity?: number;
          materialDescription?: string;
          deliveryDate?: string;
        };
      },
      context: GraphQLContext
    ) => {
      const existingProduct =
        await prisma.product.findUnique({
          where: {
            id: Number(args.id)
          }
        });

      if (!existingProduct) {
        throw new GraphQLError(
          "Product not found.",
          {
            extensions: {
              code: "NOT_FOUND"
            }
          }
        );
      }

      await ensureCanManageProject(
        existingProduct.projectId,
        context
      );
      validateProductInput(args.input);

      const product =
        await prisma.product.update({
          where: {
            id: Number(args.id)
          },
          data: {
            ...(args.input.status !== undefined
              ? {
                  status:
                    args.input.status.trim()
                }
              : {}),
            ...(args.input.vendor !== undefined
              ? {
                  vendor:
                    args.input.vendor.trim()
                }
              : {}),
            ...(args.input.materialCode !== undefined
              ? {
                  materialCode:
                    args.input.materialCode.trim()
                }
              : {}),
            ...(args.input.quantity !== undefined
              ? {
                  quantity:
                    args.input.quantity
                }
              : {}),
            ...(args.input.materialDescription !== undefined
              ? {
                  materialDescription:
                    args.input.materialDescription.trim()
                }
              : {}),
            ...(args.input.deliveryDate !== undefined
              ? {
                  deliveryDate:
                    new Date(
                      args.input.deliveryDate
                    )
                }
              : {})
          }
        });

      return mapProduct(product);
    },
    deleteProduct: async (
      _: unknown,
      args: {
        id: string;
      },
      context: GraphQLContext
    ) => {
      const existingProduct =
        await prisma.product.findUnique({
          where: {
            id: Number(args.id)
          }
        });

      if (!existingProduct) {
        throw new GraphQLError(
          "Product not found.",
          {
            extensions: {
              code: "NOT_FOUND"
            }
          }
        );
      }

      await ensureCanManageProject(
        existingProduct.projectId,
        context
      );

      await prisma.product.delete({
        where: {
          id: Number(args.id)
        }
      });

      return true;
    },
    upsertExternalProduct: async (
      _: unknown,
      args: {
        input: {
          projectExternalCode: string;
          externalCode: string;
          status: string;
          vendor: string;
          materialCode: string;
          quantity: number;
          materialDescription: string;
          deliveryDate: string;
        };
      },
      context: GraphQLContext
    ) => {
      const integrationClient =
        requireIntegrationScope(
          context,
          "products:write"
        );

      validateProductInput(args.input);

      const project =
        await prisma.project.findUnique({
          where: {
            externalCode:
              args.input.projectExternalCode
                .trim()
          }
        });

      if (!project) {
        throw new GraphQLError(
          "Project not found.",
          {
            extensions: {
              code: "NOT_FOUND"
            }
          }
        );
      }

      await ensureIntegrationCanAccessProject(
        integrationClient.id,
        project.id
      );

      const externalCode =
        args.input.externalCode.trim();

      if (!externalCode) {
        throw new GraphQLError(
          "External code is required.",
          {
            extensions: {
              code: "BAD_USER_INPUT"
            }
          }
        );
      }

      const product =
        await prisma.product.upsert({
          where: {
            projectId_externalCode: {
              projectId: project.id,
              externalCode
            }
          },
          update: {
            status:
              args.input.status.trim(),
            vendor:
              args.input.vendor.trim(),
            materialCode:
              args.input.materialCode.trim(),
            quantity:
              args.input.quantity,
            materialDescription:
              args.input.materialDescription.trim(),
            deliveryDate:
              new Date(
                args.input.deliveryDate
              )
          },
          create: {
            projectId: project.id,
            externalCode,
            status:
              args.input.status.trim(),
            vendor:
              args.input.vendor.trim(),
            materialCode:
              args.input.materialCode.trim(),
            quantity:
              args.input.quantity,
            materialDescription:
              args.input.materialDescription.trim(),
            deliveryDate:
              new Date(
                args.input.deliveryDate
              )
          }
        });

      return mapProduct(product);
    }
  }

};
