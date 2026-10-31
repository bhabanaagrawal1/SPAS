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
}

export default Object.freeze(config);