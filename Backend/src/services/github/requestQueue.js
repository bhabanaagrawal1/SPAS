import { ErrorCode, GitHubError } from "./errors.js";

const toNumber = (value) => {
  const number = Number(value);
  return value !== undefined && Number.isFinite(number) ? number : undefined;
};

/**
 * Global request queue with rate-limit awareness.
 *
 *  - Runs at most `concurrency` requests at the same time.
 *  - Waiting requests stay in a queue (at most `maxQueued`).
 *  - When GitHub reports a rate limit, new requests pause until it resets.
 *  - If that pause is longer than `maxWaitMs`, requests fail immediately with
 *    RATE_LIMITED instead of hanging for up to an hour.
 *
 * It is a factory (not module-level state) so it can be tested in isolation.
 */
export const createRequestQueue = ({ concurrency, maxQueued, maxWaitMs }) => {
  const queue = [];
  const rateLimit = { remaining: null, limit: null, resetAt: null, blockedUntil: 0 };
  let active = 0;
  let timer = null;

  const blockedFor = () => Math.max(0, rateLimit.blockedUntil - Date.now());

  const rateLimitedError = () =>
    new GitHubError(ErrorCode.RATE_LIMITED, "GitHub API rate limit exceeded", {
      status: 429,
      retryAfter: Math.ceil(blockedFor() / 1000),
      resetAt: new Date(rateLimit.blockedUntil),
    });

  /** Reads GitHub's rate-limit headers (from successful AND failed responses). */
  const updateFromHeaders = (headers = {}) => {
    const remaining = toNumber(headers["x-ratelimit-remaining"]);
    const limit = toNumber(headers["x-ratelimit-limit"]);
    const resetSeconds = toNumber(headers["x-ratelimit-reset"]);
    const retryAfter = toNumber(headers["retry-after"]);

    if (limit !== undefined) rateLimit.limit = limit;

    if (resetSeconds !== undefined) {
      const resetAt = new Date(resetSeconds * 1000);
      const sameWindow = rateLimit.resetAt?.getTime() === resetAt.getTime();
      rateLimit.resetAt = resetAt;

      // Concurrent responses can arrive out of order. Within one window the
      // remaining count only goes down, so keep the smallest value we have seen.
      if (remaining !== undefined) {
        rateLimit.remaining =
          sameWindow && rateLimit.remaining !== null ? Math.min(rateLimit.remaining, remaining) : remaining;
      }
    } else if (remaining !== undefined) {
      rateLimit.remaining = remaining;
    }

    let blockUntil = 0;
    if (retryAfter !== undefined && retryAfter > 0) {
      blockUntil = Date.now() + retryAfter * 1000; // secondary rate limit
    }
    if (remaining === 0 && resetSeconds !== undefined) {
      blockUntil = Math.max(blockUntil, resetSeconds * 1000); // primary rate limit
    }
    if (blockUntil > Date.now()) {
      rateLimit.blockedUntil = Math.max(rateLimit.blockedUntil, blockUntil);
    }
  };

  const failQueued = () => {
    const error = rateLimitedError();
    while (queue.length > 0) queue.shift().reject(error);
  };

  const scheduleDrain = (ms) => {
    if (timer) return; // one cooldown timer is enough
    timer = setTimeout(() => {
      timer = null;
      drain();
    }, ms);
  };

  const run = async ({ task, resolve, reject }) => {
    active++;
    try {
      resolve(await task());
    } catch (error) {
      reject(error);
    } finally {
      active--;
      drain();
    }
  };

  const drain = () => {
    const wait = blockedFor();

    if (wait > maxWaitMs) {
      failQueued();
      return;
    }
    if (wait > 0) {
      scheduleDrain(wait);
      return;
    }

    rateLimit.blockedUntil = 0;
    while (active < concurrency && queue.length > 0) {
      run(queue.shift());
    }
  };

  const enqueue = (task) =>
    new Promise((resolve, reject) => {
      if (blockedFor() > maxWaitMs) {
        reject(rateLimitedError());
        return;
      }
      if (queue.length >= maxQueued) {
        reject(
          new GitHubError(ErrorCode.QUEUE_FULL, "GitHub request queue is full. Please try again.", {
            status: 503,
            retryAfter: 5,
          })
        );
        return;
      }
      queue.push({ task, resolve, reject });
      drain();
    });

  const getStatus = () => ({
    ...rateLimit,
    activeRequests: active,
    queuedRequests: queue.length,
    maximumConcurrency: concurrency,
  });

  return { enqueue, updateFromHeaders, getStatus };
};