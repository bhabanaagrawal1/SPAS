// End-to-end HTTP tests: request -> auth -> route -> controller -> service (GitHub itself is mocked).
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";

const get = jest.fn();
jest.unstable_mockModule("axios", () => ({ default: { create: () => ({ get }) } }));
jest.unstable_mockModule("../src/config/config.js", () => ({ default: {} }));

// The real ApiError and errorHandler are used, so 401/403 responses look exactly like production.
const { ApiError } = await import("../src/utils/3.catchAsync.js");
const { errorHandler } = await import("../src/middleware/14.errorHandler.js");

// Fake login: tests change `currentUser` to simulate a student, an admin, or nobody (null).
// The real authenticate() is JWT-based and is better covered by your auth tests.
let currentUser;
jest.unstable_mockModule("../src/middleware/11.authenticate.js", () => ({
  authenticate: (req, res, next) => {
    if (!currentUser) return next(new ApiError(401, "Authentication required"));
    req.user = currentUser;
    next();
  },
}));

const { default: githubRoutes } = await import("../src/routes/github.routes.js");
const { setCache, MemoryCache } = await import("../src/services/github.service.js");

const STUDENT = { id: 1, email: "student@example.com", role: "STUDENT" };
const ADMIN = { id: 2, email: "admin@example.com", role: "ADMIN" }; // must match ADMIN_ROLE in the routes file

const app = express();
app.use("/api/github", githubRoutes);
app.use(errorHandler); // same position as in app.js: after the routes

beforeEach(() => {
  get.mockReset();
  setCache(new MemoryCache());
  currentUser = STUDENT;
});

describe("authentication and authorization", () => {
  it("returns 401 and never calls GitHub when the user is not logged in", async () => {
    currentUser = null;

    const res = await request(app).get("/api/github/octocat/profile");

    expect(res.status).toBe(401);
    expect(get).not.toHaveBeenCalled();
  });

  it("returns 403 on /rate-limit for a non-admin", async () => {
    const res = await request(app).get("/api/github/rate-limit");

    expect(res.status).toBe(403);
  });

  it("returns 401 on /rate-limit when not logged in", async () => {
    currentUser = null;

    const res = await request(app).get("/api/github/rate-limit");

    expect(res.status).toBe(401);
  });

  it("returns queue and rate-limit status to an admin", async () => {
    currentUser = ADMIN;

    const res = await request(app).get("/api/github/rate-limit");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("activeRequests");
    expect(res.body.data).toHaveProperty("queuedRequests");
  });
});

describe("GET /api/github/:username/profile", () => {
  it("returns 200 with the success envelope", async () => {
    get.mockResolvedValue({ data: { login: "octocat", followers: 3 } });

    const res = await request(app).get("/api/github/octocat/profile");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { username: "octocat", followers: 3 } });
  });

  it("returns 400 for an invalid username without calling GitHub", async () => {
    const res = await request(app).get("/api/github/-bad/profile");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, error: { code: "INVALID_INPUT" } });
    expect(get).not.toHaveBeenCalled();
  });

  it("returns 404 when the user does not exist", async () => {
    get.mockRejectedValue({ response: { status: 404, headers: {} } });

    const res = await request(app).get("/api/github/ghost/profile");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 429 when GitHub rate-limits us", async () => {
    // No Retry-After header on purpose: a real one would pause the shared request
    // queue and slow down the tests that run after this one.
    get.mockRejectedValue({ response: { status: 429, headers: {} } });

    const res = await request(app).get("/api/github/octocat/profile");

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });

  it("hides token problems from the client", async () => {
    get.mockRejectedValue({ response: { status: 401, headers: {} } });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app).get("/api/github/octocat/profile");

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("GITHUB_UNAVAILABLE");
    expect(JSON.stringify(res.body)).not.toMatch(/token/i);
    spy.mockRestore();
  });
});

describe("repository routes", () => {
  it("GET commits returns mapped commits", async () => {
    get.mockResolvedValue({
      data: [{ sha: "abc123", html_url: "u", commit: { message: "init", author: { name: "Ann", date: "2026-01-01" } } }],
    });

    const res = await request(app).get("/api/github/octocat/repositories/my-repo/commits");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { sha: "abc123", message: "init", author: "Ann", date: "2026-01-01", url: "u" },
    ]);
  });

  it("GET commits returns an empty list for an empty repository", async () => {
    get.mockRejectedValue({ response: { status: 409, headers: {} } });

    const res = await request(app).get("/api/github/octocat/repositories/empty/commits");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("GET issues excludes pull requests", async () => {
    get.mockResolvedValue({
      data: [
        { id: 1, number: 1, title: "bug", state: "open" },
        { id: 2, number: 2, title: "a PR", state: "open", pull_request: {} },
      ],
    });

    const res = await request(app).get("/api/github/octocat/repositories/repo/issues");

    expect(res.body.data.map((i) => i.number)).toEqual([1]);
  });

  it("GET pull-requests works", async () => {
    get.mockResolvedValue({ data: [{ id: 9, number: 4, title: "feat", state: "closed", merged_at: "2026-01-02" }] });

    const res = await request(app).get("/api/github/octocat/repositories/repo/pull-requests");

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ number: 4, merged: true });
  });

  it("rejects an invalid repository name", async () => {
    const res = await request(app).get("/api/github/octocat/repositories/../commits");
    // Express/supertest normalise "..", so also test a clearly invalid name:
    const res2 = await request(app).get("/api/github/octocat/repositories/bad%20name/commits");

    expect([400, 404]).toContain(res.status);
    expect(res2.status).toBe(400);
  });
});