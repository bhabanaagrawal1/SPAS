import { http, ProviderError } from "./http.js";
import { dayKey, normalizeDay } from "../../../utils/codingProfiles/helpers.js";

// BEST EFFORT: GeeksforGeeks has no public API. This tries, in order, the JSON endpoints its own
// website uses, then falls back to reading the profile page. Each source may fail independently.
const AUTH_API = "https://authapi.geeksforgeeks.org/api-get/user-profile-info/";
const PRACTICE_API = "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/";

const attempt = async (task) => {
  try {
    return await task();
  } catch {
    return null;
  }
};

/** Finds a numeric field anywhere inside a (small) JSON response. */
const findNumber = (value, key, depth = 0) => {
  if (!value || typeof value !== "object" || depth > 4) return null;
  if (key in value) {
    const n = Number(value[key]);
    if (Number.isFinite(n)) return n;
  }
  for (const child of Object.values(value)) {
    const found = findNumber(child, key, depth + 1);
    if (found !== null) return found;
  }
  return null;
};

// 1) profile summary: total problems solved
const fromProfileApi = (handle) =>
  attempt(async () => {
    const { data } = await http.get(AUTH_API, {
      params: { handle, article_count: false },
      headers: { Accept: "application/json" },
    });
    return findNumber(data, "total_problems_solved");
  });

// 2) submissions list: its `count` is the number of solved problems
const fromSubmissionsApi = (handle) =>
  attempt(async () => {
    const { data } = await http.post(PRACTICE_API, { handle, requestType: "", year: "", month: "" });
    const count = Number(data?.count);
    return Number.isFinite(count) ? count : null;
  });

// 3) per-day activity for one calendar year: { "2026-01-05": 3, ... }
const fromYearApi = (handle, year) =>
  attempt(async () => {
    const { data } = await http.post(PRACTICE_API, {
      handle,
      requestType: "getYearwiseUserSubmissions",
      year: String(year),
      month: "",
    });
    return data?.result && typeof data.result === "object" ? data.result : null;
  });

// 4) last resort: the profile page embeds its data as JSON in <script id="__NEXT_DATA__">
const fromPage = async (handle) => {
  for (const path of ["profile", "user"]) {
    const page = await attempt(async () => {
      const { data: html } = await http.get(
        `https://www.geeksforgeeks.org/${path}/${encodeURIComponent(handle)}/`,
        { responseType: "text" }
      );
      const raw = String(html).match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)?.[1];
      const props = JSON.parse(raw).props.pageProps ?? {};
      const solved = findNumber(props.userInfo, "total_problems_solved");

      const activity = [];
      for (const group of Object.values(props.userSubmissionsInfo ?? {})) {
        if (!group || typeof group !== "object") continue;
        for (const entry of Object.values(group)) {
          const when = entry?.user_subtime ? Date.parse(`${String(entry.user_subtime).replace(" ", "T")}Z`) : NaN;
          if (!Number.isNaN(when)) activity.push(dayKey(when));
        }
      }
      return solved === null ? null : { solved, activity };
    });
    if (page) return page;
  }
  return null;
};

export const fetchProfile = async (handle) => {
  const year = new Date().getUTCFullYear();

  const [profileSolved, submissionCount, thisYear, lastYear] = await Promise.all([
    fromProfileApi(handle),
    fromSubmissionsApi(handle),
    fromYearApi(handle, year),
    fromYearApi(handle, year - 1),
  ]);

  let solved = profileSolved ?? submissionCount;
  let page = null;
  if (solved === null) {
    page = await fromPage(handle);
    solved = page?.solved ?? null;
  }

  if (solved === null) {
    throw new ProviderError(
      "UNAVAILABLE",
      "Could not read this GeeksforGeeks profile right now. Check the username, or try again later."
    );
  }

  const activity = new Map();
  for (const result of [lastYear, thisYear]) {
    for (const [date, count] of Object.entries(result ?? {})) {
      const day = normalizeDay(date);
      if (day && Number(count) > 0) activity.set(day, Number(count));
    }
  }
  for (const day of page?.activity ?? []) activity.set(day, (activity.get(day) ?? 0) + 1);

  return {
    handle,
    solved,
    contests: 0,
    rating: null,
    maxRating: null,
    ratingHistory: [],
    activity: [...activity].map(([date, count]) => ({ date, count })),
    topics: [],
    solvedKeys: [],
  };
};