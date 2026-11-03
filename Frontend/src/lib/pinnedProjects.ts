import type { Project } from "./projectsFormat";

/*
 * Which repositories appear in "My Projects".
 *
 * My Projects shows at most 6 cards (like GitHub's own pinned repositories). Until the
 * student links or removes something, the 6 most recently pushed real projects are shown
 * automatically ("automatic" = nothing stored). After the first change the chosen ids are
 * saved in this browser, separately for each GitHub username.
 *
 * The GitHub dashboard ("Linked Projects") and My Projects both use this, so linking a
 * repository on one page adds its card to the other.
 */

export const MAX_PINNED = 6;

const storageKey = (username: string) => `student360.pinnedProjects.${username.toLowerCase()}`;

/** Automatic selection: real projects first (newest push first), then forks/README repos to fill up. */
export const defaultPinned = (projects: Project[]): Project[] => {
  const featured = projects.filter((project) => project.featured);
  const others = projects.filter((project) => !project.featured);
  return [...featured, ...others].slice(0, MAX_PINNED);
};

/**
 * `stored` is the saved id list, or null for automatic. `projects` must already be sorted
 * newest first. Ids that no longer exist (repository deleted) are ignored.
 */
export const resolvePinned = (stored: number[] | null, projects: Project[]): Project[] => {
  if (stored === null) return defaultPinned(projects);

  const byId = new Map(projects.map((project) => [project.id, project]));
  const resolved = stored.flatMap((id) => {
    const project = byId.get(id);
    return project ? [project] : [];
  });

  // Every saved repository vanished: fall back to automatic instead of showing an empty page.
  // (A deliberately empty list, stored = [], is respected.)
  if (resolved.length === 0 && stored.length > 0) return defaultPinned(projects);
  return resolved.slice(0, MAX_PINNED);
};

/**
 * Adds `id` at the front. When that would exceed the limit, the last one is replaced and
 * reported, so linking always works (the replaced project simply becomes "available" again).
 */
export const linkProject = (
  currentIds: number[],
  id: number,
  max: number = MAX_PINNED,
): { next: number[]; replacedId: number | null } => {
  if (currentIds.includes(id)) return { next: currentIds, replacedId: null };

  const next = [id, ...currentIds];
  const replacedId = next.length > max ? (next.pop() as number) : null;
  return { next, replacedId };
};

export const unlinkProject = (currentIds: number[], id: number): number[] =>
  currentIds.filter((current) => current !== id);

export const readPinned = (username: string): number[] | null => {
  try {
    const raw = localStorage.getItem(storageKey(username));
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((value) => Number.isSafeInteger(value))) return null;
    return parsed as number[];
  } catch {
    return null;
  }
};

export const writePinned = (username: string, ids: number[]): void => {
  try {
    localStorage.setItem(storageKey(username), JSON.stringify(ids));
  } catch {
    // Storage can be blocked (private mode); the choice then only lasts for this visit.
  }
};