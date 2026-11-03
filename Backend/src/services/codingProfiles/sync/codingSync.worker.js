import { Worker } from "bullmq";
import { prisma } from "../../../config/coding.prisma.js";
import { SETTINGS } from "../../../config/coding.settings.js";
import { redis, k, createQueueConnection, closeRedis } from "../../../config/coding.redis.js";
import { QUEUE_NAME, queuePrefix, enqueueSync, closeQueue } from "./codingSync.queue.js";
import { syncAccount } from "./codingSync.service.js";

/*
 * The database is the source of truth for "what needs syncing" (nextSyncAt). The queue only
 * delivers the work. So if Redis is flushed and jobs are lost, the next scheduler tick finds the
 * same accounts in Postgres and queues them again.
 */

const maybeCleanup = async () => {
  const gate = await redis.set(k("scheduler", "cleanup"), "1", "EX", 86_400, "NX").catch(() => null);
  if (gate !== "OK") return;

  const cutoff = new Date(Date.now() - SETTINGS.activityRetentionDays * 86_400_000);
  const { count } = await prisma.codingActivityDay.deleteMany({ where: { day: { lt: cutoff } } });
  if (count) console.log(`[coding-sync] removed ${count} activity rows older than ${SETTINGS.activityRetentionDays} days`);
};

const tick = async () => {
  // Several worker processes may each run this loop; the gate lets only one act per window.
  try {
    const gate = await redis.set(
      k("scheduler", "tick"),
      "1",
      "PX",
      Math.max(1_000, SETTINGS.schedulerEveryMs - 2_000),
      "NX"
    );
    if (gate !== "OK") return;
  } catch {
    return; // Redis blip: try again next tick
  }

  const due = await prisma.codingAccount.findMany({
    where: { nextSyncAt: { lte: new Date() } },
    orderBy: { nextSyncAt: "asc" },
    take: SETTINGS.schedulerBatchSize,
    select: { id: true },
  });

  const results = await Promise.allSettled(due.map((a) => enqueueSync(a.id, { priority: 10 })));
  const failed = results.filter((r) => r.status === "rejected").length;
  if (due.length) console.log(`[coding-sync] ${due.length} account(s) due, ${failed} could not be queued`);

  await maybeCleanup();
};

/** Starts the queue worker and the scheduler in this process. Returns { stop }. */
export const startCodingSync = () => {
  const worker = new Worker(QUEUE_NAME, (job) => syncAccount(job.data.accountId), {
    connection: createQueueConnection(),
    prefix: queuePrefix(),
    concurrency: SETTINGS.workerConcurrency,
    lockDuration: 60_000,
  });
  worker.on("failed", (job, error) => console.error(`[coding-sync] job ${job?.id} failed:`, error.message));
  worker.on("error", (error) => console.error("[coding-sync] worker error:", error.message));

  const run = () => tick().catch((error) => console.error("[coding-sync] scheduler tick failed:", error));
  run();
  const timer = setInterval(run, SETTINGS.schedulerEveryMs);

  console.log(`[coding-sync] worker started (concurrency ${SETTINGS.workerConcurrency})`);

  return {
    stop: async () => {
      clearInterval(timer);
      await worker.close(); // waits for running jobs to finish
      await closeQueue();
      await closeRedis();
      await prisma.$disconnect();
    },
  };
};