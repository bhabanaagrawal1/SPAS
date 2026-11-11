import  prisma  from "../../prismaClient.js";
import { HttpError } from "../httpError.js";
import { mlAnalyze, mlMeta } from "./mlClient.js";

const withLatest = {
  section: true,
  academicRecords: { orderBy: [{ semester: "desc" }, { createdAt: "desc" }], take: 1 },
};
export const loadStudents = (where = {}) => prisma.student.findMany({ where, include: withLatest });

const FIELDS = [
  "semester", "previousSemesterCgpa", "previousSemesterBacklogs", "attendancePercentage", "totalClasses",
  "attendedClasses", "internalAssessmentMarks", "midtermMarks", "quizAverage", "assignmentAverage",
  "assignmentSubmissionRate", "labAverage", "projectMarks", "studyHoursPerDay", "previousYearPercentage",
];

function toPayload(student, record) {
  const p = { ref: student.id, studentId: student.studentId, department: student.section.branch };
  for (const f of FIELDS) p[f] = record[f];
  return p;
}

const shape = (i) => i && ({
  id: i.id, createdAt: i.createdAt, semester: i.semester, academicYear: i.academicYear,
  modelVersion: i.modelVersion, predictedCgpa: i.predictedCgpa, errorMargin: i.errorMargin,
  risk: i.riskLevel ? { level: i.riskLevel, score: i.riskScore, probabilities: i.riskProbs ?? {} } : null,
  cluster: i.clusterName ? { id: i.clusterId, name: i.clusterName } : null,
  anomaly: i.anomalyScore != null
    ? { score: i.anomalyScore, isAnomaly: i.isAnomaly, reasons: i.anomalyReasons ?? [] } : null,
  recommendations: i.recommendations ?? [],
  peerGap: i.peerGap ?? {},
  inputs: i.inputs ?? {},
  missingFeatures: i.missingFeatures ?? [],
  moduleErrors: i.moduleErrors ?? {},
});

// Runs ALL 5 models for the given students (already loaded with their latest record) and saves the result.
export async function analyzeStudents(students) {
  const ready = students.filter((s) => s.academicRecords[0]);
  let modelVersion = null;
  const errors = {};

  for (let i = 0; i < ready.length; i += 100) {
    const batch = ready.slice(i, i + 100);
    const payloads = batch.map((s) => toPayload(s, s.academicRecords[0]));
    const ml = await mlAnalyze(payloads);
    modelVersion = ml.modelVersion;
    Object.assign(errors, ml.errors);
    const byRef = new Map(ml.results.map((r) => [r.ref, r]));

    await prisma.studentInsight.createMany({
      data: batch.map((s, idx) => {
        const r = byRef.get(s.id) ?? {};
        const rec = s.academicRecords[0];
        return {
          studentDbId: s.id, semester: rec.semester, academicYear: rec.academicYear,
          predictedCgpa: r.performance?.predictedCgpa ?? null,
          errorMargin: ml.errorMargin ?? null,
          riskLevel: r.risk?.level ?? null, riskScore: r.risk?.score ?? null,
          riskProbs: r.risk?.probabilities ?? undefined,
          clusterId: r.cluster?.id ?? null, clusterName: r.cluster?.name ?? null,
          anomalyScore: r.anomaly?.score ?? null, isAnomaly: r.anomaly?.isAnomaly ?? false,
          anomalyReasons: r.anomaly?.reasons ?? undefined,
          recommendations: r.recommendations ?? undefined,
          peerGap: r.peerGap ?? undefined,
          inputs: payloads[idx],
          missingFeatures: ml.missingFeatures ?? undefined,
          moduleErrors: Object.keys(ml.errors ?? {}).length ? ml.errors : undefined,
          modelVersion: ml.modelVersion,
        };
      }),
    });
  }
  return { analyzed: ready.length, skipped: students.length - ready.length, modelVersion, errors };
}

export async function analyzeOne(studentDbId) {
  const students = await loadStudents({ id: studentDbId });
  if (!students.length) throw new HttpError(404, "Student not found");
  if (!students[0].academicRecords[0]) throw new HttpError(409, "No academic record for this student yet");
  return analyzeStudents(students);
}

export async function analyzeSection(sectionId) {
  const students = await loadStudents({ sectionId });
  if (!students.length) throw new HttpError(404, "No students in this section");
  return analyzeStudents(students);
}

// Everything the dashboard needs in one call
export async function getOverview(studentDbId) {
  const [student, records, insights, meta] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentDbId }, include: { section: true } }),
    prisma.academicRecord.findMany({ where: { studentDbId }, orderBy: { semester: "asc" } }),
    prisma.studentInsight.findMany({ where: { studentDbId }, orderBy: { createdAt: "desc" }, take: 30 }),
    mlMeta().catch(() => null),   // dashboard still loads if the ML service is down
  ]);
  if (!student) throw new HttpError(404, "Student not found");

  // actual CGPA of semester N = previousSemesterCgpa stored on semester N+1's record
  const pts = new Map();
  const slot = (n) => pts.get(n) ?? pts.set(n, { semester: `Sem ${n}`, n, actual: null, predicted: null }).get(n);
  for (const r of records) if (r.semester > 1) slot(r.semester - 1).actual = r.previousSemesterCgpa;
  for (const i of [...insights].reverse()) if (i.predictedCgpa != null) slot(i.semester).predicted = i.predictedCgpa;
  const chart = [...pts.values()].sort((a, b) => a.n - b.n).map(({ n, ...rest }) => rest);

  return {
    student: { id: student.id, studentId: student.studentId, name: student.name,
               section: `${student.section.branch} - ${student.section.name}` },
    hasAcademicRecord: records.length > 0,
    latest: shape(insights[0]) ?? null,
    chart,
    metrics: meta?.metrics ?? [],
    clusterMap: meta?.clusterMap ?? null,
  };
}

export async function getSectionSummary(sectionId) {
  const students = await prisma.student.findMany({
    where: { sectionId },
    select: { id: true, studentId: true, name: true, insights: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const rows = students.map((s) => ({ id: s.id, studentId: s.studentId, name: s.name, insight: shape(s.insights[0]) ?? null }));
  const risk = { Low: 0, Medium: 0, High: 0 };
  let anomalies = 0;
  for (const r of rows) {
    if (r.insight?.risk) risk[r.insight.risk.level] = (risk[r.insight.risk.level] ?? 0) + 1;
    if (r.insight?.anomaly?.isAnomaly) anomalies++;
  }
  return { count: rows.length, analyzed: rows.filter((r) => r.insight).length, risk, anomalies, students: rows };
}