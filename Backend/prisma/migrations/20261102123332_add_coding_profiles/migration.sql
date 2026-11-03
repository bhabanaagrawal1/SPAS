-- CreateEnum
CREATE TYPE "CodingPlatform" AS ENUM ('CODEFORCES', 'LEETCODE', 'CODECHEF', 'GEEKSFORGEEKS', 'HACKERRANK');

-- CreateEnum
CREATE TYPE "CodingSyncStatus" AS ENUM ('PENDING', 'OK', 'ERROR', 'INVALID_HANDLE');

-- CreateTable
CREATE TABLE "CodingAccount" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "platform" "CodingPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "handleKey" TEXT NOT NULL,
    "syncStatus" "CodingSyncStatus" NOT NULL DEFAULT 'PENDING',
    "syncRequestedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "nextSyncAt" TIMESTAMP(3),
    "problemsSolved" INTEGER NOT NULL DEFAULT 0,
    "contestsAttended" INTEGER NOT NULL DEFAULT 0,
    "currentRating" INTEGER,
    "maxRating" INTEGER,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingRatingPoint" (
    "accountId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "contestName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "CodingRatingPoint_pkey" PRIMARY KEY ("accountId","occurredAt")
);

-- CreateTable
CREATE TABLE "CodingActivityDay" (
    "accountId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "CodingActivityDay_pkey" PRIMARY KEY ("accountId","day")
);

-- CreateTable
CREATE TABLE "CodingTagStat" (
    "accountId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "solved" INTEGER NOT NULL,

    CONSTRAINT "CodingTagStat_pkey" PRIMARY KEY ("accountId","tag")
);

-- CreateTable
CREATE TABLE "CodingSolvedSet" (
    "accountId" TEXT NOT NULL,
    "keys" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingSolvedSet_pkey" PRIMARY KEY ("accountId")
);

-- CreateIndex
CREATE INDEX "CodingAccount_nextSyncAt_idx" ON "CodingAccount"("nextSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "CodingAccount_studentId_platform_key" ON "CodingAccount"("studentId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "CodingAccount_platform_handleKey_key" ON "CodingAccount"("platform", "handleKey");

-- AddForeignKey
ALTER TABLE "CodingAccount" ADD CONSTRAINT "CodingAccount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingRatingPoint" ADD CONSTRAINT "CodingRatingPoint_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CodingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingActivityDay" ADD CONSTRAINT "CodingActivityDay_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CodingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingTagStat" ADD CONSTRAINT "CodingTagStat_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CodingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSolvedSet" ADD CONSTRAINT "CodingSolvedSet_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CodingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
