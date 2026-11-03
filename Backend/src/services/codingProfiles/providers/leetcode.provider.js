import { http, ProviderError } from "./http.js";
import { dayKey } from "../../../utils/codingProfiles/helpers.js";

// LeetCode has no official API; this uses the same GraphQL endpoint its website uses.
const ENDPOINT = "https://leetcode.com/graphql";

const PROFILE_QUERY = `
query userData($username: String!, $thisYear: Int, $lastYear: Int) {
  matchedUser(username: $username) {
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
    thisYear: userCalendar(year: $thisYear) { submissionCalendar }
    lastYear: userCalendar(year: $lastYear) { submissionCalendar }
  }
  userContestRanking(username: $username) { attendedContestsCount rating }
  userContestRankingHistory(username: $username) {
    attended
    rating
    contest { title startTime }
  }
}`;

const PROBLEMS_QUERY = `
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
    questions: data { title titleSlug difficulty acRate paidOnly }
  }
}`;

const post = async (query, variables) => {
  try {
    const { data } = await http.post(
      ENDPOINT,
      { query, variables },
      { headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" } }
    );
    return data;
  } catch (error) {
    // Missing users can come back as an error status that still carries a JSON body.
    if (error.response?.data?.errors) return error.response.data;
    throw new ProviderError("UNAVAILABLE", "LeetCode is unavailable right now.");
  }
};

export const fetchProfile = async (handle) => {
  const year = new Date().getUTCFullYear();
  const body = await post(PROFILE_QUERY, { username: handle, thisYear: year, lastYear: year - 1 });

  const user = body?.data?.matchedUser;
  if (!user) {
    throw body?.data
      ? new ProviderError("NOT_FOUND", "LeetCode username not found.")
      : new ProviderError("UNAVAILABLE", "LeetCode is unavailable right now.");
  }

  // Activity: two calendar years cover any rolling 364-day window.
  const activity = new Map();
  for (const calendar of [user.lastYear, user.thisYear]) {
    let parsed = {};
    try {
      parsed = JSON.parse(calendar?.submissionCalendar ?? "{}");
    } catch {
      /* ignore a malformed calendar */
    }
    for (const [seconds, count] of Object.entries(parsed)) {
      const day = dayKey(Number(seconds) * 1000);
      activity.set(day, (activity.get(day) ?? 0) + Number(count));
    }
  }

  const history = (body.data.userContestRankingHistory ?? [])
    .filter((h) => h?.attended && h.contest)
    .map((h) => ({
      at: new Date(h.contest.startTime * 1000),
      rating: Math.round(h.rating),
      contest: h.contest.title,
    }))
    .sort((a, b) => a.at - b.at);

  const ranking = body.data.userContestRanking;
  const buckets = user.tagProblemCounts ?? {};

  return {
    handle,
    solved: user.submitStatsGlobal?.acSubmissionNum?.find((x) => x.difficulty === "All")?.count ?? 0,
    contests: ranking?.attendedContestsCount ?? history.length,
    rating: ranking?.rating ? Math.round(ranking.rating) : (history.at(-1)?.rating ?? null),
    maxRating: history.length ? Math.max(...history.map((h) => h.rating)) : null,
    ratingHistory: history,
    activity: [...activity].map(([date, count]) => ({ date, count })),
    topics: [
      ...(buckets.fundamental ?? []),
      ...(buckets.intermediate ?? []),
      ...(buckets.advanced ?? []),
    ].map((t) => ({ tag: t.tagName, solved: t.problemsSolved })),
    solvedKeys: [],
  };
};

/** Free problems for one topic + difficulty, used for recommendations. */
export const fetchProblemsByTag = async ({ tagSlug, difficulty, limit = 30 }) => {
  const body = await post(PROBLEMS_QUERY, {
    categorySlug: "",
    limit,
    skip: 0,
    filters: { tags: [tagSlug], difficulty: difficulty.toUpperCase() },
  });

  return (body?.data?.problemsetQuestionList?.questions ?? [])
    .filter((q) => !q.paidOnly)
    .map((q) => ({ title: q.title, slug: q.titleSlug, difficulty: q.difficulty, acRate: q.acRate }));
};