-- CreateTable
CREATE TABLE "StudentInsight" (
    "id" TEXT NOT NULL,
    "studentDbId" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "predictedCgpa" DOUBLE PRECISION,
    "errorMargin" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "riskScore" DOUBLE PRECISION,
    "riskProbs" JSONB,
    "clusterId" INTEGER,
    "clusterName" TEXT,
    "anomalyScore" DOUBLE PRECISION,
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "anomalyReasons" JSONB,
    "recommendations" JSONB,
    "peerGap" JSONB,
    "inputs" JSONB,
    "missingFeatures" JSONB,
    "moduleErrors" JSONB,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentInsight_studentDbId_createdAt_idx" ON "StudentInsight"("studentDbId", "createdAt");

-- AddForeignKey
ALTER TABLE "StudentInsight" ADD CONSTRAINT "StudentInsight_studentDbId_fkey" FOREIGN KEY ("studentDbId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
