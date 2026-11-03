import { Router } from "express";
// Adjust this import to however your middleware exports it (named or default).
import { authenticate } from "../middleware/11.authenticate.js";
import { requireOwnStudent, requireReadableStudent } from "../middleware/codingAccess.js";
import { rateLimit } from "../middleware/codingRateLimit.js";
import * as controller from "../controllers/codingProfile.controller.js";

const router = Router();

// Forwards errors from async controllers to your error middleware.
const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const byUser = (req) => String(req.user?.id ?? req.user?._id ?? "");
const limit = (name, max) => rateLimit({ name, max, windowSeconds: 60, keyOf: byUser });

router.use(authenticate);

/* ---- the logged-in student's own profile (student comes from the token, never from the client) ---- */
router.get("/me/dashboard", limit("dash", 120), requireOwnStudent, wrap(controller.dashboard));
router.get("/me/recommendations", limit("recs", 30), requireOwnStudent, wrap(controller.recommendations));
router.put("/me/accounts/:platform", limit("write", 10), requireOwnStudent, wrap(controller.connect));
router.delete("/me/accounts/:platform", limit("write", 10), requireOwnStudent, wrap(controller.disconnect));
router.post("/me/sync", limit("write", 10), requireOwnStudent, wrap(controller.sync));
router.post("/me/sync/:platform", limit("write", 10), requireOwnStudent, wrap(controller.sync));

/* ---- teacher / admin: read a student's profile (teachers only for sections they teach) ---- */
router.get("/students/:studentId/dashboard", limit("dash-staff", 120), requireReadableStudent, wrap(controller.dashboard));

export default router;