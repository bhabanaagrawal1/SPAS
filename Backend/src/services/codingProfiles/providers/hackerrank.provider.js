import { http, ProviderError } from "./http.js";
import { normalizeDay } from "../../../utils/codingProfiles/helpers.js";

// BEST EFFORT: uses the JSON endpoints the HackerRank website itself calls (not an official API).
const get = (handle, path) =>
  http
    .get(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(handle)}/${path}`, {
      headers: { Accept: "application/json" },
    })
    .then((res) => res.data);

export const fetchProfile = async (handle) => {
  let badges;
  try {
    badges = await get(handle, "badges");
  } catch (error) {
    if (error.response?.status === 404) {
      throw new ProviderError("NOT_FOUND", "HackerRank username not found.");
    }
    throw new ProviderError("UNAVAILABLE", "HackerRank is unavailable right now.");
  }

  const solved = (badges?.models ?? []).reduce((sum, b) => sum + (Number(b.solved) || 0), 0);

  let history = {};
  try {
    history = (await get(handle, "submission_histories")) ?? {};
  } catch {
    /* activity is optional */
  }

  const activity = Object.entries(history)
    .map(([date, count]) => ({ date: normalizeDay(date), count: Number(count) || 0 }))
    .filter((d) => d.date);

  return {
    handle,
    solved,
    contests: 0,
    rating: null,
    maxRating: null,
    ratingHistory: [],
    activity,
    topics: [],
    solvedKeys: [],
  };
};