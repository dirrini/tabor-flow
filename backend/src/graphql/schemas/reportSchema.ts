export const reportSchema = `#graphql

  type ProjectHealthReport {
    projectId: ID!
    projectName: String!
    status: String!
    progress: Int!
    totalTasks: Int!
    todoTasks: Int!
    inProgressTasks: Int!
    completedTasks: Int!
    assignedUsers: Int!
    overdueAssignments: Int!
  }

  type PortfolioReport {
    totalProjects: Int!
    activeProjects: Int!
    completedProjects: Int!
    atRiskProjects: Int!
    averageProgress: Int!
    totalTasks: Int!
    completedTasks: Int!
    overdueAssignments: Int!
    projects: [PortfolioProjectRow!]!
    workload: [WorkloadReportRow!]!
  }

  type PortfolioProjectRow {
    projectId: ID!
    projectName: String!
    status: String!
    progress: Int!
    totalTasks: Int!
    completedTasks: Int!
    assignedUsers: Int!
    overdueAssignments: Int!
  }

  type WorkloadReportRow {
    userId: ID!
    userName: String!
    assignedTasks: Int!
    completedAssignments: Int!
    overdueAssignments: Int!
  }

  extend type Query {
    projectHealthReport(projectId: ID!): ProjectHealthReport!
    portfolioReport: PortfolioReport!
  }

`;
