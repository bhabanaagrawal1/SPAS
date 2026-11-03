import "dotenv/config";

const requiredEnv = (name) => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

const config = {
    // database ka url
    databaseurl: requiredEnv("DATABASE_URL"),
    // port ka
    port: process.env.PORT || 3000,

    // production or development phase 
    nodeEnv: process.env.NODE_ENV || "development",

    // email ka api key
    resendApiKey: requiredEnv("RESEND_API_KEY"),
    emailFrom: requiredEnv("EMAIL_FROM"),
    clientUrl: requiredEnv("CLIENT_URL"),

    // jwt related stuffs 
    jwt: { 
      accessSecret:  requiredEnv("JWT_ACCESS_SECRET"), 
      refreshSecret:  requiredEnv("JWT_REFRESH_SECRET"), 
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m", 
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
    node_env: process.env.NODE_ENV,
    // cookie related stuffs
    cookie: {
    refreshTokenName: process.env.REFRESH_COOKIE_NAME || "refreshToken",
    options: {
      httpOnly: true, // JavaScript browser ke document.cookie se is cookie ko read nahi kar sakta.
      secure: process.env.NODE_ENV === "production", // 
      sameSite: "strict", // 
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }
  },

  tokenExpiry: {
      emailVerifyMs: Number(process.env.EMAIL_VERIFY_EXPIRY_MS) || 24 * 60 * 60 * 1000,
      passwordResetMs: Number(process.env.PASSWORD_RESET_EXPIRY_MS) || 60 * 60 * 1000,
  },

  //rate-limiters
  loginratelimitwindowmin: process.env.LOGIN_RATE_LIMIT_WINDOW_MIN,
  loginratelimitmax: process.env.NODE_ENV === "test"
        ? 100
        : Number(process.env.LOGIN_RATE_LIMIT_MAX),
  gracePeriodMs: process.env.GRACE_PERIOD_MS || 3 * 24 * 60 * 60 * 1000,
  githubToken: process.env.GITHUB_TOKEN,

  // Concurrency
  githubConcurrency: process.env.GITHUB_CONCURRENCY,
  githubGlobalConcurrency: process.env.GITHUB_GLOBAL_CONCURRENCY,
  githubMaxQueuedRequests: process.env.GITHUB_MAX_QUEUED_REQUESTS,

  // Rate limit
  githubMaxRateLimitWaitSeconds:
    process.env.GITHUB_MAX_RATE_LIMIT_WAIT_SECONDS,

  // Cache TTL (seconds)
  githubTtlProfile: process.env.GH_TTL_PROFILE,
  githubTtlRepos: process.env.GH_TTL_REPOS,
  githubTtlLanguages: process.env.GH_TTL_LANGUAGES,
  githubTtlActivity: process.env.GH_TTL_ACTIVITY,
  githubTtlCommits: process.env.GH_TTL_COMMITS,
  githubTtlIssues: process.env.GH_TTL_ISSUES,
  githubTtlPulls: process.env.GH_TTL_PULLS,
  githubTtlContributions: process.env.GH_TTL_CONTRIBUTIONS,
  githubTtlMonthly: process.env.GH_TTL_MONTHLY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  debugAi: process.env.DEBUG_AI === "true",
  redisUrl: process.env.REDIS_URL,
  redisQueueUrl: process.env.REDIS_QUEUE_URL,
  redisNamespace: process.env.REDIS_NAMESPACE || "s360",
  codingSyncIntervalMinutes: process.env.CODING_SYNC_INTERVAL_MINUTES,
  codingMaxConsecutiveFailures: process.env.CODING_MAX_CONSECUTIVE_FAILURES,
  codingManualSyncCooldownSeconds: process.env.CODING_MANUAL_SYNC_COOLDOWN_SECONDS,
  codingDashboardCacheSeconds: process.env.CODING_DASHBOARD_CACHE_SECONDS,
  codingRecommendationsCacheSeconds: process.env.CODING_RECOMMENDATIONS_CACHE_SECONDS,
  codingWorkerConcurrency: process.env.CODING_WORKER_CONCURRENCY,
  codingSchedulerSeconds: process.env.CODING_SCHEDULER_SECONDS,
  redisHost: process.env.REDIS_HOST,
redisPort: Number(process.env.REDIS_PORT),
redisUsername: process.env.REDIS_USERNAME || "default",
redisPassword: process.env.REDIS_PASSWORD,
redisNamespace: process.env.REDIS_NAMESPACE || "s360",
activityUtcOffsetMinutes: Number(process.env.ACTIVITY_UTC_OFFSET_MINUTES ?? 330),
}

export default Object.freeze(config);