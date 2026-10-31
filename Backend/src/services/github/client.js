import axios from "axios";
import { settings } from "./settings.js";
import { fromGraphQLErrors, toGitHubError } from "./errors.js";
import { createRequestQueue } from "./requestQueue.js";

export const githubAPI = axios.create({
  baseURL: "https://api.github.com",
  timeout: settings.requestTimeoutMs,
  headers: {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(settings.token ? { Authorization: `Bearer ${settings.token}` } : {}),
  },
});

const queue = createRequestQueue({
  concurrency: settings.globalConcurrency,
  maxQueued: settings.maxQueuedRequests,
  maxWaitMs: settings.maxRateLimitWaitMs,
});

/** Snapshot for an admin/monitoring endpoint. */
export const getGitHubRateLimitStatus = () => queue.getStatus();

/**
 * The single gateway for GitHub requests: every call is queued, rate-limit
 * headers are tracked, and failures become GitHubError.
 */
export const getGitHubData = (url, params = {}) =>
  queue.enqueue(async () => {
    try {
      const response = await githubAPI.get(url, { params });
      queue.updateFromHeaders(response.headers);
      return response.data;
    } catch (error) {
      queue.updateFromHeaders(error.response?.headers);
      throw toGitHubError(error);
    }
  });

/**
 * Fetches every page of a list endpoint (page 1 = items 1-100, page 2 = 101-200, ...).
 * A page with fewer than `perPage` items is the last one.
 */
export const getAllPages = async (url, params = {}, maxPages = settings.maxPages) => {
  const results = [];

  for (let page = 1; page <= maxPages; page++) {
    const batch = await getGitHubData(url, { ...params, per_page: settings.perPage, page });
    results.push(...batch);
    if (batch.length < settings.perPage) break;
  }

  return results;
};

/**
 * GraphQL gateway (same queue, rate-limit tracking and error translation as REST).
 * GitHub's GraphQL API always requires a token.
 */
export const getGitHubGraphQL = (query, variables = {}) =>
  queue.enqueue(async () => {
    let response;
    try {
      response = await githubAPI.post("/graphql", { query, variables });
    } catch (error) {
      queue.updateFromHeaders(error.response?.headers);
      throw toGitHubError(error);
    }

    queue.updateFromHeaders(response.headers);

    const { data, errors } = response.data ?? {};
    if (errors?.length) throw fromGraphQLErrors(errors);
    return data;
  });