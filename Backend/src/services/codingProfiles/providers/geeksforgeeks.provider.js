import { http, ProviderError } from "./http.js";
import { dayKey } from "../../../utils/codingProfiles/helpers.js";

// BEST EFFORT: GeeksforGeeks has no public API. Its profile page is a Next.js app that embeds
// the profile as JSON in a <script id="__NEXT_DATA__"> tag, which is what this reads.
export const fetchProfile = async (handle) => {
  let html;
  try {
    ({ data: html } = await http.get(
      `https://www.geeksforgeeks.org/profile/${encodeURIComponent(handle)}`,
      { responseType: "text" }
    ));
  } catch (error) {
    if (error.response?.status === 404) {
      throw new ProviderError("NOT_FOUND", "GeeksforGeeks username not found.");
    }
    throw new ProviderError("UNAVAILABLE", "GeeksforGeeks is unavailable right now.");
  }

  const raw = String(html).match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)?.[1];
  let pageProps = {};
  try {
    pageProps = JSON.parse(raw).props.pageProps ?? {};
  } catch {
    /* page layout changed or blocked */
  }

  let solved = Number(pageProps.userInfo?.total_problems_solved) || 0;

  // Submissions are grouped by difficulty. Dates are read only if present.
  const activity = new Map();
  let counted = 0;
  for (const group of Object.values(pageProps.userSubmissionsInfo ?? {})) {
    if (!group || typeof group !== "object") continue;
    for (const entry of Object.values(group)) {
      counted += 1;
      const when = entry?.user_subtime
        ? Date.parse(`${String(entry.user_subtime).replace(" ", "T")}Z`)
        : NaN;
      if (!Number.isNaN(when)) {
        const day = dayKey(when);
        activity.set(day, (activity.get(day) ?? 0) + 1);
      }
    }
  }
  if (!solved) solved = counted;

  if (!raw || (!solved && !pageProps.userInfo)) {
    throw new ProviderError("NOT_FOUND", "Could not read this GeeksforGeeks profile. Check the username.");
  }

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