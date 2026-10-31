/*
  Warnings:

  - A unique constraint covering the columns `[collegeEmail]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[collegeEmail]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - Made the column `collegeEmail` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `collegeEmail` on table `Teacher` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "collegeEmail" SET NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "collegeEmail" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_collegeEmail_key" ON "Student"("collegeEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_collegeEmail_key" ON "Teacher"("collegeEmail");
