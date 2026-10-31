import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const get = jest.fn();
const post = jest.fn();
jest.unstable_mockModule("axios", () => ({ default: { create: () => ({ get, post }) } }));
jest.unstable_mockModule("../src/config/config.js", () => ({ default: {} }));

const { getGitHubContributions, getGitHubMonthlyActivity, setCache, MemoryCache } = await import(
  "../src/services/github.service.js"
);
const { calculateStreaks, buildMonthRanges, buildYearRange, mapContributionCalendar } = await import(
  "../src/services/github/mappers.js"
);

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  setCache(new MemoryCache());
});

const day = (date, count) => ({ date, count });

describe("calculateStreaks", () => {
  it("finds the longest run and the current run", () => {
    const days = [day("2026-01-01", 1), day("2026-01-02", 2), day("2026-01-03", 0), day("2026-01-04", 1), day("2026-01-05", 1)];
    expect(calculateStreaks(days, "2026-01-05")).toEqual({ current: 2, longest: 2 });
  });

  it("does not break the streak when today has no contributions yet", () => {
    const days = [day("2026-01-01", 3), day("2026-01-02", 1), day("2026-01-03", 0)];
    expect(calculateStreaks(days, "2026-01-03")).toEqual({ current: 2, longest: 2 });
  });

  it("breaks the streak when a PAST day is empty", () => {
    const days = [day("2026-01-01", 3), day("2026-01-02", 0), day("2026-01-03", 1)];
    expect(calculateStreaks(days, "2026-01-04")).toEqual({ current: 1, longest: 1 });
  });

  it("ignores future days", () => {
    const days = [day("2026-01-01", 1), day("2026-01-02", 1), day("2026-01-09", 0)];
    expect(calculateStreaks(days, "2026-01-02")).toEqual({ current: 2, longest: 2 });
  });

  it("handles no data", () => {
    expect(calculateStreaks([], "2026-01-01")).toEqual({ current: 0, longest: 0 });
  });
});

describe("date ranges", () => {
  it("builds the last N calendar months, oldest first", () => {
    const ranges = buildMonthRanges(3, new Date("2026-03-15T10:00:00Z"));
    expect(ranges.map((r) => r.key)).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(ranges[0]).toMatchObject({ from: "2026-01-01T00:00:00.000Z", to: "2026-01-31T23:59:59.000Z" });
    expect(ranges[2].to).toBe("2026-03-15T10:00:00.000Z"); // current month ends "now"
  });

  it("rolls over the year boundary", () => {
    const keys = buildMonthRanges(3, new Date("2026-01-10T00:00:00Z")).map((r) => r.key);
    expect(keys).toEqual(["2025-11", "2025-12", "2026-01"]);
  });

  it("ends a past year on Dec 31 and the current year now", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(buildYearRange(2025, now).to).toBe("2025-12-31T23:59:59Z");
    expect(buildYearRange(2026, now).to).toBe("2026-06-01T00:00:00.000Z");
  });
});

describe("getGitHubContributions", () => {
  const calendarResponse = {
    data: {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: 5,
              weeks: [
                {
                  contributionDays: [
                    { date: "2025-01-01", contributionCount: 2, contributionLevel: "SECOND_QUARTILE" },
                    { date: "2025-01-02", contributionCount: 3, contributionLevel: "FOURTH_QUARTILE" },
                    { date: "2025-01-03", contributionCount: 0, contributionLevel: "NONE" },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    headers: {},
  };

  it("maps the calendar, levels and streaks", async () => {
    post.mockResolvedValue(calendarResponse);

    const result = await getGitHubContributions("octocat", 2025);

    expect(result).toEqual({
      year: 2025,
      total: 5,
      streaks: { current: 0, longest: 2 },
      days: [
        { date: "2025-01-01", count: 2, level: 2 },
        { date: "2025-01-02", count: 3, level: 4 },
        { date: "2025-01-03", count: 0, level: 0 },
      ],
    });
    expect(post.mock.calls[0][0]).toBe("/graphql");
    expect(post.mock.calls[0][1].variables).toMatchObject({ login: "octocat", from: "2025-01-01T00:00:00Z" });
  });

  it("rejects invalid years without calling GitHub", async () => {
    await expect(getGitHubContributions("octocat", 1999)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(getGitHubContributions("octocat", "abc")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(getGitHubContributions("octocat", 2999)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(post).not.toHaveBeenCalled();
  });

  it("maps a GraphQL NOT_FOUND error (HTTP 200) to NOT_FOUND", async () => {
    post.mockResolvedValue({ data: { data: { user: null }, errors: [{ type: "NOT_FOUND", message: "x" }] }, headers: {} });
    await expect(getGitHubContributions("ghost", 2025)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });

  it("treats a null user without errors as NOT_FOUND", async () => {
    post.mockResolvedValue({ data: { data: { user: null } }, headers: {} });
    await expect(getGitHubContributions("ghost", 2025)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("maps a missing/invalid token (HTTP 401) to INVALID_TOKEN", async () => {
    post.mockRejectedValue({ response: { status: 401, headers: {} } });
    await expect(getGitHubContributions("octocat", 2025)).rejects.toMatchObject({ code: "INVALID_TOKEN" });
  });

  it("caches per user and year", async () => {
    post.mockResolvedValue(calendarResponse);
    await getGitHubContributions("octocat", 2025);
    await getGitHubContributions("OctoCat", 2025);
    expect(post).toHaveBeenCalledTimes(1);
    await getGitHubContributions("octocat", 2024);
    expect(post).toHaveBeenCalledTimes(2);
  });
});

describe("getGitHubMonthlyActivity", () => {
  it("returns six months with one GraphQL request", async () => {
    const user = Object.fromEntries(
      Array.from({ length: 6 }, (_, i) => [
        `m${i}`,
        { totalCommitContributions: i + 1, totalPullRequestContributions: i, totalIssueContributions: 2 },
      ])
    );
    post.mockResolvedValue({ data: { data: { user } }, headers: {} });

    const result = await getGitHubMonthlyActivity("octocat");

    expect(post).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(6);
    expect(result[0]).toMatchObject({ commits: 1, pullRequests: 0, issues: 2 });
    expect(result[5]).toMatchObject({ commits: 6, pullRequests: 5, issues: 2 });
    expect(result[5].month).toBe(new Date().toISOString().slice(0, 7)); // newest month = current month
  });
});

describe("mapContributionCalendar", () => {
  it("falls back to level 0 for unknown levels", () => {
    const { days } = mapContributionCalendar({
      totalContributions: 1,
      weeks: [{ contributionDays: [{ date: "2025-01-01", contributionCount: 1, contributionLevel: "WEIRD" }] }],
    });
    expect(days[0].level).toBe(0);
  });
});