import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDot,
  Code2,
  ExternalLink,
  FileCode2,
  Flame,
  Folder,
  GitBranch,
  GitCommit,
  GitFork,
  GitPullRequest,
  Lightbulb,
  Link2,
  MapPin,
  Search,
  Star,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";

// Adjust these three import paths if you place the files elsewhere.
import { GitHubApiError, githubApi, loadRecentActivity } from "@/lib/githubApi";
import type {
  Contributions,
  GitHubProfile,
  GitHubRepository,
  LanguageShare,
  MonthlyActivity,
  RecentActivity,
  RecentCommit,
  RecentItem,
} from "@/lib/githubApi";
import {
  OTHER_COLOR,
  buildYearCells,
  initials,
  languageColor,
  monthLabel,
  parseGitHubUsername,
  timeAgo,
} from "@/lib/githubFormat";
import { useAsync } from "@/hooks/useAsync";
import type { AsyncState } from "@/hooks/useAsync";


type Repository = {
  name: string;
  description: string;
  language: string;
  color: string;
  stars: number;
  forks: number;
  updated: string;
  url: string;
};

// How many of the most recently updated repositories feed "Recent Commits"
// and "Issues & Pull Requests" (each repository costs 3 cached requests).
const RECENT_REPO_COUNT = 4;

// Remembers the connected GitHub username in this browser.
const STORAGE_KEY = "student360.githubUsername";

const readStoredUsername = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStoredUsername = (username: string | null) => {
  try {
    if (username) localStorage.setItem(STORAGE_KEY, username);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode); the dashboard still works for this session.
  }
};


// UI-only for now: "My Projects" has no backend connection yet.
const initialProjects = [
  {
    name: "campus-connect",
    description: "Campus Event Platform",
    linked: true,
  },
  {
    name: "portfolio-v2",
    description: "Personal Portfolio",
    linked: false,
  },
  {
    name: "study-buddy-api",
    description: "Study Buddy Platform",
    linked: false,
  },
];

const HEATMAP_LEVEL_CLASSES = [
  "bg-blue-50",
  "bg-blue-100",
  "bg-blue-300",
  "bg-blue-400",
  "bg-blue-600",
];


function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_3px_12px_rgba(65,82,150,0.025)] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 text-[14px]">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon size={22} className="shrink-0 text-blue-300" />
        <h2 className="truncate text-[18px] font-medium tracking-tight text-slate-900">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

// Loading / error / empty placeholders shared by every card.
function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
      {children}
    </div>
  );
}

const errorText = (error: Error) => error.message || "Something went wrong";


function Avatar({
  src,
  name,
  size = "normal",
}: {
  src?: string;
  name: string;
  size?: "normal" | "small";
}) {
  const sizeClasses =
    size === "small"
      ? "h-8 w-8 text-[10px]"
      : "h-[66px] w-[66px] text-xl ring-4 ring-indigo-50";

  if (src) {
    return (
      <img
        src={src}
        alt={`${name} avatar`}
        className={`shrink-0 rounded-full object-cover shadow-sm ${sizeClasses}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-300 to-blue-300 font-semibold text-white shadow-sm ${sizeClasses}`}
    >
      {initials(name)}
    </div>
  );
}


function PageHeading({
  connected,
  onConnect,
}: {
  connected: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[16px] font-medium text-blue-300">
          <span>Developer Hub</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Code2 size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              GitHub
            </h1>
            <p className="mt-1 text-[18px] text-slate-500 sm:text-xs">
              Your code, contributions, and development activity.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] font-medium">
          <Code2 size={22} />
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-emerald-500" : "bg-slate-300"
            }`}
          />
          <span className={connected ? "text-emerald-600" : "text-slate-500"}>
            {connected ? "Connected" : "Not connected"}
          </span>
        </div>

        <button
          onClick={onConnect}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-300 px-4 py-3 text-[14px] font-semibold text-white shadow-sm shadow-blue-200 transition hover:scale-101 hover:shadow-sm"
        >
          <Code2 size={20} />
          {connected ? "Manage Connection" : "Connect GitHub"}
        </button>
      </div>
    </div>
  );
}


// NEW: where the student enters their GitHub profile.
function describeConnectError(error: unknown, username: string): string {
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

function ConnectPanel({
  currentUsername,
  onConnected,
  onDisconnect,
  onClose,
}: {
  currentUsername: string | null;
  onConnected: (username: string) => void;
  onDisconnect: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentUsername ?? "");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const username = parseGitHubUsername(value);
    if (!username) {
      setError(
        "Enter a valid GitHub username or profile link, e.g. octocat or https://github.com/octocat",
      );
      return;
    }

    setChecking(true);
    setError(null);

    try {
      // Verify the account exists before saving it (the backend caches this response).
      const profile = await githubApi.profile(username);
      onConnected(profile.username);
    } catch (caught) {
      setError(describeConnectError(caught, username));
      setChecking(false);
    }
  };

  return (
    <Card>
      <SectionTitle
        icon={Code2}
        title={currentUsername ? "Manage GitHub Connection" : "Connect your GitHub"}
      />

      <p className="-mt-3 mb-4 text-[14px] text-slate-400">
        Enter your GitHub username or profile link to see your repositories,
        contributions and activity.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-slate-400 focus-within:border-blue-300">
          <Link2 size={18} />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="octocat or https://github.com/octocat"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="w-full min-w-0 bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <button
          type="submit"
          disabled={checking}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-300 px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm shadow-blue-200 transition hover:shadow-sm disabled:opacity-60"
        >
          <Code2 size={18} />
          {checking ? "Checking..." : currentUsername ? "Update" : "Connect"}
        </button>

        {currentUsername && (
          <>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-[14px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDisconnect}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-[14px] font-medium text-slate-500 transition hover:bg-slate-50"
            >
              Disconnect
            </button>
          </>
        )}
      </form>

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {error}
        </p>
      )}
    </Card>
  );
}


function ProfileCard({
  state,
  contributionsTotal,
}: {
  state: AsyncState<GitHubProfile>;
  contributionsTotal: number | null;
}) {
  const profile = state.data;

  if (state.loading) {
    return (
      <Card>
        <Loading rows={3} />
      </Card>
    );
  }

  if (state.error || !profile) {
    return (
      <Card>
        <Notice>
          {state.error ? errorText(state.error) : "Profile not available."} Use
          “Manage Connection” to check your username.
        </Notice>
      </Card>
    );
  }

  const stats = [
    { label: "Repositories", value: profile.publicRepos.toLocaleString() },
    {
      label: "Contributions",
      value: contributionsTotal === null ? "—" : contributionsTotal.toLocaleString(),
    },
    { label: "Followers", value: profile.followers.toLocaleString() },
    { label: "Following", value: profile.following.toLocaleString() },
  ];

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-3">
        <Avatar src={profile.avatar} name={profile.name ?? profile.username} />

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-1">
            <h2 className="text-xl font-bold text-slate-900">
              {profile.username}
            </h2>
            <Link
              to={profile.profileUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open GitHub profile"
              className="text-blue-300 font-bold hover:text-blue-400"
            >
              <ExternalLink size={15} />
            </Link>
          </div>

          {profile.name && (
            <p className="mt-1 text-[14px] text-slate-600">{profile.name}</p>
          )}

          {profile.bio && (
            <p className="mt-2 text-[14px] text-slate-500">{profile.bio}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[14px] text-slate-500">
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} />
                {profile.location}
              </span>
            )}
            <Link
              to={profile.profileUrl}
              className="flex items-center gap-1.5 text-blue-300 hover:underline"
            >
              <Link2 size={15} />
              github.com/{profile.username}
            </Link>
          </div>
        </div>

        <Link
          to={profile.profileUrl}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 px-3 py-2 text-[14px] font-medium text-blue-300 transition hover:bg-blue-50"
        >
          View Profile <ExternalLink size={15} />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 border-t border-slate-100 pt-4 sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`py-1 ${
              index !== 0
                ? "border-l border-slate-100 pl-4"
                : ""
            }`}
          >
            <p className="text-base font-bold text-slate-900">
              {stat.value}
            </p>
            <p className="mt-1 text-[14px] text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}


function ContributionCard({
  state,
  year,
  onYearChange,
}: {
  state: AsyncState<Contributions>;
  year: number;
  onYearChange: (year: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const cells = useMemo(
    () => buildYearCells(year, state.data?.days ?? []),
    [year, state.data],
  );

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const dayLabel = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;

  const metrics = [
    {
      label: "Total Contributions",
      value: state.data ? state.data.total.toLocaleString() : "—",
      icon: CalendarDays,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Current Streak",
      value: state.data ? dayLabel(state.data.streaks.current) : "—",
      icon: Flame,
      color: "bg-orange-50 text-orange-500",
    },
    {
      label: "Longest Streak",
      value: state.data ? dayLabel(state.data.streaks.longest) : "—",
      icon: GitBranch,
      color: "bg-indigo-50 text-indigo-600",
    },
  ];

  return (
    <Card>
      <SectionTitle
        icon={Code2}
        title="Contribution Activity"
        action={
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[14px] text-slate-600 outline-none focus:border-blue-300"
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        }
      />

      {state.error ? (
        <Notice>{errorText(state.error)}</Notice>
      ) : (
        <>
          <div className="flex gap-2">
            <div className="flex w-7 shrink-0 flex-col justify-around pb-5 pt-1 text-[13px] text-slate-400">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            <div className="min-w-0 flex-1">
              <div
                className={`grid gap-[3px] ${state.loading ? "animate-pulse opacity-60" : ""}`}
                style={{
                  gridTemplateRows: "repeat(7, minmax(0, 1fr))",
                  gridAutoFlow: "column",
                  gridAutoColumns: "minmax(0, 1fr)",
                }}
              >
                {cells.map((cell, i) =>
                  cell ? (
                    <div
                      key={cell.date}
                      title={`${cell.count} contribution${cell.count === 1 ? "" : "s"} on ${cell.date}`}
                      className={`aspect-square min-w-1 rounded-[2px] transition hover:ring-2 hover:ring-blue-300 ${
                        HEATMAP_LEVEL_CLASSES[cell.level] ?? HEATMAP_LEVEL_CLASSES[0]
                      }`}
                    />
                  ) : (
                    <div key={`pad-${i}`} className="aspect-square min-w-1" />
                  ),
                )}
              </div>

              <div className="mt-2 flex justify-between text-[13px] text-slate-400">
                {months.map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-1 text-[12px] text-slate-400">
            <span className="mr-1">Less</span>
            {HEATMAP_LEVEL_CLASSES.map((color) => (
              <span
                key={color}
                className={`h-2.5 w-2.5 rounded-[2px] ${color}`}
              />
            ))}
            <span className="ml-1">More</span>
          </div>
        </>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3 sm:gap-2">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 border-slate-100 sm:border-r sm:pr-2 last:border-r-0"
          >
            <div className={`rounded-lg p-2 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-[12px] text-slate-500">{label}</p>
              <p className="mt-0.5 text-base font-bold text-slate-900">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}


const toRepositoryView = (repo: GitHubRepository): Repository => ({
  name: repo.name,
  description: repo.description ?? "No description",
  language: repo.language ?? "Other",
  color: languageColor(repo.language),
  stars: repo.stars,
  forks: repo.forks,
  updated: timeAgo(repo.updatedAt),
  url: repo.url,
});

function RepositoriesCard({
  state,
  linkedProjects,
  onLinkProject,
}: {
  state: AsyncState<GitHubRepository[]>;
  linkedProjects: string[];
  onLinkProject: (name: string) => void;
}) {
  const repositories = useMemo(
    () => (state.data ?? []).map(toRepositoryView),
    [state.data],
  );
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("All");
  const [sort, setSort] = useState("Recently updated");
  const [showAll, setShowAll] = useState(false);

  // The filter chips come from the student's real languages (most used first).
  const filters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const repo of repositories) {
      counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
    return ["All", ...top];
  }, [repositories]);

  const filteredRepositories = useMemo(() => {
    let result = repositories.filter((repo) => {
      const matchesSearch =
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        repo.description.toLowerCase().includes(search.toLowerCase());

      const matchesLanguage =
        language === "All" || repo.language === language;

      return matchesSearch && matchesLanguage;
    });

    if (sort === "Most stars") {
      result = [...result].sort((a, b) => b.stars - a.stars);
    } else if (sort === "Name") {
      result = [...result].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    }

    return result;
  }, [repositories, search, language, sort]);

  const visibleRepositories = showAll
    ? filteredRepositories
    : filteredRepositories.slice(0, 6);

  return (
    <Card className="!p-3 sm:!p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <SectionTitle icon={BriefcaseIcon} title="Repositories" />
          <p className="-mt-3 text-[14px] text-slate-400">
            Your public repositories and recent activity
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-slate-400 sm:min-w-[160px]">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories"
              className="w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-slate-400"
            />
          </label>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="max-w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[14px] text-slate-600 outline-none"
          >
            <option>Recently updated</option>
            <option>Most stars</option>
            <option>Name</option>
          </select>
        </div>
      </div>

      {state.loading ? (
        <div className="mt-3">
          <Loading rows={4} />
        </div>
      ) : state.error ? (
        <div className="mt-3">
          <Notice>{errorText(state.error)}</Notice>
        </div>
      ) : (
        <>
          <div className="my-3 flex gap-1.5 overflow-x-auto pb-1">
            {filters.map((filter) => {
              const count =
                filter === "All"
                  ? repositories.length
                  : repositories.filter((r) => r.language === filter).length;

              return (
                <button
                  key={filter}
                  onClick={() => setLanguage(filter)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[14px] transition ${
                    language === filter
                      ? "bg-blue-300 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {filter} ({count})
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            {visibleRepositories.map((repo) => (
              <article
                key={repo.name}
                className="text-[16px] group flex min-w-0 flex-wrap items-center gap-2.5 rounded-lg border border-slate-100 p-2.5 transition hover:border-blue-200 hover:bg-blue-50/30 sm:gap-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-300">
                  <FileCode2 size={18} />
                </div>

                <div className="min-w-0 flex-1 basis-[130px]">
                  <Link
                    to={repo.url}
                    className="block truncate text-[15px] font-semibold text-slate-900 hover:text-blue-400"
                  >
                    {repo.name}
                  </Link>
                  <p className="mt-1 truncate text-[13px] text-slate-400">
                    {repo.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: repo.color }}
                  />
                  {repo.language}
                </div>

                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Star size={15} />
                  {repo.stars}
                </span>

                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <GitFork size={15} />
                  {repo.forks}
                </span>

                <span className="hidden whitespace-nowrap text-[13px] text-slate-400 md:block">
                  Updated {repo.updated}
                </span>

                <button
                  onClick={() => onLinkProject(repo.name)}
                  title={
                    linkedProjects.includes(repo.name)
                      ? "Unlink project"
                      : "Link project"
                  }
                  className={`rounded-md p-1.5 transition ${
                    linkedProjects.includes(repo.name)
                      ? "bg-blue-50 text-blue-400"
                      : "text-slate-400 hover:bg-blue-100 hover:text-blue-500"
                  }`}
                >
                  {linkedProjects.includes(repo.name) ? (
                    <Check size={16} />
                  ) : (
                    <Link2 size={16} />
                  )}
                </button>

                <Link
                  to={repo.url}
                  aria-label={`Open ${repo.name}`}
                  className="text-slate-400 transition hover:text-indigo-600"
                >
                  <ChevronRight size={16} />
                </Link>
              </article>
            ))}

            {visibleRepositories.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                {repositories.length === 0
                  ? "No public repositories yet."
                  : "No repositories match your search."}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[14px] text-slate-400">
            <span>
              Showing {visibleRepositories.length} of {filteredRepositories.length}{" "}
              repositories
            </span>

            <button
              onClick={() => setShowAll((value) => !value)}
              className="inline-flex items-center gap-1 font-medium text-blue-300 hover:text-blue-400"
            >
              {showAll ? "Show fewer" : "View all repositories"}
              <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

function BriefcaseIcon(props: React.ComponentProps<typeof BookOpen>) {
  return <Folder {...props} />;
}


function RecentCommits({
  loading,
  error,
  commits,
  profileUrl,
}: {
  loading: boolean;
  error: Error | null;
  commits: RecentCommit[];
  profileUrl: string;
}) {
  return (
    <Card>
      <SectionTitle
        icon={GitCommit}
        title="Recent Commits"
        action={
          <Link
            to={profileUrl}
            className="flex items-center gap-1 whitespace-nowrap text-[14px] text-blue-300 hover:underline"
          >
            View all <ArrowUpRight size={15} />
          </Link>
        }
      />

      {loading ? (
        <Loading rows={4} />
      ) : error ? (
        <Notice>{errorText(error)}</Notice>
      ) : commits.length === 0 ? (
        <Notice>No recent commits found.</Notice>
      ) : (
        <div>
          {commits.map((commit) => (
            <article
              key={`${commit.repo}-${commit.sha}`}
              className="flex min-w-0 items-center gap-2.5 border-t border-slate-100 py-3 first:border-t-0"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-300">
                <GitBranch size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-slate-800">
                  {commit.message.split("\n")[0]}
                </p>
                <p className="mt-1 truncate text-[13px] text-slate-400">
                  {commit.repo} <span className="mx-1">·</span> {timeAgo(commit.date)}
                </p>
              </div>

              <code className="hidden rounded border border-slate-100 bg-slate-50 px-1.5 py-1 text-[14px] text-slate-400 md:block">
                {commit.sha.slice(0, 7)}
              </code>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}


const stateLabel = (item: RecentItem): string => {
  if (item.type === "pr") {
    if (item.merged) return "Merged";
    return item.state === "open" ? "Review" : "Closed";
  }
  return item.state === "open" ? "Open" : "Closed";
};

function IssuesCard({
  loading,
  error,
  data,
  profileUrl,
}: {
  loading: boolean;
  error: Error | null;
  data: RecentActivity | null;
  profileUrl: string;
}) {
  return (
    <Card>
      <SectionTitle
        icon={GitPullRequest}
        title="Issues & Pull Requests"
        action={
          <Link
            to={profileUrl}
            className="flex items-center gap-1 whitespace-nowrap text-[14px] text-blue-300 hover:underline"
          >
            View all <ArrowUpRight size={15} />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 p-2.5">
          <div className="rounded-full bg-emerald-50 p-2 text-emerald-500">
            <CircleDot size={19} />
          </div>
          <div>
            <p className="text-medium font-bold text-slate-900">
              {data ? data.openIssues : "—"}
            </p>
            <p className="text-[13px] text-slate-400">Open Issues</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 p-2.5">
          <div className="rounded-full bg-violet-50 p-2 text-violet-600">
            <GitPullRequest size={19} />
          </div>
          <div>
            <p className="text-medium font-bold text-slate-900">
              {data ? data.openPullRequests : "—"}
            </p>
            <p className="text-[13px] text-slate-400">Open Pull Requests</p>
          </div>
        </div>
      </div>

      <h3 className="mb-1 mt-4 text-[14px] font-semibold text-slate-600">
        Recent Activity
      </h3>

      {loading ? (
        <Loading rows={3} />
      ) : error ? (
        <Notice>{errorText(error)}</Notice>
      ) : !data || data.items.length === 0 ? (
        <Notice>No issues or pull requests yet.</Notice>
      ) : (
        data.items.map((issue) => (
          <article
            key={`${issue.repo}-${issue.type}-${issue.number}`}
            className="flex items-center gap-2.5 border-t border-slate-100 py-3"
          >
            <div
              className={`shrink-0 ${
                issue.type === "pr" ? "text-blue-500" : "text-blue-400"
              }`}
            >
              {issue.type === "pr" ? (
                <GitPullRequest size={20} />
              ) : (
                <CircleDot size={20} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-slate-800">
                {issue.title}
              </p>
              <p className="mt-1 truncate text-[13px] text-slate-400">
                #{issue.number} <span className="mx-1">·</span> {issue.repo}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={`rounded-full px-2 py-1 text-[13px] ${
                  issue.type === "pr"
                    ? "bg-blue-50 text-blue-500"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {stateLabel(issue)}
              </span>
              <span className="text-[11px] text-slate-400">
                {timeAgo(issue.createdAt)}
              </span>
            </div>
          </article>
        ))
      )}
    </Card>
  );
}


function ActivityChart({ state }: { state: AsyncState<MonthlyActivity[]> }) {
  const chart = useMemo(() => {
    const data = (state.data ?? []).map((item) => ({
      month: monthLabel(item.month),
      commits: item.commits,
      prs: item.pullRequests,
      issues: item.issues,
    }));

    // Axis grows with the data (it was fixed at 0-40 for the demo numbers).
    const highest = Math.max(0, ...data.flatMap((d) => [d.commits, d.prs, d.issues]));
    const step = Math.max(10, Math.ceil(highest / 4 / 10) * 10);

    return { data, step };
  }, [state.data]);

  return (
    <Card>
      <SectionTitle icon={Activity} title="Repository Activity" />

      <p className="-mt-3 mb-4 text-[13px] text-slate-400">
        Commits, PRs and issues over the last 6 months
      </p>

      <div className="mb-3 flex flex-wrap justify-end gap-3 text-[13px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          Commits
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-300" />
          PRs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-200" />
          Issues
        </span>
      </div>

      <div className="h-[200px] w-full">
        {state.loading ? (
          <div className="h-full animate-pulse rounded-lg bg-slate-100" />
        ) : state.error ? (
          <Notice>{errorText(state.error)}</Notice>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chart.data}
              margin={{ top: 4, right: 0, left: -22, bottom: 0 }}
              barGap={2}
              barCategoryGap="28%"
            >
              <CartesianGrid
                stroke="#EDF0FB"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8491B0", fontSize: 13 }}
                dy={8}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8491B0", fontSize: 13 }}
                domain={[0, chart.step * 4]}
                ticks={[0, chart.step, chart.step * 2, chart.step * 3, chart.step * 4]}
              />

              <Tooltip
                cursor={{ fill: "#F5F3FF" }}
                contentStyle={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "10px",
                  fontSize: "11px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                }}
              />

              <Bar
                dataKey="commits"
                name="Commits"
                fill="#60A5FA"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="prs"
                name="Pull requests"
                fill="#93C5FD"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="issues"
                name="Issues"
                fill="#BFDBFE"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}


function LanguageCard({ state }: { state: AsyncState<LanguageShare[]> }) {
  // Top 5 languages; everything else is grouped as "Other" so the bar still adds up to 100%.
  const languages = useMemo(() => {
    const all = state.data ?? [];
    const top = all.slice(0, 5).map((item) => ({
      name: item.language,
      color: languageColor(item.language),
      percent: Math.round(item.percentage * 10) / 10,
    }));
    const rest = all.slice(5).reduce((sum, item) => sum + item.percentage, 0);

    return rest > 0
      ? [...top, { name: "Other", color: OTHER_COLOR, percent: Math.round(rest * 10) / 10 }]
      : top;
  }, [state.data]);

  return (
    <Card>
      <SectionTitle icon={Code2} title="Languages" />

      <p className="-mt-3 mb-4 text-[13px] text-slate-400">
        Your coding language distribution
      </p>

      {state.loading ? (
        <Loading rows={4} />
      ) : state.error ? (
        <Notice>{errorText(state.error)}</Notice>
      ) : languages.length === 0 ? (
        <Notice>No language data yet.</Notice>
      ) : (
        <>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 text-[16px]">
            {languages.map((language) => (
              <div
                key={language.name}
                style={{
                  width: `${language.percent}%`,
                  backgroundColor: language.color,
                }}
                title={`${language.name}: ${language.percent}%`}
              />
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {languages.map((language) => (
              <div key={language.name}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: language.color }}
                    />
                    {language.name}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {language.percent}%
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${language.percent}%`,
                      backgroundColor: language.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}


function LinkedProjects({
  linkedProjects,
  onLinkProject,
}: {
  linkedProjects: string[];
  onLinkProject: (name: string) => void;
}) {
  return (
    <Card>
      <SectionTitle icon={Link2} title="Linked Projects" />

      <p className="-mt-3 mb-3 text-[13px] text-slate-400">
        Connect repositories to your projects in My Projects
      </p>

      <div className="space-y-1">
        {initialProjects.map((project) => {
          const linked = linkedProjects.includes(project.name);

          return (
            <div
              key={project.name}
              className="flex min-w-0 items-center gap-2 border-t border-slate-100 py-3 first:border-t-0"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-300">
                <Folder size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-slate-800">
                  {project.name}
                </p>
                <p className="mt-1 truncate text-[13px] text-slate-400">
                  {project.description}
                </p>
              </div>

              <button
                onClick={() => onLinkProject(project.name)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-[15px] transition ${
                  linked
                    ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                    : "border-blue-300 text-blue-400 hover:bg-blue-50"
                }`}
              >
                {linked ? (
                  <span className="flex items-center gap-1">
                    <Check size={13} />
                    Linked
                  </span>
                ) : (
                  "Link Project"
                )}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}


function ProTip() {
  return (
    <section className="relative flex min-h-[150px] overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100/80 p-4 sm:min-h-[130px]">
      <div className="relative z-10 flex max-w-[340px] gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-blue-300">
          <Lightbulb size={22} />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">Pro Tip</h3>

          <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
            Link your repositories to your projects in My Projects to keep
            track of your real work and showcase your coding journey!
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-5 right-2 flex h-32 w-32 items-center justify-center sm:right-6">
        <div className="absolute right-2 top-0 text-2xl text-blue-300">
          ✦
        </div>
        <div className="absolute left-3 top-5 text-xl text-blue-300">
          ✧
        </div>
        <div className="absolute bottom-7 left-2 rounded-xl bg-white/80 p-3 text-blue-500">
          <Code2 size={25} />
        </div>
        <div className="absolute bottom-7 right-1 flex h-[60px] w-[60px] items-center justify-center rounded-xl border-4 border-blue-200 bg-gradient-to-br from-blue-300 to-blue-400 text-white">
          <Code2 size={28} />
        </div>
      </div>
    </section>
  );
}


// Loads all dashboard data for one username. Each section has its own loading/error state,
// so one failing request never blanks the whole page.
function DashboardBody({ username }: { username: string }) {
  const [year, setYear] = useState(new Date().getFullYear());

  // UI-only until "My Projects" is connected to a backend.
  const [linkedProjects, setLinkedProjects] = useState<string[]>([]);

  const toggleLinkedProject = (name: string) => {
    setLinkedProjects((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  };

  const profile = useAsync((signal) => githubApi.profile(username, signal), [username]);
  const repositories = useAsync((signal) => githubApi.repositories(username, signal), [username]);
  const languages = useAsync((signal) => githubApi.languages(username, signal), [username]);
  const monthly = useAsync((signal) => githubApi.monthlyActivity(username, signal), [username]);
  const contributions = useAsync(
    (signal) => githubApi.contributions(username, year, signal),
    [username, year],
  );

  // "Recent" sections use the most recently updated repositories (forks excluded: their
  // history belongs to someone else).
  const recentRepoNames = useMemo(
    () =>
      (repositories.data ?? [])
        .filter((repo) => !repo.isFork)
        .slice(0, RECENT_REPO_COUNT)
        .map((repo) => repo.name),
    [repositories.data],
  );

  const recent = useAsync(
    recentRepoNames.length > 0
      ? (signal) => loadRecentActivity(username, recentRepoNames, signal)
      : null,
    [username, recentRepoNames.join(",")],
  );

  const recentLoading = repositories.loading || recent.loading;
  const recentError = repositories.error ?? recent.error;
  const profileUrl = profile.data?.profileUrl ?? `https://github.com/${username}`;

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="flex min-w-0 flex-col gap-4">
        <ProfileCard
          state={profile}
          contributionsTotal={contributions.data?.total ?? null}
        />

        <div className="grid grid-cols-1 gap-4">
          <RepositoriesCard
            state={repositories}
            linkedProjects={linkedProjects}
            onLinkProject={toggleLinkedProject}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          <ActivityChart state={monthly} />

          <div id="linked-projects" className="min-w-0">
            <LinkedProjects
              linkedProjects={linkedProjects}
              onLinkProject={toggleLinkedProject}
            />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <ContributionCard state={contributions} year={year} onYearChange={setYear} />

        <RecentCommits
          loading={recentLoading}
          error={recentError}
          commits={recent.data?.commits ?? []}
          profileUrl={profileUrl}
        />

        <IssuesCard
          loading={recentLoading}
          error={recentError}
          data={recent.data}
          profileUrl={profileUrl}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <LanguageCard state={languages} />

          <ProTip />
        </div>
      </div>
    </div>
  );
}


export default function GitHubDashboard() {
  const [username, setUsername] = useState<string | null>(readStoredUsername);
  const [showConnectPanel, setShowConnectPanel] = useState(false);

  const connected = username !== null;

  const handleConnected = (name: string) => {
    writeStoredUsername(name);
    setUsername(name);
    setShowConnectPanel(false);
  };

  const handleDisconnect = () => {
    writeStoredUsername(null);
    setUsername(null);
    setShowConnectPanel(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FF] font-sans text-slate-800">
      <main className="mx-auto max-w-[1750px] px-3 py-5 sm:px-5 lg:px-7">
          <PageHeading
            connected={connected}
            onConnect={() => setShowConnectPanel((open) => !open)}
          />

          {(!connected || showConnectPanel) && (
            <div className="mb-4">
              <ConnectPanel
                currentUsername={username}
                onConnected={handleConnected}
                onDisconnect={handleDisconnect}
                onClose={() => setShowConnectPanel(false)}
              />
            </div>
          )}

          {/* key={username}: switching accounts starts from a clean state */}
          {username && <DashboardBody key={username} username={username} />}

          <footer className="mt-6 flex flex-col justify-between gap-2 border-t border-indigo-100/80 py-4 text-[14px] text-slate-400 sm:flex-row sm:items-center">
            <span>Student 360° · Developer Hub</span>
            <span>
              Keep learning, keep building{" "}
              <span className="text-blue-400 text-xl">♥</span>
            </span>
          </footer>
      </main>
    </div>
  );
}