import { prisma } from "../config/coding.prisma.js";
import { CodingProfileError } from "../utils/codingProfiles/errors.js";

/*
 * WHOSE DATA IS THIS?  The answer always comes from the login token, never from the client.
 *   token -> User.id -> Student (via Student.userId) -> CodingAccounts (via studentId)
 * Students may only touch their own record. Teachers may read students in sections they teach.
 * Admins may read anyone. Anything else looks like "not found", so ids cannot be probed.
 *
 * Both middlewares set req.student = { id, sectionId, ... } for the controller to use.
 * Run them AFTER your `authenticate` middleware.
 */

// Adjust if your authenticate middleware stores the user differently.
const actorOf = async (req) => {
  const id = req.user?.id ?? req.user?._id;
  if (!id) throw new CodingProfileError(401, "Not authenticated.");

  let role = req.user?.role;
  if (!role) {
    role = (await prisma.user.findUnique({ where: { id: String(id) }, select: { role: true } }))?.role;
  }
  if (!role) throw new CodingProfileError(401, "Not authenticated.");

  return { id: String(id), role };
};

/** "My profile" routes: req.student is the logged-in student. */
export const requireOwnStudent = async (req, _res, next) => {
  try {
    const actor = await actorOf(req);
    if (actor.role !== "STUDENT") {
      throw new CodingProfileError(403, "Only students can manage coding profiles.");
    }

    const student = await prisma.student.findUnique({
      where: { userId: actor.id },
      select: { id: true, sectionId: true },
    });
    if (!student) throw new CodingProfileError(403, "No student record is linked to this account.");

    req.student = student;
    next();
  } catch (error) {
    next(error);
  }
};

/** "/students/:studentId/..." routes: req.student is that student, if the caller may read it. */
export const requireReadableStudent = async (req, _res, next) => {
  try {
    const actor = await actorOf(req);
    const notFound = () => new CodingProfileError(404, "Student not found.");

    const student = await prisma.student.findUnique({
      where: { id: String(req.params.studentId) },
      select: { id: true, sectionId: true, userId: true },
    });
    if (!student) throw notFound();

    if (actor.role === "STUDENT" && student.userId !== actor.id) throw notFound();

    if (actor.role === "TEACHER") {
      const assignment = await prisma.teachingAssignment.findFirst({
        where: { sectionId: student.sectionId, teacher: { userId: actor.id } },
        select: { id: true },
      });
      if (!assignment) throw notFound();
    }

    if (!["ADMIN", "STUDENT", "TEACHER"].includes(actor.role)) {
      throw new CodingProfileError(403, "You do not have access to this profile.");
    }

    req.student = student;
    next();
  } catch (error) {
    next(error);
  }
};