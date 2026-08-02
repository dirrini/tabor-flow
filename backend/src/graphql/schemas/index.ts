import { projectSchema } from "./projectSchema";
import { dashboardSchema } from "./dashboardSchema";
import { authSchema } from "./authSchema";
import { reportSchema } from "./reportSchema";

export const typeDefs = `#graphql

  type Query {
    health: String!
  }

  ${projectSchema}

  ${dashboardSchema}

  ${authSchema}

  ${reportSchema}

`;
