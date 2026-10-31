/*
 * Everything the dashboard needs from your backend (/api/github/...).
 * Endpoints return { success: true, data } or { success: false, error: { code, message } }.
 */
// Set VITE_API_URL in frontend/.env, e.g. VITE_API_URL=http://localhost:5000
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000";

// ADAPT THIS ONE LINE: return the logged-in user's access token, the same one your other
// API calls send as "Authorization: Bearer <token>". If you already have an axios instance
// or a fetch wrapper that attaches it (and refreshes it when expired), use that inside request().
const getAccessToken = (): string | null => localStorage.getItem("accessToken");

/* types*/

export type GitHubProfile = {
  username: string;
  name: string | null;
  avatar: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  profileUrl: string;
  createdAt: string;
};

export type GitHubRepository = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  visibility: string;
  isFork: boolean;
  updatedAt: string;
  createdAt: string;
};

export type LanguageShare = { language: string; bytes: number; percentage: number };

export type GitHubCommit = {
  sha: string;
  message: string;
  author: string | null;
  date: string | null;
  url: string;
};

export type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  createdAt: string;
};

export type GitHubPullRequest = GitHubIssue & { merged: boolean };

export type ContributionDay = { date: string; count: number; level: number };

export type Contributions = {
  year: number;
  total: number;
  streaks: { current: number; longest: number };
  days: ContributionDay[];
};

export type MonthlyActivity = {
  month: string; // "2026-05"
  commits: number;
  pullRequests: number;
  issues: number;
};

/* errors*/

export class GitHubApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "GitHubApiError";
    this.code = code;
    this.status = status;
  }
}

/* requests */

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = getAccessToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/github${path}`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new GitHubApiError("NETWORK_ERROR", "Cannot reach the server. Please try again.", 0);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.success) {
    // Our controller sends { error: { code, message } }; your errorHandler (e.g. a 401) may differ.
    const code = body?.error?.code ?? (response.status === 401 ? "UNAUTHENTICATED" : "REQUEST_FAILED");
    const message =
      body?.error?.message ?? body?.message ?? (response.status === 401 ? "Please log in again." : "Request failed");
    throw new GitHubApiError(code, message, response.status);
  }

  return body.data as T;
}

const enc = encodeURIComponent;

export const githubApi = {
  profile: (username: string, signal?: AbortSignal) =>
    request<GitHubProfile>(`/${enc(username)}/profile`, signal),

  repositories: (username: string, signal?: AbortSignal) =>
    request<GitHubRepository[]>(`/${enc(username)}/repositories`, signal),

  languages: (username: string, signal?: AbortSignal) =>
    request<LanguageShare[]>(`/${enc(username)}/languages`, signal),

  contributions: (username: string, year: number, signal?: AbortSignal) =>
    request<Contributions>(`/${enc(username)}/contributions?year=${year}`, signal),

  monthlyActivity: (username: string, signal?: AbortSignal) =>
    request<MonthlyActivity[]>(`/${enc(username)}/activity/monthly`, signal),

  commits: (username: string, repo: string, signal?: AbortSignal) =>
    request<GitHubCommit[]>(`/${enc(username)}/repositories/${enc(repo)}/commits`, signal),

  issues: (username: string, repo: string, signal?: AbortSignal) =>
    request<GitHubIssue[]>(`/${enc(username)}/repositories/${enc(repo)}/issues`, signal),

  pullRequests: (username: string, repo: string, signal?: AbortSignal) =>
    request<GitHubPullRequest[]>(`/${enc(username)}/repositories/${enc(repo)}/pull-requests`, signal),
};

/* "recent activity" across repositories */

// GitHub has no "latest commits / issues across all my repos" endpoint, so the dashboard
// asks for the few most recently updated repositories and merges the results.
// Backend responses are cached, so reopening the page costs no GitHub requests.

export type RecentCommit = GitHubCommit & { repo: string };

export type RecentItem = {
  type: "issue" | "pr";
  number: number;
  title: string;
  repo: string;
  state: string;
  merged: boolean;
  createdAt: string;
  url: string;
};

export type RecentActivity = {
  commits: RecentCommit[];
  items: RecentItem[];
  openIssues: number;
  openPullRequests: number;
};

const byNewest = (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime();

export async function loadRecentActivity(
  username: string,
  repos: string[],
  signal?: AbortSignal,
): Promise<RecentActivity> {
  const perRepo = await Promise.all(
    repos.map(async (repo) => {
      const results = await Promise.allSettled([
        githubApi.commits(username, repo, signal),
        githubApi.issues(username, repo, signal),
        githubApi.pullRequests(username, repo, signal),
      ]);
      return { repo, results };
    }),
  );

  // One failing repository should not empty the card, but if EVERYTHING failed, say so.
  const allResults = perRepo.flatMap((entry) => entry.results);
  const firstFailure = allResults.find((result) => result.status === "rejected");
  if (firstFailure && allResults.every((result) => result.status === "rejected")) {
    throw (firstFailure as PromiseRejectedResult).reason;
  }

  const commits: RecentCommit[] = [];
  const items: RecentItem[] = [];

  for (const { repo, results } of perRepo) {
    const [commitsResult, issuesResult, pullsResult] = results;

    if (commitsResult.status === "fulfilled") {
      commits.push(...commitsResult.value.map((commit) => ({ ...commit, repo })));
    }
    if (issuesResult.status === "fulfilled") {
      items.push(
        ...issuesResult.value.map((issue) => ({
          type: "issue" as const,
          number: issue.number,
          title: issue.title,
          repo,
          state: issue.state,
          merged: false,
          createdAt: issue.createdAt,
          url: issue.url,
        })),
      );
    }
    if (pullsResult.status === "fulfilled") {
      items.push(
        ...pullsResult.value.map((pull) => ({
          type: "pr" as const,
          number: pull.number,
          title: pull.title,
          repo,
          state: pull.state,
          merged: pull.merged,
          createdAt: pull.createdAt,
          url: pull.url,
        })),
      );
    }
  }

  return {
    commits: commits
      .filter((commit) => commit.date)
      .sort((a, b) => byNewest(a.date as string, b.date as string))
      .slice(0, 4),
    items: items.sort((a, b) => byNewest(a.createdAt, b.createdAt)).slice(0, 3),
    openIssues: items.filter((item) => item.type === "issue" && item.state === "open").length,
    openPullRequests: items.filter((item) => item.type === "pr" && item.state === "open").length,
  };
}