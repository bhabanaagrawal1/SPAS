/**
 * Runs `worker` over `items` with at most `limit` running at once.
 * Results keep the original order. After the first failure no NEW items
 * are started, so a rate limit does not trigger dozens of wasted requests.
 */
export const mapWithConcurrency = async (items, limit, worker) => {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("Concurrency limit must be a positive integer");
  }

  const results = new Array(items.length);
  let nextIndex = 0;
  let failed = false;

  const runner = async () => {
    while (!failed && nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
};