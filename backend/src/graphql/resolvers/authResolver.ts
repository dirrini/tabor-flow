import { GraphQLError } from "graphql";

import {
  createAuthToken,
  hashPassword,
  verifyPassword
} from "../../lib/auth";
import {
  requireAuth,
  requireAuthenticatedUser,
  requireUserManager,
  type GraphQLContext
} from "../context";
import { prisma } from "../../lib/prisma";
import { OAuth2Client } from "google-auth-library";
import {
  sendInvitationEmail,
  sendVerificationEmail,
  verifyEmailVerificationToken,
  verifyInvitationToken
} from "../../lib/emailVerification";

const googleClient = new OAuth2Client();

function tenantSlug(name: string) {
  const base = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

const manageableRoles = [
  "PROJECT_MANAGER",
  "MEMBER"
];

export const authResolver = {
  User: {
    tenant: (user: { tenantId: number }) => prisma.tenant.findUnique({ where: { id: user.tenantId } }),
    emailVerified: (user: { emailVerifiedAt: Date | null }) => Boolean(user.emailVerifiedAt)
  },
  Query: {
    me: (
      _: unknown,
      __: unknown,
      context: GraphQLContext
    ) => requireAuthenticatedUser(context),

    users: async (
      _: unknown,
      __: unknown,
      context: GraphQLContext
    ) => {
      const currentUser =
        requireUserManager(context);

      return prisma.user.findMany({
        where: {
          tenantId: currentUser.tenantId,
          ...(currentUser.role === "ADMIN"
            ? {
                OR: [
                  { role: { not: "ADMIN" } },
                  { id: currentUser.id }
                ]
              }
            : { role: { not: "ADMIN" } })
        },
        orderBy: {
          createdAt: "desc"
        }
      });
    }
  },

  Mutation: {
    login: async (
      _: unknown,
      args: {
        email: string;
        password: string;
      }
    ) => {
      const user =
        await prisma.user.findFirst({
          where: {
            email: args.email.trim().toLowerCase()
          }
        });

      if (
        !user ||
        !verifyPassword(
          args.password,
          user.passwordHash ?? ""
        )
      ) {
        throw new GraphQLError(
          "Invalid email or password.",
          {
            extensions: {
              code: "UNAUTHENTICATED"
            }
          }
        );
      }

      return {
        token: createAuthToken({
          userId: user.id,
          role: user.role,
          tenantId: user.tenantId
        }),
        user
      };
    },
    register: async (_: unknown, args: { name: string; organizationName: string; email: string; password: string }) => {
      const email = args.email.trim().toLowerCase();
      if (args.password.length < 8) throw new GraphQLError("Password must be at least 8 characters.", { extensions: { code: "BAD_USER_INPUT" } });
      if (await prisma.user.findFirst({ where: { email } })) throw new GraphQLError("An account with this email already exists.", { extensions: { code: "BAD_USER_INPUT" } });
      const user = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({ data: { name: args.organizationName.trim(), slug: tenantSlug(args.organizationName) } });
        return tx.user.create({ data: { name: args.name.trim(), email, passwordHash: hashPassword(args.password), role: "ADMIN", tenantId: tenant.id }, include: { tenant: true } });
      });
      try {
        await sendVerificationEmail(user);
      } catch (error) {
        console.error("Unable to send registration verification email.", error);
      }
      return { token: createAuthToken({ userId: user.id, role: user.role, tenantId: user.tenantId }), user };
    },
    loginWithGoogle: async (_: unknown, args: { credential: string }) => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) throw new GraphQLError("Google sign-in is not configured.", { extensions: { code: "SERVICE_UNAVAILABLE" } });
      const ticket = await googleClient.verifyIdToken({ idToken: args.credential, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || !payload.email_verified) throw new GraphQLError("Google account could not be verified.", { extensions: { code: "UNAUTHENTICATED" } });
      const email = payload.email.toLowerCase();
      let user = await prisma.user.findFirst({ where: { OR: [{ googleSubject: payload.sub }, { email }] }, include: { tenant: true } });
      if (!user) {
        user = await prisma.$transaction(async (tx) => {
          const name = payload.name || email.split("@")[0];
          const tenant = await tx.tenant.create({ data: { name: `${name}'s workspace`, slug: tenantSlug(name) } });
          return tx.user.create({ data: { name, email, googleSubject: payload.sub, emailVerifiedAt: new Date(), role: "ADMIN", tenantId: tenant.id }, include: { tenant: true } });
        });
      } else if (!user.googleSubject || !user.emailVerifiedAt) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleSubject: payload.sub, emailVerifiedAt: user.emailVerifiedAt ?? new Date() }, include: { tenant: true } });
      }
      return { token: createAuthToken({ userId: user.id, role: user.role, tenantId: user.tenantId }), user };
    },
    verifyEmail: async (_: unknown, args: { token: string }) => {
      const payload = verifyEmailVerificationToken(args.token);
      if (!payload) throw new GraphQLError("Verification link is invalid or expired.", { extensions: { code: "BAD_USER_INPUT" } });
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || user.email !== payload.email) throw new GraphQLError("Verification link is invalid or expired.", { extensions: { code: "BAD_USER_INPUT" } });
      if (!user.emailVerifiedAt) await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
      return true;
    },
    resendVerificationEmail: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuthenticatedUser(context);
      if (user.emailVerifiedAt) return true;
      await sendVerificationEmail(user);
      return true;
    },
    acceptInvitation: async (_: unknown, args: { token: string; password: string }) => {
      if (args.password.length < 8) throw new GraphQLError("Password must be at least 8 characters.", { extensions: { code: "BAD_USER_INPUT" } });
      const payload = verifyInvitationToken(args.token);
      if (!payload) throw new GraphQLError("Invitation link is invalid or expired.", { extensions: { code: "BAD_USER_INPUT" } });
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || user.email !== payload.email || user.passwordHash) throw new GraphQLError("Invitation link is invalid, expired, or already used.", { extensions: { code: "BAD_USER_INPUT" } });
      const acceptedUser = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(args.password), emailVerifiedAt: user.emailVerifiedAt ?? new Date() }
      });
      return {
        token: createAuthToken({ userId: acceptedUser.id, role: acceptedUser.role, tenantId: acceptedUser.tenantId }),
        user: acceptedUser
      };
    },
    createUser: async (
      _: unknown,
      args: {
        input: {
          name: string;
          email: string;
          role: string;
        };
      },
      context: GraphQLContext
    ) => {
      const currentUser =
        requireUserManager(context);

      const email =
        args.input.email
          .trim()
          .toLowerCase();
      const role = args.input.role;

      if (
        !manageableRoles.includes(role)
      ) {
        throw new GraphQLError(
          "This role cannot be assigned.",
          {
            extensions: {
              code: "BAD_USER_INPUT"
            }
          }
        );
      }

      const existingUser = await prisma.user.findFirst({ where: { email } });

      if (existingUser) {
        throw new GraphQLError(
          "A user with this email already exists.",
          {
            extensions: {
              code: "BAD_USER_INPUT"
            }
          }
        );
      }

      const createdUser = await prisma.user.create({
        data: {
          name: args.input.name.trim(),
          email,
          role,
          tenantId: currentUser.tenantId
        },
        include: { tenant: true }
      });
      try {
        await sendInvitationEmail(createdUser, createdUser.tenant.name);
      } catch (error) {
        await prisma.user.delete({ where: { id: createdUser.id } });
        console.error("Unable to send user invitation email.", error);
        throw new GraphQLError("Could not send the invitation email.", { extensions: { code: "SERVICE_UNAVAILABLE" } });
      }
      return createdUser;
    },
    updateUser: async (
      _: unknown,
      args: {
        id: string;
        input: {
          name?: string;
          email?: string;
          role?: string;
        };
      },
      context: GraphQLContext
    ) => {
      const currentUser =
        requireUserManager(context);

      const user =
        await prisma.user.findFirst({
          where: {
            id: Number(args.id),
            tenantId: currentUser.tenantId
          }
        });

      const canEditAdmin =
        user?.role === "ADMIN" &&
        currentUser.role === "ADMIN" &&
        user.id === currentUser.id;

      if (
        !user ||
        (user.role === "ADMIN" && !canEditAdmin)
      ) {
        throw new GraphQLError(
          "User not found.",
          {
            extensions: {
              code: "NOT_FOUND"
            }
          }
        );
      }

      if (
        args.input.role &&
        (
          user.role === "ADMIN"
            ? args.input.role !== "ADMIN"
            : !manageableRoles.includes(
                args.input.role
              )
        )
      ) {
        throw new GraphQLError(
          "This role cannot be assigned.",
          {
            extensions: {
              code: "BAD_USER_INPUT"
            }
          }
        );
      }

      const email =
        args.input.email
          ?.trim()
          .toLowerCase();

      if (email && email !== user.email) {
        const existingUser =
          await prisma.user.findFirst({
            where: {
              email,
              id: { not: user.id }
            }
          });

        if (existingUser) {
          throw new GraphQLError(
            "A user with this email already exists.",
            {
              extensions: {
                code: "BAD_USER_INPUT"
              }
            }
          );
        }
      }

      const updatedUser = await prisma.user.update({
        where: {
          id: Number(args.id)
        },
        data: {
          ...(args.input.name !== undefined
            ? {
                name:
                  args.input.name.trim()
              }
            : {}),
          ...(email
            ? {
                email,
                ...(email !== user.email
                  ? { emailVerifiedAt: null }
                  : {})
              }
            : {}),
          ...(args.input.role
            ? { role: args.input.role }
            : {})
        }
      });
      if (email && email !== user.email) {
        try {
          await sendVerificationEmail(updatedUser);
        } catch (error) {
          console.error("Unable to send updated email verification.", error);
        }
      }
      return updatedUser;
    },
    updateMyPassword: async (
      _: unknown,
      args: {
        input: {
          currentPassword: string;
          newPassword: string;
        };
      },
      context: GraphQLContext
    ) => {
      const currentUser =
        requireAuth(context);

      if (
        !verifyPassword(
          args.input.currentPassword,
          currentUser.passwordHash ?? ""
        )
      ) {
        throw new GraphQLError(
          "Current password is incorrect.",
          {
            extensions: {
              code: "BAD_USER_INPUT"
            }
          }
        );
      }

      if (
        args.input.newPassword.length < 6
      ) {
        throw new GraphQLError(
          "New password must be at least 6 characters.",
          {
            extensions: {
              code: "BAD_USER_INPUT"
            }
          }
        );
      }

      await prisma.user.update({
        where: {
          id: currentUser.id
        },
        data: {
          passwordHash: hashPassword(
            args.input.newPassword
          )
        }
      });

      return true;
    }
  }
};
