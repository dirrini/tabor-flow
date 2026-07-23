import {
  Navigate,
  useLocation
} from "react-router-dom";
import { useQuery } from "@apollo/client/react";

import { ME_QUERY }
  from "../../graphql/queries/auth";
import {
  clearAuthToken,
  getAuthToken
} from "../../lib/authStorage";

import type { ReactNode } from "react";

type MeQueryData = {
  me: {
    id: string;
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
  } | null;
};

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children
}: ProtectedRouteProps) {
  const location = useLocation();
  const token = getAuthToken();
  const {
    data,
    loading
  } = useQuery<MeQueryData>(ME_QUERY, {
    skip: !token,
    fetchPolicy: "cache-and-network"
  });

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location
        }}
      />
    );
  }

  if (loading && !data) {
    return (
      <div
        className="
          flex
          h-screen
          items-center
          justify-center
          bg-slate-100
          text-slate-500
        "
      >
        Loading session...
      </div>
    );
  }

  if (!data?.me) {
    clearAuthToken();

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location
        }}
      />
    );
  }

  if (!data.me.emailVerified) {
    return (
      <Navigate
        to="/verify-email"
        replace
      />
    );
  }

  return children;
}
