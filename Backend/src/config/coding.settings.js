import config from "./config.js";
const num = (name, fallback) => {
  const raw = config[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export const SETTINGS = {
  namespace: config.redisNamespace ?? "s360",

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

  // Data limits
  activityRetentionDays: 730,
  maxSolvedKeys: 5000,

  // Minimum gap between two HTTP calls to the same platform, across ALL processes.
  throttleGapMs: {
    codeforces: num("CODING_GAP_MS_CODEFORCES", 2000),
    default: num("CODING_GAP_MS_DEFAULT", 500),
  },
};