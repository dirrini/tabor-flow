import { projectResolver } from "./projectResolver";
import { dashboardResolver } from "./dashboardResolver";
import { authResolver } from "./authResolver";
import { reportResolver } from "./reportResolver";

export const resolvers = {
  Tenant: authResolver.Tenant,
  User: authResolver.User,
  Query: {
    ...projectResolver.Query,
    ...dashboardResolver.Query,
    ...authResolver.Query,
    ...reportResolver.Query,

    health: () =>
      "TaborFlow API is running 🚀"
  },

  Mutation: {
    ...projectResolver.Mutation,
    ...authResolver.Mutation
  }
};
