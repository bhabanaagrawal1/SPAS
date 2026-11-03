import { http, ProviderError } from "./http.js";
import { normalizeDay } from "../../../utils/codingProfiles/helpers.js";

// BEST EFFORT: CodeChef has no public API, so this reads the profile page HTML.
// If CodeChef changes its page, the regexes below are what to update.
const grab = (html, pattern) => html.match(pattern)?.[1];

const parseJson = (html, pattern) => {
  const raw = grab(html, pattern);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const fetchProfile = async (handle) => {
  let html;
  try {
    ({ data: html } = await http.get(
      `https://www.codechef.com/users/${encodeURIComponent(handle)}`,
      { responseType: "text" }
    ));
  } catch (error) {
    if (error.response?.status === 404) {
      throw new ProviderError("NOT_FOUND", "CodeChef username not found.");
    }
    throw new ProviderError("UNAVAILABLE", "CodeChef is unavailable right now.");
  }

  html = String(html);

  const rating = Number(grab(html, /class="rating-number"[^>]*>\s*(\d+)/i)) || null;
  const highest = Number(grab(html, /Highest Rating\s*(?:<[^>]*>\s*)*(\d+)/i)) || null;
  const solved = Number(grab(html, /Total Problems Solved:\s*(?:<[^>]*>\s*)*(\d+)/i)) || 0;

  const history = (parseJson(html, /var all_rating\s*=\s*(\[.*?\])\s*;/s) ?? [])
    .map((h) => ({
      at: new Date(`${String(h.end_date).replace(" ", "T")}Z`),
      rating: Number(h.rating),
      contest: h.name,
    }))
    .filter((h) => !Number.isNaN(h.at.getTime()) && Number.isFinite(h.rating))
    .sort((a, b) => a.at - b.at);

  const activity = (parseJson(html, /userDailySubmissionsStats\s*=\s*(\[.*?\])\s*;/s) ?? [])
    .map((d) => ({ date: normalizeDay(d.date), count: Number(d.value) || 0 }))
    .filter((d) => d.date);

  if (!rating && !solved && history.length === 0 && activity.length === 0) {
    throw new ProviderError("NOT_FOUND", "Could not read this CodeChef profile. Check the username.");
  }

  return {
    handle,
    solved,
    contests: history.length,
    rating,
    maxRating: highest ?? (history.length ? Math.max(...history.map((h) => h.rating)) : null),
    ratingHistory: history,
    activity,
    topics: [],
    solvedKeys: [],
  };
};