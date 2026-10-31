import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import {
  apiRequest,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/lib/api";
import { config } from "@/config";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type RefreshResponse = {
  accessToken: string;
};

export default function ProtectedRoute() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const location = useLocation();

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        // If there is no access token, try the refresh cookie first.
        if (!getAccessToken()) {
          const refreshed = await apiRequest<RefreshResponse>(
            `${config.api.authPrefix}/refresh`,
            { method: "POST" },
          );

          setAccessToken(refreshed.accessToken);
        }

        // Verify that the access token is accepted by the backend.
        try {
          await apiRequest(`${config.api.authPrefix}/me`);
        } catch {
          // The access token may have expired. Try refreshing it once.
          const refreshed = await apiRequest<RefreshResponse>(
            `${config.api.authPrefix}/refresh`,
            { method: "POST" },
          );

          setAccessToken(refreshed.accessToken);

          // This request must succeed before we allow access.
          await apiRequest(`${config.api.authPrefix}/me`);
        }

        if (active) {
          setStatus("authenticated");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);

        clearAccessToken();

        if (active) {
          setStatus("unauthenticated");
        }
      }
    }

    void checkAuth();

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-600">
        Checking your session...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}