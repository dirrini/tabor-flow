export const authSchema = `#graphql

  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    emailVerified: Boolean!
    tenant: Tenant!
  }

  type Tenant {
    id: ID!
    name: String!
    slug: String!
    plan: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  extend type Query {
    me: User
    users: [User!]!
  }

  input CreateUserInput {
    name: String!
    email: String!
    role: String!
  }

  input UpdateUserInput {
    name: String
    email: String
    role: String
  }

  input UpdateMyPasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  extend type Mutation {
    login(
      email: String!
      password: String!
    ): AuthPayload!

    register(name: String!, organizationName: String!, email: String!, password: String!): AuthPayload!
    loginWithGoogle(credential: String!): AuthPayload!
    verifyEmail(token: String!): Boolean!
    resendVerificationEmail: Boolean!
    acceptInvitation(token: String!, password: String!): AuthPayload!

    createUser(
      input: CreateUserInput!
    ): User!

    updateUser(
      id: ID!
      input: UpdateUserInput!
    ): User!

    updateMyPassword(
      input: UpdateMyPasswordInput!
    ): Boolean!
  }

`;
