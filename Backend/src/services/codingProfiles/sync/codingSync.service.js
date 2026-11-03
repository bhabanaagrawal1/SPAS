import { prisma } from "../../../config/coding.prisma.js";
import { SETTINGS } from "../../../config/coding.settings.js";
import { providers } from "../providers/index.js";
import { ProviderError } from "../providers/http.js";
import { withLock } from "../../../utils/codingProfiles/lock.js";
import { bumpStudentVersion } from "../../../utils/codingProfiles/cache.js";
import { k } from "../../../config/coding.redis.js";
import { toKey } from "../../../config/coding.platforms.js";
import { dayToDate } from "../../../utils/codingProfiles/helpers.js";

const jitter = (ms) => Math.round(ms * (0.9 + Math.random() * 0.2));
const backoffMs = (failures) => Math.min(SETTINGS.maxBackoffMs, 15 * 60_000 * 2 ** (failures - 1));

// Prisma codes for "row was deleted while we worked" (student disconnected / changed handle).
const GONE = new Set(["P2025", "P2003"]);

/* ---------------------------- failure bookkeeping ---------------------------- */

const recordFailure = async (account, error) => {
  const invalid = error instanceof ProviderError && error.code === "NOT_FOUND";
  if (!(error instanceof ProviderError)) {
    console.error(`[coding-sync] unexpected error for ${account.platform}/${account.handle}:`, error);
  }

  const failures = account.consecutiveFailures + 1;
  const retryMs = invalid ? SETTINGS.invalidHandleRetryMs : backoffMs(failures);
  const giveUp = failures >= SETTINGS.maxConsecutiveFailures;
  const now = new Date();

  await prisma.codingAccount.updateMany({
    where: { id: account.id },
    data: {
      syncStatus: invalid ? "INVALID_HANDLE" : "ERROR",
      lastAttemptAt: now,
      lastError: error instanceof ProviderError ? error.message : "Sync failed unexpectedly.",
      consecutiveFailures: failures,
      // null = stop automatic retries until the student acts (manual sync or new handle)
      nextSyncAt: giveUp ? null : new Date(now.getTime() + jitter(retryMs)),
      syncRequestedAt: null,
    },
  });
};

/* ------------------------------- persistence ------------------------------- */

const persist = async (account, data) => {
  const now = new Date();
  const accountId = account.id;

  const ratingPoints = [
    ...new Map(
      data.ratingHistory.map((p) => [
        p.at.getTime(),
        { accountId, occurredAt: p.at, contestName: String(p.contest ?? "").slice(0, 200), rating: Math.round(p.rating) },
      ])
    ).values(),
  ];

  const tagTotals = new Map();
  for (const { tag, solved } of data.topics) {
    const name = String(tag).slice(0, 100);
    tagTotals.set(name, (tagTotals.get(name) ?? 0) + solved);
  }

  const activity = data.activity.filter((a) => a.count > 0);

  await prisma.$transaction(
    async (tx) => {
      await tx.codingAccount.update({
        where: { id: accountId },
        data: {
          syncStatus: "OK",
          lastSyncedAt: now,
          lastAttemptAt: now,
          lastError: null,
          consecutiveFailures: 0,
          nextSyncAt: new Date(now.getTime() + jitter(SETTINGS.syncIntervalMs)),
          syncRequestedAt: null,
          problemsSolved: data.solved,
          contestsAttended: data.contests,
          currentRating: data.rating,
          maxRating: data.maxRating,
        },
      });

      // Small, fully-replaceable sets: delete + insert inside the transaction.
      await tx.codingRatingPoint.deleteMany({ where: { accountId } });
      if (ratingPoints.length) await tx.codingRatingPoint.createMany({ data: ratingPoints, skipDuplicates: true });

      await tx.codingTagStat.deleteMany({ where: { accountId } });
      if (tagTotals.size) {
        await tx.codingTagStat.createMany({
          data: [...tagTotals].map(([tag, solved]) => ({ accountId, tag, solved })),
        });
      }

      // Activity is only ever added/updated, never deleted, so history outlives the provider's window.
      if (activity.length) {
        const days = activity.map((a) => a.date);
        const counts = activity.map((a) => Math.round(a.count));
        await tx.$executeRaw`
          INSERT INTO "CodingActivityDay" ("accountId", "day", "count")
          SELECT ${accountId}, t.d, t.c
          FROM unnest(${days}::date[], ${counts}::int[]) AS t(d, c)
          ON CONFLICT ("accountId", "day") DO UPDATE SET "count" = EXCLUDED."count"`;
      }

      if (data.solvedKeys?.length) {
        const keys = data.solvedKeys.slice(0, SETTINGS.maxSolvedKeys);
        await tx.codingSolvedSet.upsert({
          where: { accountId },
          create: { accountId, keys },
          update: { keys },
        });
      }
    },
    { timeout: 30_000, maxWait: 10_000 }
  );
};

/* --------------------------------- the job --------------------------------- */

const run = async (account) => {
  let data;
  try {
    data = await providers[toKey(account.platform)].fetchProfile(account.handle);
  } catch (error) {
    await recordFailure(account, error);
    await bumpStudentVersion(account.studentId);
    return { ok: false };
  }

  try {
    await persist(account, data);
  } catch (error) {
    if (GONE.has(error.code)) return { skipped: "account was removed during sync" };
    throw error; // database problem: let the queue retry the job
  }

  await bumpStudentVersion(account.studentId);
  return { ok: true };
};

/** Syncs one linked account: fetch from the platform, store in Postgres, invalidate caches. */
export const syncAccount = async (accountId) => {
  const account = await prisma.codingAccount.findUnique({
    where: { id: accountId },
    select: { id: true, studentId: true, platform: true, handle: true, consecutiveFailures: true },
  });
  if (!account) return { skipped: "account no longer exists" };

  const result = await withLock(k("lock", "sync", accountId), SETTINGS.syncLockMs, () => run(account));
  return result.acquired ? result.value : { skipped: "already syncing" };
};