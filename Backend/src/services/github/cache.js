/*
 * A cache adapter is any object with:
 *   async get(key)                  -> value, or undefined when missing/expired
 *   async set(key, value, ttlSecs)
 */

/**
Step 1: Why do we need a class?
Imagine we want to store a student's GitHub profile.

We need a structure that can:
- Store the profile.
- Retrieve the profile.
- Check whether it has expired.
- Delete old data.
Instead of creating separate unrelated functions, we group these related operations into a class called MemoryCache.

{ maxEntries = 1000 } = {}
uses two JavaScript concepts:
- Object destructuring.
- Default parameter values.
It means:
- If the caller provides maxEntries, use that value.
- Otherwise, use 1000.
- If no argument is supplied, use an empty object.
 */
export class MemoryCache {
  constructor({ maxEntries = 1000 } = {}) {
    this.maxEntries = maxEntries;
    this.store = new Map();
  }

  // Get data from cache
  async get(key) {
    const entry = this.store.get(key);

    // If data does not exist
    if (!entry) return undefined;

    // If data has expired
    if (Date.now() >= entry.expiry) {
      this.store.delete(key);
      return undefined;
    }

    // LRU: Move recently accessed entry to the end
    this.store.delete(key);
    this.store.set(key, entry);

    // Return cached data
    return entry.data;
  }

  // Store data in cache
  async set(key, data, ttlSeconds) {
    // Remove existing entry if present
    this.store.delete(key);

    // Insert as the newest entry
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000
    });

    // If cache exceeds maximum capacity
    if (this.store.size > this.maxEntries) {
      // Get the oldest key i.e the first inserted key in the Map
      const oldestKey = this.store.keys().next().value;

      // Remove least recently used entry
      this.store.delete(oldestKey);
    }
  }
}

// Shares cached data between backend instances.
//   setCache(new RedisCache(new Redis(process.env.REDIS_URL)));
/**
There are two things here:
- client: the connection through which our application communicates with Redis.
- prefix: a small label added before each cache key.
this.prefix = "gh:"; //github redis cache
key = "profile:octocat";
Result: gh:profile:octocat
 */
export class RedisCache {
  constructor(client, prefix = "gh:") {
    this.client = client;
    this.prefix = prefix;
  }

  async get(key) {
    const raw = await this.client.get(this.prefix + key);
    return raw ? JSON.parse(raw) : undefined; //Redis stores our data as a string. JSON.parse(raw) converts string text back into a JavaScript object.
  }
/**
JSON.stringify(data)	Converts JavaScript data into text
"EX"	Tells Redis to use an expiry time in seconds
ttlSeconds	How long the data should remain stored
 */
  async set(key, data, ttlSeconds) {
    await this.client.set(this.prefix + key, JSON.stringify(data), "EX", ttlSeconds);
  }
}

let cache = new MemoryCache();
// adapter is the cache object we want to use.
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
// Here, inFlight temporarily stores requests that are currently running.
const inFlight = new Map();

export const cachedRequest = async (key, ttlSeconds, loader) => {
  try {
    const hit = await cache.get(key);
    if (hit !== undefined) return hit;
  } catch {
    // A broken cache must never break the feature: fetch fresh data instead.
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