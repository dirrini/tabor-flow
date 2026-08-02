import { gql } from "@apollo/client";

export const PROJECT_HEALTH_REPORT_QUERY = gql`
  query ProjectHealthReport($projectId: ID!) {
    projectHealthReport(projectId: $projectId) {
      projectId
      projectName
      status
      progress
      totalTasks
      todoTasks
      inProgressTasks
      completedTasks
      assignedUsers
      overdueAssignments
    }
  }
`;

export const PORTFOLIO_REPORT_QUERY = gql`
  query PortfolioReport {
    portfolioReport {
      totalProjects
      activeProjects
      completedProjects
      atRiskProjects
      averageProgress
      totalTasks
      completedTasks
      overdueAssignments
      projects {
        projectId
        projectName
        status
        progress
        totalTasks
        completedTasks
        assignedUsers
        overdueAssignments
      }
      workload {
        userId
        userName
        assignedTasks
        completedAssignments
        overdueAssignments
      }
    }
  }
`;
