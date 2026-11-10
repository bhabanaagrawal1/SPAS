import config from "./config.js";

// Each setting is read from the environment (.env) first, then from your config object under the SAME name,
// then falls back to the default. So `CODING_AI_DAILY_BUDGET=500` in .env works without touching config.js.
const read = (name) => process.env[name] ?? config[name];

const num = (name, fallback) => {
  const raw = read(name);
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export const SETTINGS = {
  namespace: process.env.REDIS_NAMESPACE ?? config.redisNamespace ?? "s360",

  // How often each account is re-synced, and how failures back off.
  syncIntervalMs: num("CODING_SYNC_INTERVAL_MINUTES", 360) * 60_000,
  maxBackoffMs: 24 * 3_600_000,
  invalidHandleRetryMs: 24 * 3_600_000,
  maxConsecutiveFailures: num("CODING_MAX_CONSECUTIVE_FAILURES", 8),
  syncLockMs: 180_000,
  manualSyncCooldownSeconds: num("CODING_MANUAL_SYNC_COOLDOWN_SECONDS", 300),

  // Cache TTLs (seconds). Set a value to 0 to disable that cache.
  dashboardCacheSeconds: num("CODING_DASHBOARD_CACHE_SECONDS", 120),
  recommendationsCacheSeconds: num("CODING_RECOMMENDATIONS_CACHE_SECONDS", 1800),
  catalogCacheSeconds: 6 * 3600,

  // Worker + scheduler
  workerConcurrency: num("CODING_WORKER_CONCURRENCY", 4),
  schedulerEveryMs: num("CODING_SCHEDULER_SECONDS", 60) * 1000,
  schedulerBatchSize: num("CODING_SCHEDULER_BATCH", 100),

  // Gemini-powered recommendations (falls back to rule-based picks if Gemini is slow, down or over budget)
  aiRecommendationsEnabled: String(read("CODING_AI_RECOMMENDATIONS") ?? config.codingAiRecommendations) !== "false",
  aiCacheSeconds: num("CODING_AI_CACHE_SECONDS", 6 * 3600),
  aiFallbackCacheSeconds: num("CODING_AI_FALLBACK_CACHE_SECONDS", 300), // how long a rule-based fallback is cached before Gemini is tried again
  aiTimeoutMs: num("CODING_AI_TIMEOUT_MS", 10_000), // how long a page load may wait for Gemini
  // Models tried in order. Flash-Lite is fast and cheap, which is plenty for "pick from this list".
  aiModels: String(read("CODING_AI_MODELS") ?? "gemini-3.5-flash-lite,gemini-3.6-flash")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean),
  aiDeadlineMs: num("CODING_AI_DEADLINE_MS", 15_000), // total time Gemini may spend, retries included
  aiDailyBudget: num("CODING_AI_DAILY_BUDGET", 1500), // max Gemini calls per day across all students
  aiRefreshCooldownSeconds: num("CODING_AI_REFRESH_COOLDOWN_SECONDS", 600),

  // Data limits
  activityRetentionDays: 730,
  maxSolvedKeys: 5000,

  // Minimum gap between two HTTP calls to the same platform, across ALL processes.
  throttleGapMs: {
    codeforces: num("CODING_GAP_MS_CODEFORCES", 2000),
    default: num("CODING_GAP_MS_DEFAULT", 500),
  },
};