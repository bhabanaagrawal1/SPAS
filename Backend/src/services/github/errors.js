export const ErrorCode = Object.freeze({
  INVALID_INPUT: "INVALID_INPUT",
  NOT_FOUND: "NOT_FOUND",
  EMPTY_REPOSITORY: "EMPTY_REPOSITORY",
  INVALID_TOKEN: "INVALID_TOKEN",
  RATE_LIMITED: "RATE_LIMITED",
  FORBIDDEN: "FORBIDDEN",
  UPSTREAM_ERROR: "UPSTREAM_ERROR",
  TIMEOUT: "TIMEOUT",
  NETWORK_ERROR: "NETWORK_ERROR",
  QUEUE_FULL: "QUEUE_FULL",
  UNKNOWN: "UNKNOWN",
});

/**
 * Error with machine-readable details.
 * `code`   -> stable identifier for your code to branch on
 * `status` -> suggested HTTP status for your Express response
 */
export class GitHubError extends Error {
  constructor(code, message, { status, resetAt, retryAfter } = {}) {
    super(message);
    this.name = "GitHubError";
    this.code = code;
    this.status = status;
    this.resetAt = resetAt; // Date when the rate limit resets
    this.retryAfter = retryAfter; // seconds to wait before retrying
  }
}

const NETWORK_CODES = new Set(["ENOTFOUND", "ECONNRESET", "ECONNREFUSED", "EAI_AGAIN"]);
const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"]);

const toNumber = (value) => {
  const number = Number(value);
  return value !== undefined && Number.isFinite(number) ? number : undefined;
};

// GitHub uses 403 for BOTH rate limits and real permission problems,
// so the response headers decide which one it is.
const fromHttpStatus = (status, headers) => {
  if (status === 404) {
    return new GitHubError(ErrorCode.NOT_FOUND, "GitHub user or resource not found", { status: 404 });
  }
  if (status === 409) {
    return new GitHubError(ErrorCode.EMPTY_REPOSITORY, "Repository is empty", { status: 409 });
  }
  if (status === 401) {
    return new GitHubError(ErrorCode.INVALID_TOKEN, "GitHub token is invalid or expired", { status: 502 });
  }
  if (status === 403 || status === 429) {
    const retryAfter = toNumber(headers["retry-after"]);
    const resetSeconds = toNumber(headers["x-ratelimit-reset"]);
    const resetAt = resetSeconds !== undefined ? new Date(resetSeconds * 1000) : undefined;
    const exhausted = String(headers["x-ratelimit-remaining"]) === "0";

    if (status === 429 || exhausted || retryAfter !== undefined) {
      return new GitHubError(ErrorCode.RATE_LIMITED, "GitHub API rate limit exceeded", {
        status: 429,
        resetAt,
        retryAfter:
          retryAfter ??
          (resetAt ? Math.max(0, Math.ceil((resetAt.getTime() - Date.now()) / 1000)) : undefined),
      });
    }
    return new GitHubError(ErrorCode.FORBIDDEN, "Access to this GitHub resource is denied", { status: 403 });
  }
  if (status >= 500) {
    return new GitHubError(ErrorCode.UPSTREAM_ERROR, "GitHub is temporarily unavailable", { status: 502 });
  }
  return undefined;
};

/** Converts any Axios/GitHub failure into a GitHubError. */
export const toGitHubError = (error) => {
  if (error instanceof GitHubError) return error;

  const fromStatus = fromHttpStatus(error?.response?.status, error?.response?.headers ?? {});
  if (fromStatus) return fromStatus;

  if (TIMEOUT_CODES.has(error?.code)) {
    return new GitHubError(ErrorCode.TIMEOUT, "GitHub API request timed out", { status: 504 });
  }
  if (NETWORK_CODES.has(error?.code)) {
    return new GitHubError(ErrorCode.NETWORK_ERROR, "Could not reach GitHub", { status: 502 });
  }
  return new GitHubError(ErrorCode.UNKNOWN, "Unable to communicate with GitHub", { status: 502 });
};

/**
 * GraphQL reports failures inside a normal HTTP 200 response:
 *   { data: { user: null }, errors: [{ type: "NOT_FOUND", message: "..." }] }
 * so they cannot go through toGitHubError (which looks at HTTP status codes).
 */
export const fromGraphQLErrors = (errors) => {
  const types = errors.map((error) => error?.type);

  if (types.includes("NOT_FOUND")) {
    return new GitHubError(ErrorCode.NOT_FOUND, "GitHub user or resource not found", { status: 404 });
  }
  if (types.includes("RATE_LIMITED")) {
    return new GitHubError(ErrorCode.RATE_LIMITED, "GitHub API rate limit exceeded", { status: 429 });
  }
  if (types.includes("FORBIDDEN") || types.includes("INSUFFICIENT_SCOPES")) {
    return new GitHubError(ErrorCode.FORBIDDEN, "Access to this GitHub resource is denied", { status: 403 });
  }
  return new GitHubError(ErrorCode.UPSTREAM_ERROR, "GitHub returned an error", { status: 502 });
};