import fs from "node:fs";
import { parse } from "csv-parse/sync";
import  prisma  from "../prismaClient.js";

const file = process.argv[2];
const academicYear = process.argv.find((a) => a.startsWith("--year="))?.split("=")[1] ?? "2026-27";
const sectionName = process.argv.find((a) => a.startsWith("--section="))?.split("=")[1] ?? "A";
if (!file) { console.error("Usage: node prisma/import-training-csv.js <file.csv> [--year=2026-27] [--section=A]"); process.exit(1); }

const NUM = {
  semester: "SEM", previousSemesterCgpa: "PREV_SEM_CGPA", previousSemesterBacklogs: "PREV_SEM_BACKLOGS",
  attendancePercentage: "ATTENDANCE_PERCENTAGE", totalClasses: "TOTAL_CLASSES", attendedClasses: "ATTENDED_CLASSES",
  internalAssessmentMarks: "INTERNAL_ASSESSMENT_MARKS", midtermMarks: "MIDTERM_MARKS", quizAverage: "QUIZ_AVERAGE",
  assignmentAverage: "ASSIGNMENT_AVERAGE", assignmentSubmissionRate: "ASSIGNMENT_SUBMISSION_RATE",
  labAverage: "LAB_AVERAGE", projectMarks: "PROJECT_MARKS", studyHoursPerDay: "STUDY_HOURS_PER_DAY",
  previousYearPercentage: "PREVIOUS_YEAR_PERCENTAGE",
};
const INT = new Set(["semester", "previousSemesterBacklogs", "totalClasses", "attendedClasses"]);

const rows = parse(fs.readFileSync(file), {
  bom: true, trim: true, skip_empty_lines: true,
  columns: (h) => h.map((x) => x.trim().toUpperCase()),
});

const need = ["STUDENT_ID", "DEPARTMENT", ...Object.values(NUM)];
const missingCols = need.filter((c) => !(c in rows[0]));
if (missingCols.length) { console.error("CSV is missing columns:", missingCols.join(", ")); process.exit(1); }

// median per numeric column (used to fill blanks)
const median = {};
for (const [f, col] of Object.entries(NUM)) {
  const v = rows.map((r) => Number(r[col])).filter(Number.isFinite).sort((a, b) => a - b);
  median[f] = v.length ? v[Math.floor(v.length / 2)] : 0;
}

let filled = 0;
const recs = rows.map((r) => {
  const rec = { studentId: String(r.STUDENT_ID), department: String(r.DEPARTMENT), name: r.NAME, email: r.COLLEGE_EMAIL || r.EMAIL };
  for (const [f, col] of Object.entries(NUM)) {
    let n = r[col] === "" ? NaN : Number(r[col]);
    if (!Number.isFinite(n)) { n = median[f]; filled++; }
    rec[f] = INT.has(f) ? Math.round(n) : n;
  }
  return rec;
});

// 1) sections: one per (department, semester)
const sectionId = new Map();
for (const r of recs) {
  const key = `${r.department}|${r.semester}`;
  if (sectionId.has(key)) continue;
  const s = await prisma.section.upsert({
    where: { name_branch_semester_academicYear: { name: sectionName, branch: r.department, semester: r.semester, academicYear } },
    update: {},
    create: { name: sectionName, branch: r.department, semester: r.semester, academicYear },
  });
  sectionId.set(key, s.id);
}

// 2) students (section = their highest-semester row)
const latest = new Map();
for (const r of recs) if (!latest.has(r.studentId) || r.semester > latest.get(r.studentId).semester) latest.set(r.studentId, r);
const studentRows = [...latest.values()].map((r) => ({
  studentId: r.studentId,
  name: r.name || `Student ${r.studentId}`,
  collegeEmail: (r.email || `${r.studentId}@college.edu`).toLowerCase(),
  sectionId: sectionId.get(`${r.department}|${r.semester}`),
}));
for (let i = 0; i < studentRows.length; i += 1000)
  await prisma.student.createMany({ data: studentRows.slice(i, i + 1000), skipDuplicates: true });

// 3) academic records
const dbIds = new Map((await prisma.student.findMany({ select: { id: true, studentId: true } })).map((s) => [s.studentId, s.id]));
const recordRows = recs.map((r) => {
  const { studentId, department, name, email, ...fields } = r;
  return { ...fields, studentDbId: dbIds.get(studentId), academicYear, isSynthetic: false };
});
for (let i = 0; i < recordRows.length; i += 1000)
  await prisma.academicRecord.createMany({ data: recordRows.slice(i, i + 1000), skipDuplicates: true });

console.log(`Done: ${sectionId.size} sections, ${studentRows.length} students, ${recordRows.length} academic records (${filled} blank cells filled with medians).`);
await prisma.$disconnect();