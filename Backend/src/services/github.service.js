/*
 * GitHub service: the only file the rest of the backend needs to import.
 *
 * Internals live in ./github/
 *   settings.js      configuration and TTLs
 *   errors.js        GitHubError + error translation
 *   validation.js    username / repository checks
 *   cache.js         cache adapters, key building, duplicate-request sharing
 *   requestQueue.js  global concurrency + rate-limit cooldown
 *   concurrency.js   mapWithConcurrency
 *   client.js        axios instance, getGitHubData, pagination
 *   mappers.js       response -> dashboard objects (pure functions)
 */
import { TTL_SECONDS, settings } from "./github/settings.js";
import { ErrorCode, GitHubError } from "./github/errors.js";
import { validateUsername, validateRepository, validateYear } from "./github/validation.js";
import { buildCacheKey, cachedRequest } from "./github/cache.js";
import { mapWithConcurrency } from "./github/concurrency.js";
import { getAllPages, getGitHubData, getGitHubGraphQL } from "./github/client.js";
import {
  buildMonthRanges,
  buildYearRange,
  calculateLanguageDistribution,
  calculateStreaks,
  mapContributionCalendar,
  mapMonthlyActivity,
  mapActivity,
  mapCommit,
  mapIssue,
  mapProfile,
  mapPullRequest,
  mapRepository,
} from "./github/mappers.js";

/* ----------------------------- helpers ------------------------------------ */

const cached = (type, keyParts, loader) =>
  cachedRequest(buildCacheKey(type, ...keyParts), TTL_SECONDS[type], loader);

const validateRepoTarget = (username, repository) => {
  validateUsername(username);
  validateRepository(repository);
};

const repoPath = (username, repository) => `/repos/${username}/${repository}`;

// A repository that vanished or is empty should not ruin the whole language calculation.
// Anything else (rate limit, bad token, GitHub down) must be reported.
const IGNORABLE_LANGUAGE_ERRORS = new Set([ErrorCode.NOT_FOUND, ErrorCode.EMPTY_REPOSITORY]);

/* ----------------------------- public API --------------------------------- */

export const getGitHubProfile = async (username) => {
  validateUsername(username);

  return cached("profile", [username], async () =>
    mapProfile(await getGitHubData(`/users/${username}`))
  );
};

// type "owner" = repositories owned by this user (not every organization repo they contribute to).
export const getGitHubRepositories = async (username) => {
  validateUsername(username);

  return cached("repos", [username], async () => {
    const repositories = await getAllPages(`/users/${username}/repos`, {
      sort: "updated",
      direction: "desc",
      type: "owner",
    });
    return repositories.map(mapRepository);
  });
};

// Forks are skipped so the result reflects code the student wrote themselves.
// This is a design choice: substantial work inside a fork is not counted.
export const getGitHubLanguages = async (username) => {
  validateUsername(username);

  return cached("languages", [username], async () => {
    // Reuses the (cached) repository list instead of downloading it a second time.
    const repositories = (await getGitHubRepositories(username)).filter((repo) => !repo.isFork);

    const perRepo = await mapWithConcurrency(
      repositories,
      settings.languageConcurrency,
      async (repo) => {
        try {
          return await getGitHubData(`${repoPath(username, repo.name)}/languages`);
        } catch (error) {
          if (IGNORABLE_LANGUAGE_ERRORS.has(error.code)) return {};
          throw error;
        }
      }
    );

    return calculateLanguageDistribution(perRepo);
  });
};

// GitHub's public events API is limited: it is not a complete contribution history.
export const getGitHubActivity = async (username) => {
  validateUsername(username);

  return cached("activity", [username], async () => {
    const events = await getGitHubData(`/users/${username}/events/public`, { per_page: 30 });
    return events.map(mapActivity);
  });
};

export const getGitHubCommits = async (username, repository) => {
  validateRepoTarget(username, repository);

  return cached("commits", [username, repository], async () => {
    try {
      const commits = await getGitHubData(`${repoPath(username, repository)}/commits`, { per_page: 10 });
      return commits.map(mapCommit);
    } catch (error) {
      // GitHub answers 409 for an empty repository: no commits, not a failure.
      if (error.code === ErrorCode.EMPTY_REPOSITORY) return [];
      throw error;
    }
  });
};

export const getGitHubIssues = async (username, repository) => {
  validateRepoTarget(username, repository);

  return cached("issues", [username, repository], async () => {
    const issues = await getGitHubData(`${repoPath(username, repository)}/issues`, {
      state: "all",
      per_page: 30,
    });

    // The issues endpoint also returns pull requests; they carry a `pull_request` property.
    return issues.filter((issue) => !issue.pull_request).map(mapIssue);
  });
};

export const getGitHubPullRequests = async (username, repository) => {
  validateRepoTarget(username, repository);

  return cached("pulls", [username, repository], async () => {
    const pulls = await getGitHubData(`${repoPath(username, repository)}/pulls`, {
      state: "all",
      per_page: 30,
    });
    return pulls.map(mapPullRequest);
  });
};

/* ------------- GraphQL: contribution calendar and monthly totals ---------- */

// REST has no contribution data, so these two use GitHub's GraphQL API (token required).

const CALENDAR_QUERY = `
  query ($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
    }
  }`;

const requireUser = (data) => {
  if (!data?.user) {
    throw new GitHubError(ErrorCode.NOT_FOUND, "GitHub user or resource not found", { status: 404 });
  }
  return data.user;
};

// Heatmap data for one calendar year. Only counts what the user's profile shows
// (private contributions appear only if they enabled that in their GitHub settings).
export const getGitHubContributions = async (username, year) => {
  validateUsername(username);
  const validYear = validateYear(year);

  return cached("contributions", [username, validYear], async () => {
    const { from, to } = buildYearRange(validYear);
    const data = await getGitHubGraphQL(CALENDAR_QUERY, { login: username, from, to });
    const user = requireUser(data);

    const { total, days } = mapContributionCalendar(user.contributionsCollection.contributionCalendar);
    return { year: validYear, total, streaks: calculateStreaks(days), days };
  });
};

// Commits / pull requests / issues per month, in ONE GraphQL request (one aliased field per month).
// The month dates are generated by us (never user input), so building the query string is safe.
export const getGitHubMonthlyActivity = async (username, months = 6) => {
  validateUsername(username);

  return cached("monthly", [username, months], async () => {
    const ranges = buildMonthRanges(months);

    const fields = ranges
      .map(
        (range, index) => `m${index}: contributionsCollection(from: "${range.from}", to: "${range.to}") {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
        }`
      )
      .join("\n");

    const data = await getGitHubGraphQL(
      `query ($login: String!) { user(login: $login) { ${fields} } }`,
      { login: username }
    );

    return mapMonthlyActivity(requireUser(data), ranges);
  });
};

/* -------------- re-exports: keep existing imports working ----------------- */

export { githubAPI, getGitHubRateLimitStatus } from "./github/client.js";
export { GitHubError, ErrorCode, toGitHubError } from "./github/errors.js";
export { validateUsername, validateRepository } from "./github/validation.js";
export { MemoryCache, RedisCache, setCache } from "./github/cache.js";
export { mapWithConcurrency } from "./github/concurrency.js";