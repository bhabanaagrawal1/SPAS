import { useMemo, useState } from "react";
import type { GitHubRepository } from "../lib/githubApi";
import {
  linkProject,
  readPinned,
  resolvePinned,
  unlinkProject,
  writePinned,
} from "../lib/pinnedProjects";
import { sortByRecentPush, toProject } from "../lib/projectsFormat";
import type { Project } from "../lib/projectsFormat";

/**
 * All repositories as projects (`all`), the ones shown in My Projects (`pinned`, at most 6),
 * and the rest (`available`, what the GitHub dashboard offers under "Linked Projects").
 */
export function usePinnedProjects(username: string | null, repositories: GitHubRepository[] | null) {
  const [stored, setStored] = useState<number[] | null>(() => (username ? readPinned(username) : null));
  const [storedFor, setStoredFor] = useState(username);
  const [now] = useState(() => Date.now());

  // Account changed: load that account's saved choice (render-time update, no effect needed).
  if (storedFor !== username) {
    setStoredFor(username);
    setStored(username ? readPinned(username) : null);
  }

  const all = useMemo<Project[]>(
    () =>
      username && repositories
        ? sortByRecentPush(repositories.map((repo) => toProject(repo, now, username)))
        : [],
    [username, repositories, now],
  );

  const pinned = useMemo(() => resolvePinned(stored, all), [stored, all]);
  const pinnedIds = useMemo(() => pinned.map((project) => project.id), [pinned]);
  const available = useMemo(
    () => all.filter((project) => !pinnedIds.includes(project.id)),
    [all, pinnedIds],
  );

  const commit = (ids: number[]) => {
    if (username) writePinned(username, ids);
    setStored(ids);
  };

  /** Adds the repository to My Projects. Returns the project that had to make room, if any. */
  const link = (id: number): Project | null => {
    const { next, replacedId } = linkProject(pinnedIds, id);
    commit(next);
    return replacedId === null ? null : (all.find((project) => project.id === replacedId) ?? null);
  };

  const unlink = (id: number) => commit(unlinkProject(pinnedIds, id));

  /** For rows that only know the repository name: link if not linked, otherwise unlink. */
  const toggleByName = (name: string): Project | null => {
    const project = all.find((candidate) => candidate.name === name);
    if (!project) return null;
    if (pinnedIds.includes(project.id)) {
      unlink(project.id);
      return null;
    }
    return link(project.id);
  };

  return { all, pinned, available, link, unlink, toggleByName };
}