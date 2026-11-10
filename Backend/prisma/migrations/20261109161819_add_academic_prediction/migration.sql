-- CreateTable
CREATE TABLE "AcademicRecord" (
    "id" TEXT NOT NULL,
    "studentDbId" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "previousSemesterCgpa" DOUBLE PRECISION NOT NULL,
    "previousSemesterBacklogs" INTEGER NOT NULL,
    "attendancePercentage" DOUBLE PRECISION NOT NULL,
    "totalClasses" INTEGER NOT NULL,
    "attendedClasses" INTEGER NOT NULL,
    "internalAssessmentMarks" DOUBLE PRECISION NOT NULL,
    "midtermMarks" DOUBLE PRECISION NOT NULL,
    "quizAverage" DOUBLE PRECISION NOT NULL,
    "assignmentAverage" DOUBLE PRECISION NOT NULL,
    "assignmentSubmissionRate" DOUBLE PRECISION NOT NULL,
    "labAverage" DOUBLE PRECISION NOT NULL,
    "projectMarks" DOUBLE PRECISION NOT NULL,
    "studyHoursPerDay" DOUBLE PRECISION NOT NULL,
    "previousYearPercentage" DOUBLE PRECISION NOT NULL,
    "isSynthetic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CGPAPrediction" (
    "id" TEXT NOT NULL,
    "studentDbId" TEXT NOT NULL,
    "predictedCgpa" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "featuresSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CGPAPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademicRecord_studentDbId_idx" ON "AcademicRecord"("studentDbId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicRecord_studentDbId_semester_academicYear_key" ON "AcademicRecord"("studentDbId", "semester", "academicYear");

-- CreateIndex
CREATE INDEX "CGPAPrediction_studentDbId_createdAt_idx" ON "CGPAPrediction"("studentDbId", "createdAt");

-- AddForeignKey
ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_studentDbId_fkey" FOREIGN KEY ("studentDbId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CGPAPrediction" ADD CONSTRAINT "CGPAPrediction_studentDbId_fkey" FOREIGN KEY ("studentDbId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
