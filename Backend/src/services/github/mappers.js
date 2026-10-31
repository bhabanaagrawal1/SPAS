// Pure functions: GitHub response -> the smaller objects our dashboard uses.
// No I/O, so they are trivial to unit test.

export const mapProfile = (user) => ({
  username: user.login,
  name: user.name,
  avatar: user.avatar_url,
  bio: user.bio,
  location: user.location,
  company: user.company,
  followers: user.followers,
  following: user.following,
  publicRepos: user.public_repos,
  publicGists: user.public_gists,
  profileUrl: user.html_url,
  createdAt: user.created_at,
});

export const mapRepository = (repo) => ({
  id: repo.id,
  name: repo.name,
  fullName: repo.full_name,
  description: repo.description,
  url: repo.html_url,
  language: repo.language,
  stars: repo.stargazers_count,
  forks: repo.forks_count,
  openIssues: repo.open_issues_count,
  visibility: repo.visibility,
  isFork: repo.fork,
  updatedAt: repo.updated_at,
  createdAt: repo.created_at,
});

export const mapActivity = (event) => ({
  id: event.id,
  type: event.type,
  repo: event.repo?.name,
  createdAt: event.created_at,
  action: event.payload?.action || null,
  commits: event.payload?.commits?.length || 0,
});

export const mapCommit = (item) => ({
  sha: item.sha,
  message: item.commit.message,
  author: item.commit.author?.name,
  date: item.commit.author?.date,
  url: item.html_url,
});

export const mapIssue = (issue) => ({
  id: issue.id,
  number: issue.number,
  title: issue.title,
  state: issue.state,
  url: issue.html_url,
  createdAt: issue.created_at,
});

export const mapPullRequest = (pr) => ({
  id: pr.id,
  number: pr.number,
  title: pr.title,
  state: pr.state,
  merged: Boolean(pr.merged_at), // merged_at is only set for merged pull requests
  url: pr.html_url,
  createdAt: pr.created_at,
});

/**
 * Input:  [{ JavaScript: 5000, CSS: 500 }, { JavaScript: 3000 }]   (bytes per repository)
 * Output: [{ language: "JavaScript", bytes: 8000, percentage: 94.12 }, ...] sorted by bytes
 */
export const calculateLanguageDistribution = (perRepoLanguages) => {
  // Map (not a plain object) so a language called e.g. "constructor" cannot clash with built-ins.
  const totals = new Map();

  for (const languages of perRepoLanguages) {
    for (const [language, bytes] of Object.entries(languages)) {
      totals.set(language, (totals.get(language) ?? 0) + bytes);
    }
  }

  const totalBytes = [...totals.values()].reduce((sum, bytes) => sum + bytes, 0);

  return [...totals]
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: totalBytes ? Number(((bytes / totalBytes) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);
};

/* ------------------------- contributions (GraphQL) ------------------------- */

const CONTRIBUTION_LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

/** GitHub's weeks -> one flat list of { date, count, level } (level 0-4 = heatmap shade). */
export const mapContributionCalendar = (calendar) => ({
  total: calendar.totalContributions,
  days: calendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: CONTRIBUTION_LEVELS[day.contributionLevel] ?? 0,
    }))
  ),
});

/**
 * days: [{ date: "YYYY-MM-DD", count }] sorted oldest -> newest.
 * - longest: longest run of consecutive days with at least one contribution.
 * - current: run ending on the last day that has passed. Today still counts as "in
 *   progress": zero contributions so far today does not break the streak.
 */
export const calculateStreaks = (days, today = new Date().toISOString().slice(0, 10)) => {
  const past = days.filter((day) => day.date <= today);

  let longest = 0;
  let run = 0;
  for (const day of past) {
    run = day.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  let index = past.length - 1;
  if (index >= 0 && past[index].count === 0 && past[index].date === today) index--;

  let current = 0;
  while (index >= 0 && past[index].count > 0) {
    current++;
    index--;
  }

  return { current, longest };
};

/** Range for one calendar year; the current year ends "now" (GitHub has no future data). */
export const buildYearRange = (year, now = new Date()) => ({
  from: `${year}-01-01T00:00:00Z`,
  to: year === now.getUTCFullYear() ? now.toISOString() : `${year}-12-31T23:59:59Z`,
});

/** The last `months` calendar months, oldest first, e.g. { key: "2026-05", from, to }. */
export const buildMonthRanges = (months, now = new Date()) => {
  const ranges = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end =
      i === 0
        ? now
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1) - 1000);

    ranges.push({ key: start.toISOString().slice(0, 7), from: start.toISOString(), to: end.toISOString() });
  }

  return ranges;
};

/** `user` holds one aliased field per month: m0, m1, ... (see getGitHubMonthlyActivity). */
export const mapMonthlyActivity = (user, ranges) =>
  ranges.map((range, index) => {
    const month = user[`m${index}`];
    return {
      month: range.key,
      commits: month.totalCommitContributions,
      pullRequests: month.totalPullRequestContributions,
      issues: month.totalIssueContributions,
    };
  });