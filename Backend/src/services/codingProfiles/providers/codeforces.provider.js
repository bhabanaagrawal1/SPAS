import { http, ProviderError } from "./http.js";
import { dayKey, sleep } from "../../../utils/codingProfiles/helpers.js";

const BASE = "https://codeforces.com/api";
const MAX_SUBMISSIONS = 10_000; // most recent submissions we read

// Official public API. Codeforces asks for at most ~1 request per 2 seconds.
const call = async (method, params, retry = true) => {
  let data;

  try {
    ({ data } = await http.get(`${BASE}/${method}`, { params }));
  } catch (error) {
    data = error.response?.data;
    if (!data) throw new ProviderError("UNAVAILABLE", "Codeforces is unavailable right now.");
  }

  if (data?.status === "OK") return data.result;

  const comment = data?.comment ?? "";
  if (/not found/i.test(comment)) {
    throw new ProviderError("NOT_FOUND", "Codeforces handle not found.");
  }
  if (retry && /limit exceeded/i.test(comment)) {
    await sleep(2100);
    return call(method, params, false);
  }
  throw new ProviderError("UNAVAILABLE", "Codeforces is unavailable right now.");
};

export const fetchProfile = async (handle) => {
  const [info] = await call("user.info", { handles: handle });

  await sleep(300);
  const ratingChanges = await call("user.rating", { handle }).catch(() => []);

  await sleep(300);
  const submissions = await call("user.status", { handle, from: 1, count: MAX_SUBMISSIONS });

  const solved = new Map(); // "contestId-index" -> tags
  const activity = new Map(); // day -> submissions

  for (const s of submissions) {
    const day = dayKey(s.creationTimeSeconds * 1000);
    activity.set(day, (activity.get(day) ?? 0) + 1);

    if (s.verdict === "OK" && s.problem?.contestId !== undefined) {
      const key = `${s.problem.contestId}-${s.problem.index}`;
      if (!solved.has(key)) solved.set(key, s.problem.tags ?? []);
    }
  }

  const topics = new Map();
  for (const tags of solved.values()) {
    for (const tag of tags) topics.set(tag, (topics.get(tag) ?? 0) + 1);
  }

  return {
    handle: info.handle,
    solved: solved.size,
    contests: ratingChanges.length,
    rating: info.rating ?? null,
    maxRating: info.maxRating ?? null,
    ratingHistory: ratingChanges.map((c) => ({
      at: new Date(c.ratingUpdateTimeSeconds * 1000),
      rating: c.newRating,
      contest: c.contestName,
    })),
    activity: [...activity].map(([date, count]) => ({ date, count })),
    topics: [...topics].map(([tag, count]) => ({ tag, solved: count })),
    solvedKeys: [...solved.keys()],
  };
};

/** Every rated problem, used for recommendations. */
export const fetchProblemset = async () => {
  const result = await call("problemset.problems", {});
  const counts = new Map(
    result.problemStatistics.map((s) => [`${s.contestId}-${s.index}`, s.solvedCount])
  );

  return result.problems
    .filter((p) => p.rating && p.contestId)
    .map((p) => {
      const key = `${p.contestId}-${p.index}`;
      return {
        key,
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating,
        tags: p.tags ?? [],
        solvedCount: counts.get(key) ?? 0,
      };
    });
};