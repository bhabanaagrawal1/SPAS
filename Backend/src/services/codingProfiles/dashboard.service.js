import { prisma } from "../../config/coding.prisma.js";
import { SETTINGS } from "../../config/coding.settings.js";
import { PLATFORM_KEYS, toEnum, toKey } from "../../config/coding.platforms.js";
import { buildDashboard } from "./dashboard.builder.js";
import { cached, studentVersion } from "../../utils/codingProfiles/cache.js";
import { k } from "../../config/coding.redis.js";
import { dateToDay, dayToDate, lastNDays } from "../../utils/codingProfiles/helpers.js";

const compute = async (studentId, requestedPlatform) => {
  const accounts = await prisma.codingAccount.findMany({
    where: { studentId },
    select: {
      id: true, platform: true, handle: true, syncStatus: true, syncRequestedAt: true, nextSyncAt: true,
      lastSyncedAt: true, lastError: true, connectedAt: true,
      problemsSolved: true, contestsAttended: true, currentRating: true,
    },
  });

  const rating = { platform: null, available: [], points: [], current: null };
  let dayTotals = new Map();
  let tagTotals = new Map();

  if (accounts.length) {
    const ids = accounts.map((a) => a.id);
    const since = dayToDate(lastNDays(364)[0]);

    // Which platform's rating history to chart.
    const rated = accounts.filter((a) => a.contestsAttended > 0);
    rating.available = rated.map((a) => toKey(a.platform));
    rating.platform = rating.available.includes(requestedPlatform)
      ? requestedPlatform
      : rating.available.includes("codeforces")
        ? "codeforces"
        : (rating.available[0] ?? null);
    const chosen = rated.find((a) => toKey(a.platform) === rating.platform);

    const [dayRows, tagRows, points] = await Promise.all([
      prisma.codingActivityDay.groupBy({
        by: ["day"],
        where: { accountId: { in: ids }, day: { gte: since } },
        _sum: { count: true },
      }),
      prisma.codingTagStat.groupBy({
        by: ["tag"],
        where: { accountId: { in: ids } },
        _sum: { solved: true },
      }),
      chosen
        ? prisma.codingRatingPoint.findMany({
            where: { accountId: chosen.id },
            orderBy: { occurredAt: "asc" },
            select: { occurredAt: true, rating: true },
          })
        : [],
    ]);

    dayTotals = new Map(dayRows.map((r) => [dateToDay(r.day), r._sum.count ?? 0]));
    tagTotals = new Map(tagRows.map((r) => [r.tag, r._sum.solved ?? 0]));
    rating.points = points;
    rating.current = chosen?.currentRating ?? null;
  }

  return buildDashboard({ accounts, dayTotals, tagTotals, rating });
};

/** Reads from Postgres (never from the external platforms), with a short Redis cache in front. */
export const getDashboard = async (studentId, { ratingPlatform } = {}) => {
  const platform = PLATFORM_KEYS.includes(ratingPlatform) ? ratingPlatform : "auto"; // bounded key space
  const version = await studentVersion(studentId);
  const key = k("dash", "v1", studentId, version, platform);

  return cached(key, SETTINGS.dashboardCacheSeconds, () =>
    compute(studentId, platform === "auto" ? undefined : platform)
  );
};