import { redis, k } from "../config/coding.redis.js";
import { CodingProfileError } from "../utils/codingProfiles/errors.js";

/** Fixed-window per-user limiter for HTTP routes. Fails open if Redis is down. */
export const rateLimit = ({ name, max, windowSeconds = 60, keyOf }) => async (req, res, next) => {
  const id = keyOf(req);
  if (!id) return next();

  const key = k("rl", name, id);
  try {
    await redis.set(key, 0, "EX", windowSeconds, "NX"); // creates the window once, with its TTL
    const count = await redis.incr(key);

    if (count > max) {
      const ttl = Math.max(1, await redis.ttl(key));
      res.set("Retry-After", String(ttl));
      return next(new CodingProfileError(429, "Too many requests. Please slow down.", { retryAfter: ttl }));
    }
  } catch (error) {
    console.warn(`[rate-limit] Redis unavailable, allowing request: ${error.message}`);
  }
  return next();
};