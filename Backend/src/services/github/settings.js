import config from "../../config/config.js";

// Invalid, zero, negative and non-integer values fall back to the default.
const toPositiveInt = (value, fallback) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
};

export const settings = Object.freeze({
  token: config.githubToken,
  requestTimeoutMs: 10_000,

  // Pagination: GitHub returns at most 100 items per page.
  perPage: 100,
  maxPages: 10, // safety cap: at most 1,000 repositories per user

  // Concurrency
  languageConcurrency: toPositiveInt(config.githubConcurrency, 5), // per language calculation
  globalConcurrency: toPositiveInt(config.githubGlobalConcurrency, 10), // whole process
  maxQueuedRequests: toPositiveInt(config.githubMaxQueuedRequests, 500),

  // If GitHub says "wait longer than this", fail fast instead of keeping HTTP requests hanging.
  maxRateLimitWaitMs: toPositiveInt(config.githubMaxRateLimitWaitSeconds, 30) * 1000,
});

// Cache lifetime (seconds) per data type.
export const TTL_SECONDS = Object.freeze({
  profile: toPositiveInt(config.githubTtlProfile, 15 * 60),
  repos: toPositiveInt(config.githubTtlRepos, 10 * 60),
  languages: toPositiveInt(config.githubTtlLanguages, 60 * 60),
  activity: toPositiveInt(config.githubTtlActivity, 2 * 60),
  commits: toPositiveInt(config.githubTtlCommits, 5 * 60),
  issues: toPositiveInt(config.githubTtlIssues, 5 * 60),
  pulls: toPositiveInt(config.githubTtlPulls, 5 * 60),
  contributions: toPositiveInt(config.githubTtlContributions, 30 * 60),
  monthly: toPositiveInt(config.githubTtlMonthly, 60 * 60),
});