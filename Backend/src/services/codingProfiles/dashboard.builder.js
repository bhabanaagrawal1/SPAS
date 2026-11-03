import { PLATFORMS, PLATFORM_KEYS, TOPIC_TARGET, toKey } from "../../config/coding.platforms.js";
import { TOPICS, toTopic } from "../../config/coding.topics.js";
import { lastNDays } from "../../utils/codingProfiles/helpers.js";

// Pure functions: database rows in, the JSON the page needs out. No I/O, easy to unit test.
// Everything returned is plain JSON (dates as ISO strings) so cached and fresh responses are identical.

const ACTIVITY_DAYS = 364; // matches the 364-cell heatmap in the UI
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SYNC_WINDOW_MS = 10 * 60_000;
const FIRST_SYNC_WINDOW_MS = 30 * 60_000;

const levelFor = (count) => (count <= 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4);

/** True while a sync is queued or running. Time-bounded so a lost job can never show "syncing" forever. */
export const isSyncing = (account, now = new Date()) => {
  if (account.syncRequestedAt && now - account.syncRequestedAt < SYNC_WINDOW_MS) return true;
  return account.syncStatus === "PENDING" && now - account.connectedAt < FIRST_SYNC_WINDOW_MS;
};

/** tagTotals: Map<platformTag, solved>  ->  strength per topic shown in the UI. */
export const buildTopics = (tagTotals) => {
  const counts = new Map(TOPICS.map((topic) => [topic, 0]));
  for (const [tag, solved] of tagTotals) {
    const topic = toTopic(tag);
    if (topic) counts.set(topic, counts.get(topic) + solved);
  }

  return TOPICS.map((topic) => {
    const solved = counts.get(topic);
    const strength = Math.min(100, Math.round((solved / TOPIC_TARGET) * 100));
    return { topic, solved, strength, needsWork: 100 - strength };
  });
};

/** dayTotals: Map<"YYYY-MM-DD", count> summed over all linked platforms. */
export const buildActivity = (dayTotals) => {
  const days = lastNDays(ACTIVITY_DAYS).map((date) => {
    const count = dayTotals.get(date) ?? 0;
    return { date, count, level: levelFor(count) };
  });

  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // Today may not be done yet, so an empty today does not break the streak.
  let current = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  for (; i >= 0 && days[i].count > 0; i -= 1) current += 1;

  const months = [];
  let previous = null;
  days.forEach((day, index) => {
    const month = day.date.slice(0, 7);
    if (month !== previous) {
      months.push({ label: MONTH_NAMES[Number(day.date.slice(5, 7)) - 1], index });
      previous = month;
    }
  });

  return {
    days,
    months,
    totalSubmissions: days.reduce((sum, d) => sum + d.count, 0),
    activeDays: days.filter((d) => d.count > 0).length,
    streaks: { current, longest },
  };
};

/** points: [{ occurredAt: Date, rating }] sorted oldest first, for ONE platform. */
export const buildRating = ({ platform, available, points, current }, now = new Date()) => {
  if (!platform || !points.length) {
    return { platform, available, data: [], current: current ?? null, changeThisYear: 0, domain: null };
  }

  // Rating at the end of each of the last 12 months (carried forward between contests).
  const data = [];
  for (let i = 11; i >= 0; i -= 1) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    const last = [...points].reverse().find((p) => p.occurredAt < end);
    if (last) data.push({ month: MONTH_NAMES[start.getUTCMonth()], rating: last.rating });
  }

  const rating = current ?? points.at(-1).rating;
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const baseline = [...points].reverse().find((p) => p.occurredAt < yearStart) ?? points[0];

  const ratings = data.map((d) => d.rating);
  const domain = [
    Math.max(0, Math.floor((Math.min(...ratings) - 100) / 100) * 100),
    Math.ceil((Math.max(...ratings) + 100) / 100) * 100,
  ];

  return { platform, available, data, current: rating, changeThisYear: rating - baseline.rating, domain };
};

const presentPlatform = (key, account, now) => {
  const meta = PLATFORMS[key];
  if (!account) {
    return {
      key, name: meta.name, shortName: meta.shortName, mark: meta.mark, color: meta.color,
      connected: false, handle: null, status: "Connect account", syncStatus: null,
      syncing: false, needsAttention: false, profileUrl: null, lastSyncedAt: null, lastSyncError: null,
    };
  }
  return {
    key, name: meta.name, shortName: meta.shortName, mark: meta.mark, color: meta.color,
    connected: true,
    handle: account.handle,
    status: "Connected",
    syncStatus: account.syncStatus.toLowerCase(),
    syncing: isSyncing(account, now),
    // The student has to do something: fix the handle, or retry after repeated failures.
    needsAttention: account.syncStatus === "INVALID_HANDLE" || account.nextSyncAt === null,
    profileUrl: meta.profileUrl(account.handle),
    lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
    lastSyncError: account.lastError ?? null,
  };
};

export const buildDashboard = ({ accounts, dayTotals, tagTotals, rating, now = new Date() }) => {
  const byKey = new Map(accounts.map((a) => [toKey(a.platform), a]));
  const activity = buildActivity(dayTotals);

  const lastSyncedAt =
    accounts
      .map((a) => a.lastSyncedAt)
      .filter(Boolean)
      .sort((a, b) => b - a)[0] ?? null;

  return {
    hasData: accounts.length > 0,
    // true while any platform is still being fetched: poll the dashboard every few seconds until false
    syncing: accounts.some((a) => isSyncing(a, now)),

    platforms: PLATFORM_KEYS.map((key) => presentPlatform(key, byKey.get(key), now)),

    summary: {
      problemsSolved: accounts.reduce((sum, a) => sum + a.problemsSolved, 0),
      contestsAttended: accounts.reduce((sum, a) => sum + a.contestsAttended, 0),
      currentStreak: activity.streaks.current,
      longestStreak: activity.streaks.longest,
      lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
    },

    activity: {
      days: activity.days,
      months: activity.months,
      totalSubmissions: activity.totalSubmissions,
      activeDays: activity.activeDays,
    },

    ratingProgression: buildRating(rating, now),

    solvedByPlatform: PLATFORM_KEYS.map((key) => ({
      key,
      platform: PLATFORMS[key].shortName,
      solved: byKey.get(key)?.problemsSolved ?? 0,
      color: PLATFORMS[key].color,
    })),

    topics: buildTopics(tagTotals),

    progress: {
      connected: accounts.length,
      total: PLATFORM_KEYS.length,
      connectedPlatforms: accounts.map((a) => {
        const key = toKey(a.platform);
        return { key, name: PLATFORMS[key].name, color: PLATFORMS[key].color };
      }),
    },
  };
};