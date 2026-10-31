import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as github from "../controllers/github.controller.js";
import { authenticate } from "../middleware/11.authenticate.js";
import { ApiError } from "../utils/3.catchAsync.js";

const router = Router();

// TODO: check your Prisma schema / seed file for the exact role value ("ADMIN" or "admin"?)
const ADMIN_ROLE = "ADMIN";

const requireAdmin = (req, res, next) =>
  req.user?.role === ADMIN_ROLE ? next() : next(new ApiError(403, "Admin access required"));

// 1. Only logged-in users may use these routes.
router.use(authenticate);

// 2. Protect our shared GitHub quota. The limit is per USER, not per IP:
//    students on the same campus network share one IP and would block each other.
const githubLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60, // 60 requests per minute per user
  keyGenerator: (req) => String(req.user.id),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "TOO_MANY_REQUESTS", message: "Too many requests. Please slow down." },
  },
});
router.use(githubLimiter);

/* Monitoring (admin only) */
router.get("/rate-limit", requireAdmin, github.getRateLimitStatus);

/* Per-user data */
router.get("/:username/profile", github.getProfile);
router.get("/:username/repositories", github.getRepositories);
router.get("/:username/languages", github.getLanguages);
router.get("/:username/activity", github.getActivity);
router.get("/:username/activity/monthly", github.getMonthlyActivity);
router.get("/:username/contributions", github.getContributions);

/* Per-repository data */
router.get("/:username/repositories/:repository/commits", github.getCommits);
router.get("/:username/repositories/:repository/issues", github.getIssues);
router.get("/:username/repositories/:repository/pull-requests", github.getPullRequests);

export default router;