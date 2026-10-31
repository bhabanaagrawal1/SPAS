import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";

// Authentication pages and protection
import LoginPage from "./pages/loginpage";
import SignupPage from "./pages/signuppage";
import ProtectedRoute from "./components/protected-route";

// Shared sidebar layout
import SidebarLayout from "@/layouts/sidebarLayout";

// Academic pages
import Overview from "@/pages/overview";
import AcademicPerformance from "@/pages/academicPerformance";
import MLInsights from "@/pages/mlinsights";

// Developer Hub pages
import CodingProfiles from "@/pages/codingProfiles";
import MyProjects from "@/pages/myProjects";
import GitHubPage from "@/pages/githubdashboard";
import TasksPage from "@/pages/tasks";

// Settings pages
import GeneralSettingsPage from "@/pages/generalSettings";
import BillingPage from "@/pages/billing";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />

      <Routes>
        {/* Redirect the root URL to login */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Public routes */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Shared layout: sidebar remains visible */}
          <Route element={<SidebarLayout />}>
            {/* =========================
                ACADEMIC
            ========================= */}

            <Route
              path="/overview"
              element={<Overview />}
            />

            <Route
              path="/academic-performance"
              element={<AcademicPerformance />}
            />

            <Route
              path="/ml-insights"
              element={<MLInsights />}
            />

            {/* =========================
                DEVELOPER HUB
            ========================= */}

            <Route
              path="/developer-hub/coding-profiles"
              element={<CodingProfiles />}
            />

            <Route
              path="/developer-hub/projects"
              element={<MyProjects />}
            />

            <Route
              path="/developer-hub/github"
              element={<GitHubPage />}
            />

            <Route
              path="/developer-hub/tasks"
              element={<TasksPage />}
            />

            {/* =========================
                SETTINGS
            ========================= */}

            <Route
              path="/settings/general"
              element={<GeneralSettingsPage />}
            />

            <Route
              path="/settings/billing"
              element={<BillingPage />}
            />
          </Route>
        </Route>

        {/* Redirect unknown URLs to login */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
