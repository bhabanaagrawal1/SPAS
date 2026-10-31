// Pure helpers: no React, no network. Easy to unit test.

// Same rules as the backend (a username is 1-39 chars, letters/digits/single hyphens).
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/**
 * Accepts what students actually paste:
 *   "octocat", "@octocat", "github.com/octocat", "https://github.com/octocat/", "https://github.com/octocat?tab=repositories"
 * Returns the username, or null when it is not valid.
 */
export const parseGitHubUsername = (input: string): string | null => {
  let value = input.trim();
  if (!value) return null;

  value = value
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?github\.com\//i, "")
    .replace(/^@/, "");

  value = value.split(/[/?#]/)[0];
  return USERNAME_RE.test(value) ? value : null;
};

const UNITS: [number, string][] = [
  [60 * 60 * 24 * 365, "year"],
  [60 * 60 * 24 * 30, "month"],
  [60 * 60 * 24 * 7, "week"],
  [60 * 60 * 24, "day"],
  [60 * 60, "hour"],
  [60, "minute"],
];

/** "2 days ago", "3 weeks ago", ... */
export const timeAgo = (iso?: string | null, now: number = Date.now()): string => {
  if (!iso) return "unknown";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "unknown";

  const seconds = Math.max(0, Math.round((now - time) / 1000));
  for (const [size, name] of UNITS) {
    const count = Math.floor(seconds / size);
    if (count >= 1) return `${count} ${name}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
};

// GitHub's API does not return language colors, so the common ones live here.
// The first five match the colors your design already used.
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#F3C644",
  TypeScript: "#3178C6",
  Python: "#3776AB",
  "C++": "#8B5CF6",
  HTML: "#E34C26",
  CSS: "#563D7C",
  SCSS: "#C6538C",
  Java: "#B07219",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#DEA584",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Shell: "#89E051",
  Vue: "#41B883",
  "Jupyter Notebook": "#DA5B0B",
};
export const OTHER_COLOR = "#94A3B8";

export const languageColor = (language?: string | null): string =>
  (language && LANGUAGE_COLORS[language]) || OTHER_COLOR;

/** "Aarav Sharma" -> "AS", "octocat" -> "OC" */
export const initials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
};

/** "2026-05" -> "May" */
export const monthLabel = (month: string): string =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString("en", { month: "short", timeZone: "UTC" });

export type YearCell = { date: string; count: number; level: number };

/**
 * Lays out a full calendar year for the heatmap grid (columns = weeks, rows = Sun..Sat).
 * Days GitHub did not return (e.g. the future) become empty level-0 cells, and the first
 * column is padded with `null` so January 1st lands on the correct weekday row.
 */
export const buildYearCells = (
  year: number,
  days: { date: string; count: number; level: number }[],
): (YearCell | null)[] => {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year, 11, 31);

  const cells: (YearCell | null)[] = Array.from(
    { length: new Date(start).getUTCDay() },
    () => null,
  );

  for (let time = start; time <= end; time += 86_400_000) {
    const date = new Date(time).toISOString().slice(0, 10);
    const day = byDate.get(date);
    cells.push({ date, count: day?.count ?? 0, level: day?.level ?? 0 });
  }

  return cells;
};