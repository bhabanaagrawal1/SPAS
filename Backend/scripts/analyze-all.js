import prisma from "../prismaClient.js";
import { analyzeStudents, loadStudents } from "../src/services/insightService.js";

const students = await loadStudents();
console.log(`Analyzing ${students.length} students...`);
const out = await analyzeStudents(students);
console.log(out);
await prisma.$disconnect();