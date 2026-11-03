import { randomUUID } from "node:crypto";
import { redis } from "../../config/coding.redis.js";

// Only delete the lock if we still own it (it may have expired and been taken by someone else).
const RELEASE = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0`;

/**
 * Runs fn while holding a distributed lock. Returns { acquired: false } if someone else holds it.
 * If Redis is unreachable it runs fn anyway (our writes are idempotent), and logs a warning.
 */
export const withLock = async (key, ttlMs, fn) => {
  const token = randomUUID();

  let acquired;
  try {
    acquired = (await redis.set(key, token, "PX", ttlMs, "NX")) === "OK";
  } catch (error) {
    console.warn(`[lock] could not reach Redis, continuing without lock: ${error.message}`);
    return { acquired: true, value: await fn() };
  }

  if (!acquired) return { acquired: false };

  try {
    return { acquired: true, value: await fn() };
  } finally {
    redis.eval(RELEASE, 1, key, token).catch(() => {});
  }
};