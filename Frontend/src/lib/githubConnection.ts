import { GitHubApiError } from "./githubApi";

// The GitHub username the student connected. The GitHub dashboard and My Projects share it
// (same key as in GitHubDashboard.tsx), so connecting on one page connects both.
export const GITHUB_USERNAME_STORAGE_KEY = "student360.githubUsername";

export const readStoredUsername = (): string | null => {
  try {
    return localStorage.getItem(GITHUB_USERNAME_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const writeStoredUsername = (username: string | null): void => {
  try {
    if (username) localStorage.setItem(GITHUB_USERNAME_STORAGE_KEY, username);
    else localStorage.removeItem(GITHUB_USERNAME_STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode); the page still works for this session.
  }
};

export function describeConnectError(error: unknown, username: string): string {
  if (error instanceof GitHubApiError) {
    switch (error.code) {
      case "NOT_FOUND":
        return `We could not find a GitHub user named "${username}".`;
      case "UNAUTHENTICATED":
        return "Your session has expired. Please log in again.";
      case "RATE_LIMITED":
      case "TOO_MANY_REQUESTS":
        return "Too many requests right now. Please wait a minute and try again.";
      default:
        return error.message;
    }
  }
  return "Something went wrong. Please try again.";
}