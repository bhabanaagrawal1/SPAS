/*
 * A cache adapter is any object with:
 *   async get(key)                  -> value, or undefined when missing/expired
 *   async set(key, value, ttlSecs)
 */

export class MemoryCache {
  constructor({ maxEntries = 1000 } = {}) {
    this.maxEntries = maxEntries;
    this.store = new Map();
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() >= entry.expiry) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data;
  }

  async set(key, data, ttlSeconds) {
    this.store.delete(key); // re-insert so this entry counts as the newest
    this.store.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });

    // Map keeps insertion order, so the first key is the oldest one.
    if (this.store.size > this.maxEntries) {
      this.store.delete(this.store.keys().next().value);
    }
  }
}

// Shares cached data between backend instances.
//   setCache(new RedisCache(new Redis(process.env.REDIS_URL)));
export class RedisCache {
  constructor(client, prefix = "gh:") {
    this.client = client;
    this.prefix = prefix;
  }

  async get(key) {
    const raw = await this.client.get(this.prefix + key);
    return raw ? JSON.parse(raw) : undefined;
  }

  async set(key, data, ttlSeconds) {
    await this.client.set(this.prefix + key, JSON.stringify(data), "EX", ttlSeconds);
  }
}

let cache = new MemoryCache();

export const setCache = (adapter) => {
  if (typeof adapter?.get !== "function" || typeof adapter?.set !== "function") {
    throw new TypeError("Cache adapter must implement get() and set()");
  }
  cache = adapter;
};

// GitHub usernames and repository names are case-insensitive, so
// "Octocat" and "octocat" must share one cache entry.
export const buildCacheKey = (type, ...parts) =>
  [type, ...parts].map((part) => String(part).toLowerCase()).join(":");

// If several callers ask for the same uncached key at once,
// only the first one calls GitHub; the rest share its promise.
const inFlight = new Map();

// `refresh: true` skips the cached value (the fresh result is still stored for next time).
export const cachedRequest = async (key, ttlSeconds, loader, { refresh = false } = {}) => {
  if (!refresh) {
    try {
      const hit = await cache.get(key);
      if (hit !== undefined) return hit;
    } catch {
      // A broken cache must never break the feature: fetch fresh data instead.
    }
  }

  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    const data = await loader();
    try {
      await cache.set(key, data, ttlSeconds);
    } catch {
      // Ignore cache write failures.
    }
    return data;
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
};