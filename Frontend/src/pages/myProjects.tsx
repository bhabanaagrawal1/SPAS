import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Code2,
  ExternalLink,
  Folder,
  GitFork,
  Layers3,
  Lightbulb,
  Link2,
  MoreVertical,
  Plus,
  Search,
  Star,
  TrendingUp,
  Zap,
  CircleHelp,
} from "lucide-react";

import { githubApi } from "@/lib/githubApi";
import type { ProjectIdea } from "@/lib/githubApi";
import {
  describeConnectError,
  readStoredUsername,
  writeStoredUsername,
} from "@/lib/githubConnection";
import { parseGitHubUsername } from "@/lib/githubFormat";
import { MAX_PINNED } from "@/lib/pinnedProjects";
import {
  artworkFor,
  buildActivity,
  buildActivityFromRepositories,
  createdThisMonth,
  formatCount,
  technologyCounts,
} from "@/lib/projectsFormat";
import type { ArtworkType, Project, Status } from "@/lib/projectsFormat";
import { useAsync } from "@/hooks/useAsync";
import { usePinnedProjects } from "@/hooks/usePinnedProjects";

// Shown only when the AI ideas cannot be loaded (no key, quota used up, offline...).
const FALLBACK_IDEAS: ProjectIdea[] = [
  {
    title: "AI Study Assistant",
    tag: "Trending",
    description:
      "Build an AI-powered study assistant for notes, doubt solving and personalized learning.",
    tech: ["React", "OpenAI", "Node.js"],
  },
  {
    title: "Mobile Expense Tracker",
    tag: "Beginner Friendly",
    description:
      "A simple mobile app to track daily expenses and manage your budget.",
    tech: ["React Native", "Firebase", "SQLite"],
  },
  {
    title: "DevOps Dashboard",
    tag: "Popular",
    description:
      "Monitor deployments, system health and CI/CD pipelines in one place.",
    tech: ["Docker", "Kubernetes", "Grafana"],
  },
];

const IDEA_ICONS = [
  <Code2 key="code" size={16} />,
  <BookOpen key="book" size={16} />,
  <Layers3 key="layers" size={16} />,
];

// Symbol and color for the technologies your design already knew; anything else gets a neutral mark.
const STACK_MARKS: Record<string, [string, string]> = {
  React: ["✳", "text-sky-500"],
  "Node.js": ["◉", "text-emerald-600"],
  TypeScript: ["▣", "text-blue-600"],
  JavaScript: ["▣", "text-amber-500"],
  Python: ["⌘", "text-amber-500"],
  MongoDB: ["◉", "text-green-600"],
  PostgreSQL: ["◈", "text-sky-600"],
  "Tailwind CSS": ["≋", "text-cyan-500"],
  Firebase: ["ϟ", "text-orange-500"],
};
const DEFAULT_MARK: [string, string] = ["◆", "text-slate-400"];

const GITHUB_NEW_REPOSITORY_URL = "https://github.com/new";

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(35,39,80,0.035)] ${className}`}
    >
      {children}
    </section>
  );
}
function Artwork({ type }: { type: ArtworkType }) {
  if (type === "github")
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-white">
        <Code2 size={56} strokeWidth={1.6} />
      </div>
    );
  if (type === "mountain")
    return (
      <div className="relative h-full overflow-hidden bg-gradient-to-b from-sky-300 via-blue-300 to-slate-800">
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-slate-700 [clip-path:polygon(0_100%,0_55%,20%_20%,35%_54%,55%_0,78%_52%,100%_22%,100%_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-indigo-950/60 [clip-path:polygon(0_100%,0_52%,23%_70%,45%_18%,68%_62%,84%_32%,100%_58%,100%_100%)]" />
        <div className="absolute right-7 top-4 h-8 w-8 rounded-full bg-amber-100/80" />
      </div>
    );
  if (type === "mobile")
    return (
      <div className="flex h-full items-center justify-center gap-3 bg-gradient-to-br from-blue-400 to-blue-500">
        <div className="h-20 w-12 rotate-[-9deg] rounded-xl border-[3px] border-slate-900 bg-white p-1.5 shadow-lg">
          <div className="mb-2 h-1 w-4 rounded-full bg-slate-300" />
          {["bg-blue-100", "bg-blue-100", "bg-amber-100", "bg-emerald-100"].map(
            (c) => (
              <i key={c} className={`mb-1 block h-3 rounded ${c}`} />
            ),
          )}
        </div>
        <div className="h-24 w-14 rotate-[7deg] rounded-xl border-[3px] border-slate-900 bg-white p-1.5 shadow-lg">
          <div className="mb-2 h-1 w-4 rounded-full bg-slate-300" />
          <div className="h-5 rounded bg-blue-100" />
          <div className="mt-2 h-2 rounded bg-slate-100" />
          <div className="mt-1 h-2 w-3/4 rounded bg-slate-100" />
          <div className="mt-3 h-6 rounded bg-blue-100" />
        </div>
      </div>
    );
  if (type === "commerce" || type === "blog")
    return (
      <div className="flex h-full items-center justify-center gap-3 bg-gradient-to-br from-stone-100 to-slate-200 p-3">
        <div className="w-3/4 rotate-[-3deg] rounded-sm border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mx-auto mb-2 h-2 w-1/2 rounded bg-slate-300" />
          <div className="flex gap-2">
            <div className="h-12 w-1/2 rounded bg-gradient-to-br from-blue-100 to-amber-100" />
            <div className="flex-1 space-y-1">
              <i className="block h-1.5 rounded bg-slate-200" />
              <i className="block h-1.5 rounded bg-slate-200" />
              <i className="block h-1.5 w-2/3 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  return (
    <div className="relative h-full overflow-hidden bg-linear-to-br from-blue-200 via-blue-200 to-blue-100 p-3">
      <div className="absolute inset-3 overflow-hidden rounded-md border border-white/70 bg-white/90 p-2 shadow-lg">
        <div className="flex items-center gap-1 border-b border-slate-100 pb-1">
          {["bg-rose-300", "bg-amber-300", "bg-emerald-300"].map((c) => (
            <i key={c} className={`h-1.5 w-1.5 rounded-full ${c}`} />
          ))}
          <i className="ml-2 h-1.5 w-1/3 rounded bg-slate-200" />
        </div>
        <div className="mt-2 grid h-[calc(100%-18px)] grid-cols-[1fr_2fr] gap-2">
          <div className="space-y-1.5">
            <i className="block h-2 rounded bg-blue-100" />
            <i className="block h-2 rounded bg-slate-100" />
            <i className="block h-2 rounded bg-slate-100" />
            <i className="block h-2 rounded bg-blue-100" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[
              "bg-blue-100",
              "bg-blue-100",
              "bg-amber-100",
              "bg-emerald-100",
            ].map((c) => (
              <i key={c} className={`rounded ${c}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function StatusBadge({ status }: { status: Status }) {
  const cls =
    status === "Completed"
      ? "bg-emerald-50 text-emerald-600"
      : status === "In Progress"
        ? "bg-blue-50 text-blue-400"
        : "bg-slate-200 text-slate-500";
  return (
    <span
      className={`whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

// Shown until the student connects a GitHub account (also used to change the account).
function ConnectGitHubPanel({
  currentUsername,
  onConnected,
  onCancel,
}: {
  currentUsername: string | null;
  onConnected: (username: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(currentUsername ?? "");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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
      // Make sure the account exists before saving it.
      const profile = await githubApi.profile(username);
      onConnected(profile.username);
    } catch (caught) {
      setError(describeConnectError(caught, username));
      setChecking(false);
    }
  };

  return (
    <Panel className="p-5">
      <h2 className="flex items-center gap-2 text-[18px] font-semibold text-slate-900">
        <Code2 size={20} className="text-blue-400" />
        {currentUsername ? "Change GitHub account" : "Connect your GitHub"}
      </h2>
      <p className="mb-4 mt-1 text-[14px] text-slate-500">
        Your public repositories are shown here as projects. Enter your GitHub
        username or profile link to get started.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-400 focus-within:border-blue-400">
          <Link2 size={17} />
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
          className="rounded-xl bg-blue-400 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {checking ? "Checking..." : currentUsername ? "Update" : "Connect"}
        </button>

        {currentUsername && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </form>

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {error}
        </p>
      )}
    </Panel>
  );
}

function SkeletonCard() {
  return <div className="h-72 animate-pulse rounded-xl bg-slate-100" aria-busy="true" />;
}

export default function MyProjects() {
  const [username, setUsername] = useState<string | null>(readStoredUsername);
  const [showConnect, setShowConnect] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [filter, setFilter] = useState<"All" | Status>("All");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const repositories = useAsync(
    username ? (signal) => githubApi.repositories(username, signal) : null,
    [username, reloadKey],
  );
  const events = useAsync(
    username ? (signal) => githubApi.activity(username, signal) : null,
    [username, reloadKey],
  );

  // Gemini ideas. "Get New Ideas" asks the backend for a fresh set (refresh = true).
  const [ideaRequest, setIdeaRequest] = useState({ key: 0, refresh: false });
  const recommendations = useAsync(
    username
      ? (signal) => githubApi.recommendations(username, ideaRequest.refresh, signal)
      : null,
    [username, ideaRequest.key],
  );

  // `all` = every repository of the account, `pinned` = the (max 6) shown as cards below.
  // The GitHub dashboard's "Linked Projects" card decides what is pinned.
  const { all, pinned, unlink } = usePinnedProjects(username, repositories.data);
  const [menuId, setMenuId] = useState<number | null>(null);

  // The four stat cards describe ALL repositories, not just the cards on screen.
  const completed = all.filter((p) => p.status === "Completed").length;
  const progress = all.filter((p) => p.status === "In Progress").length;
  const techCounts = useMemo(() => technologyCounts(all), [all]);
  const stack = techCounts.slice(0, 8);

  // GitHub's public events feed is often empty (it only covers recent PUBLIC activity),
  // so fall back to what the repositories themselves show: created / last pushed.
  const activity = useMemo(() => {
    const fromEvents = buildActivity(events.data ?? []);
    return fromEvents.length > 0 ? fromEvents : buildActivityFromRepositories(all);
  }, [events.data, all]);

  const filtered = useMemo(
    () =>
      pinned.filter(
        (p) =>
          (filter === "All" || p.status === filter) &&
          `${p.name} ${p.description} ${p.technologies.join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase().trim()),
      ),
    [pinned, filter, search],
  );

  // Close the card menu on any outside click or Escape.
  useEffect(() => {
    if (menuId === null) return;
    const close = () => setMenuId(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuId]);

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  function handleConnected(name: string) {
    writeStoredUsername(name);
    setUsername(name);
    setShowConnect(false);
    setFilter("All");
    setSearch("");
  }

  async function copyLink(project: Project) {
    try {
      await navigator.clipboard.writeText(project.url);
      notify(`Link to "${project.name}" copied.`);
    } catch {
      notify("Could not copy the link. Open the project to copy it from the address bar.");
    }
  }

  function removeProject(project: Project) {
    unlink(project.id);
    notify(`"${project.name}" removed from My Projects. Link it again from the GitHub dashboard.`);
  }

  const topTech = techCounts.slice(0, 3).map(([name]) => name);

  // AI ideas when available, the static ideas when Gemini cannot be reached.
  const usingFallbackIdeas = !recommendations.loading && recommendations.error !== null;
  const ideas: ProjectIdea[] = recommendations.data?.ideas ?? (usingFallbackIdeas ? FALLBACK_IDEAS : []);

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-800">
      <main className="mx-auto max-w-[1600px] px-4 py-5 md:px-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[16px] font-medium text-blue-300">
              Developer Hub
            </p>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
              My Projects
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Build, track and showcase your projects. Turn your ideas into
              real-world solutions.
            </p>
            {username && (
              <p className="mt-1 text-[13px] text-slate-400">
                Synced from github.com/{username} ·{" "}
                <button
                  onClick={() => setShowConnect((open) => !open)}
                  className="font-medium text-blue-400 hover:text-blue-500"
                >
                  Change account
                </button>
              </p>
            )}
          </div>
          <a
            href={GITHUB_NEW_REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400 bg-blue-400 px-3.5 py-2 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} strokeWidth={2.25} />
            Add New Project
          </a>
        </div>
        {notice && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[16px] font-medium text-emerald-700"
          >
            <Check size={18} />
            {notice}
          </div>
        )}

        {(!username || showConnect) && (
          <div className="mb-4">
            <ConnectGitHubPanel
              currentUsername={username}
              onConnected={handleConnected}
              onCancel={() => setShowConnect(false)}
            />
          </div>
        )}

        {username && (
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Panel className="p-5">
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-500">
                    <Folder size={20} />
                  </div>
                  <p className="text-[14px] text-slate-500">Total Projects</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {all.length}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[14px] font-medium text-emerald-600">
                    <TrendingUp size={18} /> +{createdThisMonth(all)} this month
                  </p>
                </Panel>
                <Panel className="p-5">
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-500">
                    <Code2 size={22} />
                  </div>
                  <p className="text-[14px] text-slate-500">Completed</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {completed}
                  </p>
                  <p className="mt-2 text-[14px] text-slate-500">
                    {Math.round((completed / Math.max(all.length, 1)) * 100)}
                    % completion rate
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-blue-400"
                      style={{
                        width: `${(completed / Math.max(all.length, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </Panel>
                <Panel className="p-5">
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-400">
                    <Clock3 size={22} />
                  </div>
                  <p className="text-[14px] text-slate-500">In Progress</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {progress}
                  </p>
                  <p className="mt-2 text-[14px] text-slate-500">
                    {Math.round((progress / Math.max(all.length, 1)) * 100)}%
                    in progress
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-blue-400"
                      style={{
                        width: `${(progress / Math.max(all.length, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </Panel>
                <Panel className="p-5">
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-500">
                    <Star size={22} />
                  </div>
                  <p className="text-[14px] text-slate-500">Technologies Used</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {techCounts.length}
                  </p>
                  <p className="mt-2 text-[14px] text-slate-500">
                    {topTech.length === 0
                      ? "Add topics to your repositories"
                      : `${topTech.join(", ")}${techCounts.length > topTech.length ? " + more" : ""}`}
                  </p>
                </Panel>
              </div>

              <Panel className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[22px] font-semibold text-slate-900">
                      Your Projects
                    </h2>
                    <p className="mt-1 text-[14px] text-slate-500">
                      Showing {pinned.length} of {all.length} repositories
                      {all.length > MAX_PINNED
                        ? ` (up to ${MAX_PINNED}). Link more from the GitHub dashboard.`
                        : "."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      ["All", "Completed", "In Progress", "Archived"] as const
                    ).map((item) => (
                      <button
                        key={item}
                        onClick={() => setFilter(item)}
                        className={`rounded-lg px-4 py-2 text-[13px] font-medium transition ${filter === item ? "bg-blue-400 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-blue-50"}`}
                      >
                        {item}
                      </button>
                    ))}
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2">
                      <Search size={15} className="text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects"
                        className="w-28 bg-transparent text-[14px] outline-none placeholder:text-slate-400 sm:w-36"
                      />
                    </label>
                  </div>
                </div>

                {repositories.loading ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                ) : repositories.error ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                    <p className="text-[16px] font-medium text-slate-700">
                      Could not load your projects
                    </p>
                    <p className="mt-1 text-[13px] text-slate-400">
                      {repositories.error.message}
                    </p>
                    <button
                      onClick={() => setReloadKey((key) => key + 1)}
                      className="mt-3 rounded-lg border border-blue-200 px-3 py-2 text-[13px] font-medium text-blue-400 hover:bg-blue-50"
                    >
                      Try again
                    </button>
                  </div>
                ) : filtered.length ? (
                  <div className="grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {filtered.map((project) => (
                      <article
                        key={project.id}
                        className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/60"
                      >
                        <div className="relative m-3 mb-0.5 h-45 shrink-0 overflow-hidden rounded-lg">
                          <Artwork type={artworkFor(project.id)} />
                          <button
                            aria-label={`Options for ${project.name}`}
                            aria-haspopup="menu"
                            aria-expanded={menuId === project.id}
                            onClick={() => setMenuId(menuId === project.id ? null : project.id)}
                            className="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1.5 text-slate-500 shadow-sm hover:text-blue-400"
                          >
                            <MoreVertical size={13} />
                          </button>
                          {menuId === project.id && (
                            <div
                              role="menu"
                              className="absolute right-1.5 top-9 z-20 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-[13px] shadow-lg"
                            >
                              <button
                                role="menuitem"
                                onClick={() => copyLink(project)}
                                className="block w-full px-3 py-2 text-left text-slate-600 hover:bg-blue-50"
                              >
                                Copy link
                              </button>
                              <button
                                role="menuitem"
                                onClick={() => removeProject(project)}
                                className="block w-full px-3 py-2 text-left text-rose-500 hover:bg-rose-50"
                              >
                                Remove from My Projects
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="min-w-0 flex-1 truncate text-[15px] font-medium leading-5 text-slate-900">
                              {project.name}
                            </h3>
                            <StatusBadge status={project.status} />
                          </div>
                          <p className="mt-2 line-clamp-2 min-h-10 text-[14px] leading-5 text-slate-500">
                            {project.description || (
                              <span className="italic text-slate-300">
                                No description on GitHub
                              </span>
                            )}
                          </p>
                          <div className="mt-3 flex h-7 flex-wrap gap-1.5 overflow-hidden">
                            {project.technologies.slice(0, 4).map((tech) => (
                              <span
                                key={tech}
                                className="rounded-full bg-blue-50 px-3 py-1 text-[12px] font-medium text-blue-500"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                            <div className="flex items-center gap-3 text-[14px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Star size={14} className="text-amber-500" />
                                {formatCount(project.stars)}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitFork size={14} />
                                {formatCount(project.forks)} forks
                              </span>
                            </div>
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[14px] font-semibold text-blue-400 hover:text-blue-500"
                            >
                              View Project <ArrowRight size={12} />
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                    <Folder size={25} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-[16px] font-medium text-slate-700">
                      {pinned.length === 0 ? "No projects here yet" : "No projects found"}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-400">
                      {pinned.length === 0
                        ? all.length === 0
                          ? "Create a repository on GitHub and it will appear here."
                          : "Link repositories from the GitHub dashboard to show them here."
                        : "Try a different search or filter."}
                    </p>
                  </div>
                )}
              </Panel>

              <Panel className="bg-gradient-to-br from-blue-50/80 to-blue-50/70 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-400 shadow-sm">
                      <Lightbulb size={23} />
                    </span>
                    <div>
                      <h2 className="text-[18px] font-semibold text-slate-900">
                        Project Recommendations
                      </h2>
                      <p className="mt-0.5 text-[14px] text-slate-500">
                        {usingFallbackIdeas
                          ? "General ideas (personalised ideas are unavailable right now)"
                          : "Tougher ideas picked for your skills and interests"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setIdeaRequest((current) => ({ key: current.key + 1, refresh: true }))
                    }
                    disabled={recommendations.loading}
                    className="rounded-lg border border-blue-200 bg-white/70 px-3 py-2 text-[13px] font-medium text-blue-400 hover:bg-white disabled:opacity-60"
                  >
                    {recommendations.loading ? "Thinking..." : "Get New Ideas"}{" "}
                    <ArrowRight size={13} className="ml-1 inline" />
                  </button>
                </div>
                {usingFallbackIdeas && recommendations.error && (
                  <p className="mb-3 text-[13px] text-slate-400">
                    {recommendations.error.message}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {recommendations.loading
                    ? [0, 1, 2].map((slot) => (
                        <div
                          key={slot}
                          className="h-44 animate-pulse rounded-xl bg-white/70"
                          aria-busy="true"
                        />
                      ))
                    : ideas.map((idea, index) => (
                        <article
                          key={idea.title}
                          className="rounded-xl border border-white bg-white/90 p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-500">
                              {IDEA_ICONS[index % IDEA_ICONS.length]}
                            </span>
                            <div>
                              <h3 className="text-[14px] font-medium text-slate-800 mb-0">
                                {idea.title}
                              </h3>
                              <span className="text-[13px] text-blue-400">
                                {idea.tag}
                              </span>
                            </div>
                          </div>
                          <p className="mt-3 text-[14px] leading-relaxed text-slate-500">
                            {idea.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {idea.tech.map((tech) => (
                              <span
                                key={tech}
                                className="rounded-full bg-blue-50 px-3 py-1 text-[13px] text-blue-500"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))}
                </div>
              </Panel>
            </div>

            <aside className="space-y-4">
              <Panel className="p-5">
                <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                  <Zap size={18} className="text-blue-400" /> Quick Actions
                </h2>
                {[
                  {
                    label: "Create New Project",
                    icon: <Plus size={16} />,
                    run: () => window.open(GITHUB_NEW_REPOSITORY_URL, "_blank", "noopener,noreferrer"),
                  },
                  {
                    label: "Import from GitHub",
                    icon: <Code2 size={16} />,
                    run: () => setShowConnect(true),
                  },
                  {
                    label: "Browse Templates",
                    icon: <BookOpen size={16} />,
                    run: () => notify("Project templates will be added here."),
                  },
                  {
                    label: "View All Repositories",
                    icon: <ExternalLink size={16} />,
                    run: () =>
                      window.open(
                        `https://github.com/${username}?tab=repositories`,
                        "_blank",
                        "noopener,noreferrer",
                      ),
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.run}
                    className="flex w-full items-center gap-2 border-b border-slate-100 py-3 text-left text-[14px] text-slate-600 last:border-0 hover:text-blue-500"
                  >
                    <span className="text-blue-500">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    <ArrowRight size={15} className="text-slate-400" />
                  </button>
                ))}
              </Panel>
              <Panel className="p-5">
                <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                  <Layers3 size={18} className="text-blue-500" /> Technology Stack
                </h2>
                {repositories.loading ? (
                  <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
                ) : stack.length === 0 ? (
                  <p className="text-[13px] text-slate-400">
                    Your languages and repository topics will appear here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stack.map(([name, count]) => {
                      const [mark, color] = STACK_MARKS[name] ?? DEFAULT_MARK;
                      return (
                        <div
                          key={name}
                          className="flex items-center gap-2.5 text-[14px]"
                        >
                          <span
                            className={`grid w-4 place-items-center font-bold ${color}`}
                          >
                            {mark}
                          </span>
                          <span className="flex-1 text-slate-600">{name}</span>
                          <span className="text-slate-500">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
              <Panel className="p-5">
                <h2 className="mb-4 flex items-center gap-2 text-[18px] font-semibold text-slate-900">
                  <Clock3 size={18} className="text-blue-400" /> Recent Activity
                </h2>
                {events.loading || repositories.loading ? (
                  <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
                ) : activity.length === 0 ? (
                  <p className="text-[13px] text-slate-400">
                    No activity yet. Create or push to a repository on GitHub.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activity.map(({ id, title, when, color }) => (
                      <div key={id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-slate-50 ${color}`}
                          />
                          <span className="mt-1 w-px flex-1 bg-slate-100" />
                        </div>
                        <div className="pb-1">
                          <p className="text-[14px] font-medium leading-relaxed text-slate-700">
                            {title}
                          </p>
                          <p className="mt-1 text-[13px] text-slate-400">{when}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
              <Panel className="border-blue-100 bg-gradient-to-br from-white to-blue-50/80 p-4">
                <div className="mb-2 flex items-center gap-2 text-blue-400">
                  <CircleHelp size={17} />
                  <h3 className="text-[15px] font-semibold">Pro Tip</h3>
                </div>
                <p className="text-[14px] leading-relaxed text-slate-600">
                  Keep your README updated, add screenshots, and document what you
                  learned. A polished project is easier to showcase.
                </p>
                <button
                  onClick={() =>
                    notify(
                      "README checklist: overview, setup instructions, features, screenshots, and tech stack.",
                    )
                  }
                  className="mt-3 flex items-center gap-1 text-[14px] font-semibold text-blue-400 hover:text-blue-500"
                >
                  View README checklist <ArrowUpRight size={14} />
                </button>
              </Panel>
            </aside>
          </div>
        )}
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-4 text-[14px] text-slate-400">
          <span>Student 360° · My Projects</span>
          <span>
            {username && repositories.data
              ? `${all.length} ${all.length === 1 ? "repository" : "repositories"} synced from GitHub`
              : "Project Data · Commit Changes"}
          </span>
        </footer>
      </main>
    </div>
  );
}