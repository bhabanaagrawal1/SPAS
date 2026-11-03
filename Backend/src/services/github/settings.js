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
  profile: toPositiveInt(process.env.GH_TTL_PROFILE, 15 * 60),
  repos: toPositiveInt(process.env.GH_TTL_REPOS, 10 * 60),
  languages: toPositiveInt(process.env.GH_TTL_LANGUAGES, 60 * 60),
  activity: toPositiveInt(process.env.GH_TTL_ACTIVITY, 2 * 60),
  commits: toPositiveInt(process.env.GH_TTL_COMMITS, 5 * 60),
  issues: toPositiveInt(process.env.GH_TTL_ISSUES, 5 * 60),
  pulls: toPositiveInt(process.env.GH_TTL_PULLS, 5 * 60),
  contributions: toPositiveInt(process.env.GH_TTL_CONTRIBUTIONS, 30 * 60),
  monthly: toPositiveInt(process.env.GH_TTL_MONTHLY, 60 * 60),
  recommendations: toPositiveInt(process.env.GH_TTL_RECOMMENDATIONS, 6 * 60 * 60),
});