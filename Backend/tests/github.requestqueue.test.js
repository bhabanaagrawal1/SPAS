import { jest, describe, it, expect, afterEach } from "@jest/globals";
import { createRequestQueue } from "../src/services/github/requestQueue.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

afterEach(() => jest.useRealTimers());

describe("createRequestQueue", () => {
  it("never runs more than `concurrency` tasks at once", async () => {
    const queue = createRequestQueue({ concurrency: 3, maxQueued: 100, maxWaitMs: 1000 });
    let active = 0;
    let peak = 0;

    await Promise.all(
      Array.from({ length: 10 }, () =>
        queue.enqueue(async () => {
          active++;
          peak = Math.max(peak, active);
          await sleep(5);
          active--;
        })
      )
    );
    expect(peak).toBe(3);
    expect(queue.getStatus()).toMatchObject({ activeRequests: 0, queuedRequests: 0 });
  });

  it("rejects with QUEUE_FULL when too many requests are waiting", async () => {
    const queue = createRequestQueue({ concurrency: 1, maxQueued: 1, maxWaitMs: 1000 });
    const running = queue.enqueue(() => sleep(20)); // occupies the only slot
    const waiting = queue.enqueue(() => "queued"); // fills the queue
    await expect(queue.enqueue(() => "overflow")).rejects.toMatchObject({ code: "QUEUE_FULL", status: 503 });
    await Promise.all([running, waiting]);
  });

  it("propagates task errors and keeps working", async () => {
    const queue = createRequestQueue({ concurrency: 1, maxQueued: 10, maxWaitMs: 1000 });
    await expect(queue.enqueue(async () => { throw new Error("x"); })).rejects.toThrow("x");
    await expect(queue.enqueue(async () => "ok")).resolves.toBe("ok");
  });

  it("fails fast when the rate-limit pause is longer than maxWaitMs", async () => {
    const queue = createRequestQueue({ concurrency: 2, maxQueued: 10, maxWaitMs: 1000 });
    queue.updateFromHeaders({ "retry-after": "60" });
    await expect(queue.enqueue(() => "never")).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
      retryAfter: expect.any(Number),
    });
  });

  it("waits out a short rate-limit pause, then runs the task", async () => {
    jest.useFakeTimers();
    const queue = createRequestQueue({ concurrency: 2, maxQueued: 10, maxWaitMs: 5000 });
    queue.updateFromHeaders({ "retry-after": "2" });

    const task = jest.fn(async () => "done");
    const promise = queue.enqueue(task);
    expect(task).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(2100);
    await expect(promise).resolves.toBe("done");
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("keeps the lowest 'remaining' value when responses arrive out of order", () => {
    const queue = createRequestQueue({ concurrency: 1, maxQueued: 1, maxWaitMs: 1000 });
    const reset = String(Math.floor(Date.now() / 1000) + 3600);
    queue.updateFromHeaders({ "x-ratelimit-remaining": "10", "x-ratelimit-reset": reset });
    queue.updateFromHeaders({ "x-ratelimit-remaining": "12", "x-ratelimit-reset": reset }); // older response
    expect(queue.getStatus().remaining).toBe(10);
  });
});