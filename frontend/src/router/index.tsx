import {
  createBrowserRouter
} from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Projects from "../pages/Projects";
import ProjectDetails from "../pages/ProjectDetails";
import Timeline from "../pages/Timeline";
import Users from "../pages/Users";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import Landing from "../pages/Landing";
import VerifyEmail from "../pages/VerifyEmail";
import AcceptInvitation from "../pages/AcceptInvitation";
import Workspace from "../pages/Workspace";
import Reports from "../pages/Reports";

export const router =
  createBrowserRouter([
    {
      path: "/app",
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),

      children: [
        {
          index: true,
          element: <Dashboard />
        },
        {
          path: "projects",
          element: <Projects />
        },
        {
          path: "projects/:id",
          element: <ProjectDetails />
        },
        {
          path: "projects/:id/:section",
          element: <ProjectDetails />
        },
        {
          path: "timeline",
          element: <Timeline />
        },
        {
          path: "users",
          element: <Users />
        },
        {
          path: "reports",
          element: <Reports />
        },
        {
          path: "workspace",
          element: <Workspace />
        }
      ]
    },
    { path: "/", element: <Landing /> },
    {
      path: "/login",
      element: <Login />
    },
    { path: "/register", element: <Login mode="register" /> },
    { path: "/verify-email", element: <VerifyEmail /> },
    { path: "/accept-invitation", element: <AcceptInvitation /> }
  ]);
