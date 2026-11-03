import {
  ErrorCode,
  GitHubError,
  getGitHubActivity,
  getGitHubContributions,
  getGitHubMonthlyActivity,
  getGitHubCommits,
  getGitHubIssues,
  getGitHubLanguages,
  getGitHubProfile,
  getGitHubPullRequests,
  getGitHubRateLimitStatus,
  getGitHubRepositories,
} from "../services/github.service.js";
import { AiError } from "../services/ai/gemini.client.js";
import { getProjectRecommendations } from "../services/recommendations.service.js";

/*
 * Controllers only translate between HTTP and the service:
 *   req.params -> service call -> JSON response
 * Validation, caching, rate limits and retries all live in the service.
 *
 * Success: { success: true,  data }
 * Failure: { success: false, error: { code, message, retryAfter?, resetAt? } }
 */

// These errors describe OUR setup (bad token) or are unknown. Clients cannot fix
// them and should not see the details, so we log them and return a generic message.
const HIDDEN_FROM_CLIENT = new Set([ErrorCode.INVALID_TOKEN, ErrorCode.UNKNOWN]);

const sendGitHubError = (res, error) => {
  const { code, status = 502, retryAfter, resetAt } = error;

  if (HIDDEN_FROM_CLIENT.has(code)) {
    console.error(`[github] ${code}: ${error.message}`);
    return res.status(502).json({
      success: false,
      error: { code: "GITHUB_UNAVAILABLE", message: "GitHub data is temporarily unavailable" },
    });
  }

  // Standard header: tells browsers and API clients when to retry.
  if (retryAfter !== undefined) res.set("Retry-After", String(retryAfter));

  return res.status(status).json({
    success: false,
    error: {
      code,
      message: error.message,
      ...(retryAfter !== undefined && { retryAfter }),
      ...(resetAt && { resetAt: resetAt.toISOString() }),
    },
  });
};

// AI failures. A missing/invalid Gemini key is OUR problem: log it, show a generic message.
const sendAiError = (res, error) => {
  const { code, status = 503, retryAfter } = error;

  if (code === "AI_CONFIG") {
    console.error(`[ai] ${code}: ${error.message}`);
    return res.status(503).json({
      success: false,
      error: { code: "AI_UNAVAILABLE", message: "Project ideas are temporarily unavailable." },
    });
  }

  if (retryAfter !== undefined) res.set("Retry-After", String(retryAfter));
  return res.status(status).json({
    success: false,
    error: { code, message: error.message, ...(retryAfter !== undefined && { retryAfter }) },
  });
};

// Wraps a service call so each controller is one line.
// GitHubError -> formatted response. Anything else -> your global error handler.
const handle = (load) => async (req, res, next) => {
  try {
    const data = await load(req.params, req.query);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof GitHubError) return sendGitHubError(res, error);
    next(error);
  }
};

export const getProfile = handle(({ username }) => getGitHubProfile(username));
export const getRepositories = handle(({ username }) => getGitHubRepositories(username));
export const getLanguages = handle(({ username }) => getGitHubLanguages(username));
export const getActivity = handle(({ username }) => getGitHubActivity(username));

// ?year=2025 (defaults to the current year)
export const getContributions = handle(({ username }, { year }) => getGitHubContributions(username, year));
export const getMonthlyActivity = handle(({ username }) => getGitHubMonthlyActivity(username));

export const getCommits = handle(({ username, repository }) => getGitHubCommits(username, repository));
export const getIssues = handle(({ username, repository }) => getGitHubIssues(username, repository));
export const getPullRequests = handle(({ username, repository }) =>
  getGitHubPullRequests(username, repository)
);

// ?refresh=1 asks for NEW ideas instead of the cached ones.
export const getRecommendations = async (req, res, next) => {
  try {
    const data = await getProjectRecommendations(req.params.username, { refresh: req.query.refresh === "1" });
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof GitHubError) return sendGitHubError(res, error);
    if (error instanceof AiError) return sendAiError(res, error);
    next(error);
  }
};

// Monitoring: remaining quota, queue length, active requests. Protect this route (admin only).
export const getRateLimitStatus = (req, res) => {
  res.json({ success: true, data: getGitHubRateLimitStatus() });
};