import { redis, k } from "../../config/coding.redis.js";
import { SETTINGS } from "../../config/coding.settings.js";
import { sleep } from "./helpers.js";

const MAX_WAIT_MS = 120_000;

/**
 * Distributed rate limit towards ONE external platform: guarantees at least `gap` ms between
 * the START of two calls, no matter how many worker/API processes are running.
 * Works by claiming a short-lived Redis key; whoever sets it first may call.
 */
export const throttle = async (platform) => {
  const gap = SETTINGS.throttleGapMs[platform] ?? SETTINGS.throttleGapMs.default;
  const key = k("gate", platform);
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    try {
      if ((await redis.set(key, "1", "PX", gap, "NX")) === "OK") return;
      const ttl = await redis.pttl(key);
      await sleep(Math.max(25, ttl > 0 ? ttl : gap / 2) + Math.random() * 50);
    } catch (error) {
      console.warn(`[throttle] Redis unavailable, not throttling ${platform}: ${error.message}`);
      return;
    }
  }
};