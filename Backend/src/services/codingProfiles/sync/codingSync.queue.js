import { Queue } from "bullmq";
import { createQueueConnection } from "../../../config/coding.redis.js";
import { SETTINGS } from "../../../config/coding.settings.js";

export const QUEUE_NAME = "coding-sync";
export const queuePrefix = () => `${SETTINGS.namespace}:bull`;

let queue = null;

const getQueue = () => {
  queue ??= new Queue(QUEUE_NAME, {
    connection: createQueueConnection(),
    prefix: queuePrefix(),
    defaultJobOptions: {
      // Platform problems are handled inside the job (backoff is stored in Postgres).
      // These attempts only cover infrastructure blips (database, Redis).
      attempts: 3,
      backoff: { type: "exponential", delay: 30_000 },
      // Removed immediately so the same jobId can be queued again later (jobId = dedupe key).
      removeOnComplete: true,
      removeOnFail: true,
    },
  });
  return queue;
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Queue timed out")), ms)),
  ]);

/**
 * Queues a sync. jobId makes it idempotent: while a job for this account is waiting or running,
 * adding it again does nothing. Lower priority number = runs sooner (1 = user action, 10 = scheduled).
 */
export const enqueueSync = (accountId, { priority = 10 } = {}) =>
  withTimeout(getQueue().add("sync", { accountId }, { jobId: `sync_${accountId}`, priority }), 3_000);

export const closeQueue = async () => {
  if (queue) {
    await queue.close();
    queue = null;
  }
};