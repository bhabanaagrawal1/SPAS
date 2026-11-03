import { redis, k } from "../../config/coding.redis.js";
import { sleep } from "./helpers.js";

/*
 * Redis is a CACHE here: everything in it can be deleted at any moment and the app still works
 * (just slower). So every helper fails open: a Redis error is logged and treated as a miss.
 */

const warn = (action, error) => console.warn(`[cache] ${action} failed: ${error.message}`);

// +/-10% on every TTL so keys written together do not all expire together.
const withJitter = (seconds) => Math.max(1, Math.round(seconds * (0.9 + Math.random() * 0.2)));

export const cacheGet = async (key) => {
  try {
    const raw = await redis.get(key);
    return raw === null ? null : JSON.parse(raw);
  } catch (error) {
    warn("get", error);
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds) => {
  if (!ttlSeconds || value === undefined) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", withJitter(ttlSeconds));
  } catch (error) {
    warn("set", error);
  }
};

export const cacheDel = async (key) => {
  try {
    await redis.del(key);
  } catch (error) {
    warn("del", error);
  }
};

/**
 * Cache-aside with stampede protection: on a miss only ONE caller runs the loader,
 * the others wait briefly for the value to appear.
 */
export const cached = async (key, ttlSeconds, loader) => {
  if (!ttlSeconds) return loader();

  const hit = await cacheGet(key);
  if (hit !== null) return hit;

  const lockKey = `${key}:lock`;
  let owner = true;
  try {
    owner = (await redis.set(lockKey, "1", "PX", 15_000, "NX")) === "OK";
  } catch (error) {
    warn("lock", error); // Redis down: just load
  }

  if (!owner) {
    for (let i = 0; i < 20; i += 1) {
      await sleep(100);
      const again = await cacheGet(key);
      if (again !== null) return again;
    }
  }

  try {
    const value = await loader();
    await cacheSet(key, value, ttlSeconds);
    return value;
  } finally {
    if (owner) redis.del(lockKey).catch(() => {});
  }
};

/*
 * Per-student version number. Cache keys contain it, so "invalidate everything for this student"
 * is a single INCR: old keys become unreachable and simply expire. No key scanning needed.
 */
export const studentVersion = async (studentId) => {
  try {
    return (await redis.get(k("ver", studentId))) ?? "0";
  } catch (error) {
    warn("version get", error);
    return "0";
  }
};

export const bumpStudentVersion = async (studentId) => {
  try {
    await redis.incr(k("ver", studentId));
  } catch (error) {
    warn("version bump", error); // worst case: cached data lives until its short TTL ends
  }
};