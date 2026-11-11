import  prisma  from "../../prismaClient.js";            // your Prisma 7 client
import { HttpError } from "../httpError.js";

// Adapt this one line to how YOUR auth middleware stores the logged-in user
const getUser = (req) => ({ id: req.user.id, role: req.user.role });

export const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(getUser(req).role)) throw new HttpError(403, "Forbidden");
  next();
};

async function canAccessSection(user, sectionId) {
  if (user.role === "ADMIN") return true;
  if (user.role !== "TEACHER") return false;
  const hit = await prisma.teachingAssignment.findFirst({
    where: { sectionId, teacher: { userId: user.id } }, select: { id: true },
  });
  return !!hit;
}

export async function assertSectionAccess(req, _res, next) {
  if (!(await canAccessSection(getUser(req), req.params.sectionId))) throw new HttpError(403, "Forbidden");
  next();
}

export async function assertStudentAccess(req, _res, next) {
  const user = getUser(req);
  const s = await prisma.student.findUnique({
    where: { id: req.params.studentId }, select: { userId: true, sectionId: true },
  });
  if (!s) throw new HttpError(404, "Student not found");
  const ok = user.role === "STUDENT" ? s.userId === user.id : await canAccessSection(user, s.sectionId);
  if (!ok) throw new HttpError(403, "Forbidden");
  next();
}

export async function attachOwnStudent(req, _res, next) {
  const user = getUser(req);
  if (user.role !== "STUDENT") throw new HttpError(403, "Only students have a personal dashboard");
  const s = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!s) throw new HttpError(404, "Your account is not linked to a student record yet");
  req.studentDbId = s.id;
  next();
}