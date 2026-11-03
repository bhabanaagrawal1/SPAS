import { prisma } from "../../config/coding.prisma.js";
import { SETTINGS } from "../../config/coding.settings.js";
import { CodingProfileError } from "../../utils/codingProfiles/errors.js";
import { PLATFORMS, PLATFORM_KEYS, HANDLE_PATTERN, toEnum, toKey } from "../../config/coding.platforms.js";
import { enqueueSync } from "./sync/codingSync.queue.js";
import { bumpStudentVersion } from "../../utils/codingProfiles/cache.js";
import { redis, k } from "../../config/coding.redis.js";

const ACCOUNT_SELECT = {
  id: true,
  platform: true,
  handle: true,
  syncStatus: true,
  lastSyncedAt: true,
  lastError: true,
  connectedAt: true,
};

const assertPlatform = (key) => {
  if (!PLATFORM_KEYS.includes(key)) {
    throw new CodingProfileError(400, `Unknown platform. Use one of: ${PLATFORM_KEYS.join(", ")}.`);
  }
};

const present = (account) => ({
  platform: toKey(account.platform),
  name: PLATFORMS[toKey(account.platform)].name,
  handle: account.handle,
  syncStatus: account.syncStatus.toLowerCase(),
  lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
  lastError: account.lastError,
});

const queueQuietly = async (accountId, priority) => {
  try {
    await enqueueSync(accountId, { priority });
  } catch (error) {
    // Not fatal: the row is saved with nextSyncAt = now, so the scheduler will queue it shortly.
    console.warn(`[coding] could not queue sync for ${accountId}: ${error.message}`);
  }
};

/**
 * Links (or changes) a handle. Returns immediately: the first sync runs in the background.
 * The student's dashboard shows syncing=true until it finishes.
 */
export const connectAccount = async (studentId, platformKey, rawHandle) => {
  assertPlatform(platformKey);

  const handle = String(rawHandle ?? "").trim();
  if (!HANDLE_PATTERN.test(handle)) {
    throw new CodingProfileError(400, "Enter a valid username (letters, numbers, . _ - only).");
  }

  const platform = toEnum(platformKey);
  const handleKey = handle.toLowerCase();

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const existing = await tx.codingAccount.findUnique({
        where: { studentId_platform: { studentId, platform } },
        select: { ...ACCOUNT_SELECT, handleKey: true },
      });

      // Same handle again: nothing to do.
      if (existing?.handleKey === handleKey) return { account: existing, created: false };

      // Different handle: drop the old account; its synced data is deleted with it (cascade),
      // because it described a different person's profile.
      if (existing) await tx.codingAccount.delete({ where: { id: existing.id } });

      const account = await tx.codingAccount.create({
        data: {
          studentId,
          platform,
          handle,
          handleKey,
          syncStatus: "PENDING",
          nextSyncAt: new Date(),
          syncRequestedAt: new Date(),
        },
        select: ACCOUNT_SELECT,
      });
      return { account, created: true };
    });
  } catch (error) {
    if (error.code === "P2002") {
      const target = [error.meta?.target].flat().join(",");
      throw new CodingProfileError(
        409,
        target.includes("handleKey")
          ? "This username is already linked to another student. Contact your teacher if this is your account."
          : "Your account was just updated. Please try again."
      );
    }
    throw error;
  }

  if (result.created) {
    await bumpStudentVersion(studentId);
    await queueQuietly(result.account.id, 1);
  }

  return present(result.account);
};

export const disconnectAccount = async (studentId, platformKey) => {
  assertPlatform(platformKey);

  const { count } = await prisma.codingAccount.deleteMany({
    where: { studentId, platform: toEnum(platformKey) },
  });
  if (!count) throw new CodingProfileError(404, "That platform is not connected.");

  await bumpStudentVersion(studentId);
};

const enforceCooldown = async (studentId) => {
  const key = k("cooldown", "sync", studentId);
  try {
    const ok = await redis.set(key, "1", "EX", SETTINGS.manualSyncCooldownSeconds, "NX");
    if (ok !== "OK") {
      const ttl = Math.max(1, await redis.ttl(key));
      throw new CodingProfileError(429, `You synced recently. Try again in ${Math.ceil(ttl / 60)} minute(s).`, {
        retryAfter: ttl,
      });
    }
  } catch (error) {
    if (error instanceof CodingProfileError) throw error;
    console.warn(`[coding] cooldown check skipped, Redis unavailable: ${error.message}`);
  }
};

/** "Sync now": queues a refresh for one platform or all linked platforms. */
export const requestSync = async (studentId, platformKey) => {
  if (platformKey) assertPlatform(platformKey);

  const accounts = await prisma.codingAccount.findMany({
    where: { studentId, ...(platformKey ? { platform: toEnum(platformKey) } : {}) },
    select: { id: true, platform: true },
  });
  if (!accounts.length) {
    throw new CodingProfileError(platformKey ? 404 : 400, platformKey ? "That platform is not connected." : "Connect at least one platform first.");
  }

  await enforceCooldown(studentId);

  await prisma.codingAccount.updateMany({
    where: { id: { in: accounts.map((a) => a.id) } },
    data: { syncRequestedAt: new Date() },
  });

  const results = await Promise.allSettled(accounts.map((a) => enqueueSync(a.id, { priority: 1 })));
  if (results.every((r) => r.status === "rejected")) {
    throw new CodingProfileError(503, "The sync service is unavailable right now. Please try again shortly.");
  }

  await bumpStudentVersion(studentId);
  return accounts.map((a, i) => ({ platform: toKey(a.platform), queued: results[i].status === "fulfilled" }));
};