import config from "../../config/config.js"
// Activity days are bucketed in this timezone (default IST, UTC+5:30).
// Override with ACTIVITY_UTC_OFFSET_MINUTES in your .env.
const OFFSET_MINUTES = Number(config.activityUtcOffsetMinutes ?? 330);

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** "YYYY-MM-DD" for a timestamp, in the configured timezone. */
export const dayKey = (value) =>
  new Date(new Date(value).getTime() + OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);

/** The last n day keys, oldest first, ending today. */
export const lastNDays = (n) => {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => dayKey(now - (n - 1 - i) * 86_400_000));
};

/** Turns "2024-1-5" or "2024-01-05 10:00" into "2024-01-05" (or null). */
export const normalizeDay = (value) => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(value ?? ""));
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : null;
};

export const hashString = (text) => {
  let hash = 0;
  for (const char of String(text)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
};

// Tiny in-memory TTL cache.
const store = new Map();

export const memo = async (key, ttlMs, loader) => {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const value = await loader();
  store.set(key, { value, expires: Date.now() + ttlMs });

  if (store.size > 500) {
    for (const [k, v] of store) if (v.expires <= Date.now()) store.delete(k);
  }
  return value;
};

export const forget = (key) => store.delete(key);

/** "2026-11-01" <-> Date at UTC midnight (for Postgres DATE columns). */
export const dayToDate = (key) => new Date(`${key}T00:00:00.000Z`);
export const dateToDay = (date) => date.toISOString().slice(0, 10);