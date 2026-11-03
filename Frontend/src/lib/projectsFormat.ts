import type { GitHubActivityEvent, GitHubRepository } from "./githubApi";
import { timeAgo } from "./githubFormat";

// Pure helpers that turn GitHub repositories into the "projects" shown on My Projects.

export type Status = "Completed" | "In Progress" | "Archived";

export type Project = {
  id: number;
  name: string;
  description: string;
  status: Status;
  technologies: string[];
  stars: number;
  forks: number;
  url: string;
  createdAt: string;
  pushedAt: string;
  isFork: boolean;
  // Real projects: not a fork and not the "username/username" profile README repository.
  featured: boolean;
};

// A repository counts as "In Progress" if code was pushed within this many days.
export const ACTIVE_DAYS = 90;
const DAY_MS = 86_400_000;

/**
 * GitHub has no "completed" flag, so the status is derived:
 *   archived on GitHub            -> Archived
 *   code pushed in the last 90 d  -> In Progress
 *   otherwise                     -> Completed
 */
export const deriveStatus = (
  repo: Pick<GitHubRepository, "archived" | "pushedAt" | "updatedAt">,
  now: number = Date.now(),
): Status => {
  if (repo.archived) return "Archived";

  const lastPush = new Date(repo.pushedAt ?? repo.updatedAt).getTime();
  if (Number.isNaN(lastPush)) return "Completed";

  return now - lastPush <= ACTIVE_DAYS * DAY_MS ? "In Progress" : "Completed";
};

// Friendly names for GitHub topics ("nodejs" -> "Node.js"). Unknown topics are just capitalised.
const KNOWN_TECH: Record<string, string> = {
  react: "React",
  reactjs: "React",
  "react-native": "React Native",
  nodejs: "Node.js",
  "node-js": "Node.js",
  node: "Node.js",
  express: "Express",
  expressjs: "Express",
  nextjs: "Next.js",
  "next-js": "Next.js",
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  mongodb: "MongoDB",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  tailwindcss: "Tailwind CSS",
  tailwind: "Tailwind CSS",
  firebase: "Firebase",
  redux: "Redux",
  docker: "Docker",
  prisma: "Prisma",
  vite: "Vite",
  css: "CSS",
  html: "HTML",
  api: "API",
  rest: "REST",
  graphql: "GraphQL",
  openai: "OpenAI",
};

export const prettyTechnology = (name: string): string => {
  const known = KNOWN_TECH[name.trim().toLowerCase()];
  if (known) return known;

  // Keep names that already look right ("JavaScript", "C++"); prettify lowercase topics ("web-app").
  if (/[A-Z+#]/.test(name)) return name;
  return name
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
};

/** Main language first, then the repository's topics, without duplicates. */
export const technologiesOf = (repo: Pick<GitHubRepository, "language" | "topics">): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of [repo.language, ...repo.topics]) {
    if (!raw) continue;
    const name = prettyTechnology(raw);
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
};

// Forks belong to someone else, and "username/username" is the profile README, not a project.
export const isProjectRepository = (
  repo: Pick<GitHubRepository, "isFork" | "name">,
  username: string,
): boolean => !repo.isFork && repo.name.toLowerCase() !== username.toLowerCase();

export const toProject = (
  repo: GitHubRepository,
  now: number = Date.now(),
  username = "",
): Project => ({
  id: repo.id,
  name: repo.name,
  description: repo.description ?? "",
  status: deriveStatus(repo, now),
  technologies: technologiesOf(repo),
  stars: repo.stars,
  forks: repo.forks,
  url: repo.url,
  createdAt: repo.createdAt,
  pushedAt: repo.pushedAt ?? repo.updatedAt,
  isFork: repo.isFork,
  featured: isProjectRepository(repo, username),
});

const time = (iso: string): number => new Date(iso).getTime() || 0;

/** Most recently pushed first. */
export const sortByRecentPush = (projects: Project[]): Project[] =>
  [...projects].sort((a, b) => time(b.pushedAt) - time(a.pushedAt));

/** 1250 -> "1.3k", 3200 -> "3.2k", 12 -> "12" */
export const formatCount = (count: number): string =>
  count < 1000 ? String(count) : `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;

export const ARTWORKS = ["dashboard", "github", "mobile", "mountain", "commerce", "blog"] as const;
export type ArtworkType = (typeof ARTWORKS)[number];

// GitHub repositories have no cover image, so each project gets one of the six artworks,
// chosen from its id: the same project always gets the same picture.
export const artworkFor = (id: number): ArtworkType => ARTWORKS[Math.abs(id) % ARTWORKS.length];

export const createdThisMonth = (projects: Pick<Project, "createdAt">[], now: Date = new Date()): number =>
  projects.filter((project) => {
    const created = new Date(project.createdAt);
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;

/** [["React", 5], ["Python", 3], ...] most used first (ties alphabetical). */
export const technologyCounts = (projects: Pick<Project, "technologies">[]): [string, number][] => {
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const technology of project.technologies) {
      counts.set(technology, (counts.get(technology) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

/* ------------------------- recent activity (events) ------------------------ */

export type ActivityItem = { id: string; title: string; when: string; color: string };

const repoName = (fullName?: string): string => fullName?.split("/")[1] ?? fullName ?? "a repository";
const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const describeEvent = (event: GitHubActivityEvent): { title: string; color: string } => {
  const repo = repoName(event.repo);

  switch (event.type) {
    case "PushEvent":
      return { title: `Pushed changes to ${repo}`, color: "bg-blue-500" };
    case "CreateEvent":
      if (event.refType === "repository") return { title: `Created repository ${repo}`, color: "bg-rose-500" };
      if (event.refType === "branch") return { title: `Created a branch in ${repo}`, color: "bg-blue-500" };
      return { title: `Created a ${event.refType ?? "new item"} in ${repo}`, color: "bg-blue-500" };
    case "PullRequestEvent":
      return { title: `${capitalize(event.action ?? "updated")} a pull request in ${repo}`, color: "bg-emerald-500" };
    case "IssuesEvent":
      return { title: `${capitalize(event.action ?? "updated")} an issue in ${repo}`, color: "bg-emerald-500" };
    case "WatchEvent":
      return { title: `Starred ${repo}`, color: "bg-slate-500" };
    case "ForkEvent":
      return { title: `Forked ${repo}`, color: "bg-slate-500" };
    default:
      return { title: `Activity in ${repo}`, color: "bg-slate-500" };
  }
};

/**
 * Newest first. Repeated identical entries in a row (e.g. 5 pushes to one repository)
 * collapse into one, so the list shows variety instead of the same line five times.
 */
export const buildActivity = (
  events: GitHubActivityEvent[],
  now: number = Date.now(),
  limit = 5,
): ActivityItem[] => {
  const items: ActivityItem[] = [];

  for (const event of events) {
    const { title, color } = describeEvent(event);
    if (items.length > 0 && items[items.length - 1].title === title) continue;

    items.push({ id: event.id, title, color, when: timeAgo(event.createdAt, now) });
    if (items.length === limit) break;
  }
  return items;
};

/**
 * GitHub's public events feed only covers recent PUBLIC activity (about 90 days) and is
 * often empty or delayed. This builds a reliable fallback from the repositories themselves:
 * when each one was created and when code was last pushed.
 */
export const buildActivityFromRepositories = (
  projects: Pick<Project, "id" | "name" | "createdAt" | "pushedAt">[],
  now: number = Date.now(),
  limit = 5,
): ActivityItem[] => {
  const entries: { id: string; title: string; color: string; at: string }[] = [];

  for (const project of projects) {
    const neverPushedAfterCreation = Math.abs(time(project.pushedAt) - time(project.createdAt)) < 60_000;
    if (!neverPushedAfterCreation) {
      entries.push({ id: `push-${project.id}`, title: `Pushed changes to ${project.name}`, color: "bg-blue-500", at: project.pushedAt });
    }
    entries.push({ id: `create-${project.id}`, title: `Created repository ${project.name}`, color: "bg-rose-500", at: project.createdAt });
  }

  return entries
    .sort((a, b) => time(b.at) - time(a.at))
    .slice(0, limit)
    .map(({ id, title, color, at }) => ({ id, title, color, when: timeAgo(at, now) }));
};