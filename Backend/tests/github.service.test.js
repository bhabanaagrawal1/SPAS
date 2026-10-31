// Run with: npm test
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// ESM mocking in Jest: register mocks FIRST, then import the code that uses them.
// This keeps tests away from real HTTP requests and real secrets.
const get = jest.fn();
jest.unstable_mockModule("axios", () => ({ default: { create: () => ({ get }) } }));
jest.unstable_mockModule("../src/config/config.js", () => ({ default: {} }));

const {
  getGitHubProfile,
  getGitHubRepositories,
  getGitHubLanguages,
  getGitHubCommits,
  getGitHubIssues,
  setCache,
  MemoryCache,
  toGitHubError,
  validateUsername,
  validateRepository,
  mapWithConcurrency,
} = await import("../src/services/github.service.js");
const { calculateLanguageDistribution } = await import("../src/services/github/mappers.js");

beforeEach(() => {
  get.mockReset();
  setCache(new MemoryCache()); // fresh cache for every test
});

describe("validation", () => {
  it("accepts valid names", () => {
    expect(validateUsername("octocat")).toBe("octocat");
    expect(validateRepository("my_repo.js")).toBe("my_repo.js");
  });

  it.each(["", "-bad", "bad-", "a--b", "has space", "../etc", "x".repeat(40), null, 42])(
    "rejects username %p",
    (value) => expect(() => validateUsername(value)).toThrow(/Invalid GitHub username/)
  );

  it.each(["..", ".", "a/b", ""])("rejects repository %p", (value) =>
    expect(() => validateRepository(value)).toThrow(/Invalid repository name/)
  );
});

describe("toGitHubError", () => {
  const make = (status, headers = {}, code) => ({ response: status ? { status, headers } : undefined, code });

  it("maps common statuses", () => {
    expect(toGitHubError(make(404)).code).toBe("NOT_FOUND");
    expect(toGitHubError(make(409)).code).toBe("EMPTY_REPOSITORY");
    expect(toGitHubError(make(401)).code).toBe("INVALID_TOKEN");
    expect(toGitHubError(make(503)).code).toBe("UPSTREAM_ERROR");
  });

  it("tells a rate-limit 403 from a permission 403", () => {
    const limited = toGitHubError(
      make(403, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1700000000" })
    );
    expect(limited.code).toBe("RATE_LIMITED");
    expect(limited.resetAt).toBeInstanceOf(Date);
    expect(limited.retryAfter).toBeGreaterThanOrEqual(0);

    expect(toGitHubError(make(403, { "x-ratelimit-remaining": "42" })).code).toBe("FORBIDDEN");
  });

  it("reads Retry-After", () => {
    const error = toGitHubError(make(403, { "retry-after": "30" }));
    expect(error).toMatchObject({ code: "RATE_LIMITED", retryAfter: 30, status: 429 });
  });

  it("maps timeouts and network failures", () => {
    expect(toGitHubError(make(null, {}, "ECONNABORTED")).code).toBe("TIMEOUT");
    expect(toGitHubError(make(null, {}, "ENOTFOUND")).code).toBe("NETWORK_ERROR");
  });
});

describe("mapWithConcurrency", () => {
  it("respects the limit and keeps order", async () => {
    let active = 0;
    let peak = 0;
    const result = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (n) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return n * 2;
    });
    expect(result).toEqual([2, 4, 6, 8, 10, 12]);
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("stops starting new items after a failure", async () => {
    const started = [];
    await expect(
      mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8], 2, async (n) => {
        started.push(n);
        await new Promise((r) => setTimeout(r, 5));
        if (n === 1) throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    expect(started.length).toBeLessThan(8);
  });

  it("rejects an invalid limit", async () => {
    await expect(mapWithConcurrency([1], 0, async () => {})).rejects.toThrow(RangeError);
  });
});

describe("calculateLanguageDistribution", () => {
  it("sums bytes, computes percentages and sorts", () => {
    expect(calculateLanguageDistribution([{ JavaScript: 750, CSS: 100 }, { CSS: 150 }, {}])).toEqual([
      { language: "JavaScript", bytes: 750, percentage: 75 },
      { language: "CSS", bytes: 250, percentage: 25 },
    ]);
  });

  it("returns an empty list when there is no data", () => {
    expect(calculateLanguageDistribution([{}, {}])).toEqual([]);
  });
});

describe("getGitHubProfile", () => {
  it("rejects invalid input without calling GitHub", async () => {
    await expect(getGitHubProfile("../admin")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(get).not.toHaveBeenCalled();
  });

  it("caches, and treats usernames case-insensitively", async () => {
    get.mockResolvedValue({ data: { login: "octocat" } });
    await getGitHubProfile("octocat");
    await getGitHubProfile("OctoCat");
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("shares one request between simultaneous callers", async () => {
    get.mockResolvedValue({ data: { login: "octocat" } });
    await Promise.all([getGitHubProfile("octocat"), getGitHubProfile("octocat"), getGitHubProfile("octocat")]);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("surfaces typed errors", async () => {
    get.mockRejectedValue({ response: { status: 404, headers: {} } });
    await expect(getGitHubProfile("ghost")).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });
});

describe("pagination", () => {
  const page = (n, count) => Array.from({ length: count }, (_, i) => ({ id: n * 1000 + i, name: `r${n}-${i}` }));

  it("keeps fetching until a short page arrives", async () => {
    get
      .mockResolvedValueOnce({ data: page(1, 100) })
      .mockResolvedValueOnce({ data: page(2, 100) })
      .mockResolvedValueOnce({ data: page(3, 17) });

    expect(await getGitHubRepositories("octocat")).toHaveLength(217);
    expect(get).toHaveBeenCalledTimes(3);
    expect(get.mock.calls[1][1].params.page).toBe(2);
  });
});

describe("getGitHubLanguages", () => {
  it("skips forks, aggregates bytes and ignores a vanished repository", async () => {
    get.mockImplementation(async (url) => {
      if (url === "/users/octocat/repos") {
        return { data: [{ name: "a", fork: false }, { name: "b", fork: false }, { name: "forked", fork: true }] };
      }
      if (url.endsWith("/a/languages")) return { data: { JavaScript: 750, CSS: 250 } };
      if (url.endsWith("/b/languages")) throw { response: { status: 404, headers: {} } };
      throw new Error(`unexpected ${url}`);
    });

    expect(await getGitHubLanguages("octocat")).toEqual([
      { language: "JavaScript", bytes: 750, percentage: 75 },
      { language: "CSS", bytes: 250, percentage: 25 },
    ]);
  });

  it("reports errors that are NOT 'repository missing'", async () => {
    get.mockImplementation(async (url) => {
      if (url === "/users/octocat/repos") return { data: [{ name: "a", fork: false }] };
      throw { response: { status: 500, headers: {} } };
    });
    await expect(getGitHubLanguages("octocat")).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
  });
});

describe("repository endpoints", () => {
  it("returns [] for an empty repository", async () => {
    get.mockRejectedValue({ response: { status: 409, headers: {} } });
    await expect(getGitHubCommits("octocat", "empty")).resolves.toEqual([]);
  });

  it("filters pull requests out of issues", async () => {
    get.mockResolvedValue({
      data: [
        { id: 1, number: 1, title: "bug", state: "open" },
        { id: 2, number: 2, title: "a PR", state: "open", pull_request: {} },
      ],
    });
    const issues = await getGitHubIssues("octocat", "repo");
    expect(issues.map((i) => i.number)).toEqual([1]);
  });
});