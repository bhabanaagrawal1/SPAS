import { Router } from "express";
import { authenticate } from "../middleware/11.authenticate.js";   // <- YOUR existing auth middleware
import { assertSectionAccess, assertStudentAccess, attachOwnStudent, requireRole } from "../middleware/access.js";
import { mlHealth } from "../services/mlClient.js";
import { analyzeOne, analyzeSection, getOverview, getSectionSummary } from "../services/insightService.js";

const r = Router();
r.use(authenticate);

r.get("/health", requireRole("ADMIN", "TEACHER"), async (_q, res) => res.json(await mlHealth()));

// logged-in student
r.get("/me", attachOwnStudent, async (req, res) => res.json(await getOverview(req.studentDbId)));
r.post("/me/analyze", attachOwnStudent, async (req, res) => {
  await analyzeOne(req.studentDbId);
  res.json(await getOverview(req.studentDbId));
});

// teacher / admin
r.get("/students/:studentId", requireRole("TEACHER", "ADMIN"), assertStudentAccess,
  async (req, res) => res.json(await getOverview(req.params.studentId)));
r.post("/students/:studentId/analyze", requireRole("TEACHER", "ADMIN"), assertStudentAccess,
  async (req, res) => { await analyzeOne(req.params.studentId); res.json(await getOverview(req.params.studentId)); });
r.get("/sections/:sectionId", requireRole("TEACHER", "ADMIN"), assertSectionAccess,
  async (req, res) => res.json(await getSectionSummary(req.params.sectionId)));
r.post("/sections/:sectionId/analyze", requireRole("TEACHER", "ADMIN"), assertSectionAccess,
  async (req, res) => res.json(await analyzeSection(req.params.sectionId)));

export default r;