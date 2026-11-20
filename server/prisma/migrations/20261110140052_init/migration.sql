-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PATIENT',
    "age" INTEGER NOT NULL,
    "dob" TEXT,
    "pin" TEXT,
    "gender" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "educationYears" INTEGER,
    "handedness" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "taskResponses" JSONB,
    "baselineId" TEXT,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EyeMetrics" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "reactionTime" DOUBLE PRECISION NOT NULL,
    "blinkRate" DOUBLE PRECISION NOT NULL,
    "fixationScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EyeMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceMetrics" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "speechRate" DOUBLE PRECISION NOT NULL,
    "pauseScore" DOUBLE PRECISION NOT NULL,
    "jitter" DOUBLE PRECISION NOT NULL,
    "shimmer" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VoiceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaceMetrics" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "symmetry" DOUBLE PRECISION NOT NULL,
    "tremorScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FaceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "doctorNotes" TEXT,
    "pdfUrl" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Baseline" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "establishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "cognitiveScore" DOUBLE PRECISION NOT NULL,
    "functionalScore" DOUBLE PRECISION NOT NULL,
    "eyeScore" DOUBLE PRECISION,
    "voiceScore" DOUBLE PRECISION,
    "faceScore" DOUBLE PRECISION,
    "contextScore" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Baseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LongitudinalRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "changeFromBaseline" DOUBLE PRECISION,
    "trendDirection" TEXT,
    "assessmentsCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LongitudinalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeDetection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baselineId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "cognitiveChange" DOUBLE PRECISION,
    "outsideBaseline" BOOLEAN NOT NULL DEFAULT false,
    "reviewReasons" JSONB,

    CONSTRAINT "ChangeDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextInput" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "source" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "values" JSONB NOT NULL,
    "consentGranted" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),

    CONSTRAINT "ContextInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainHealthProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeDetectionId" TEXT NOT NULL,
    "profileScore" DOUBLE PRECISION NOT NULL,
    "riskTier" TEXT NOT NULL,
    "interpretation" TEXT NOT NULL,
    "nextSteps" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "BrainHealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_patientId_key" ON "User"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EyeMetrics_assessmentId_key" ON "EyeMetrics"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceMetrics_assessmentId_key" ON "VoiceMetrics"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "FaceMetrics_assessmentId_key" ON "FaceMetrics"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_assessmentId_key" ON "Report"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "LongitudinalRecord_assessmentId_key" ON "LongitudinalRecord"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "BrainHealthProfile_userId_key" ON "BrainHealthProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BrainHealthProfile_changeDetectionId_key" ON "BrainHealthProfile"("changeDetectionId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_baselineId_fkey" FOREIGN KEY ("baselineId") REFERENCES "Baseline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EyeMetrics" ADD CONSTRAINT "EyeMetrics_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceMetrics" ADD CONSTRAINT "VoiceMetrics_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceMetrics" ADD CONSTRAINT "FaceMetrics_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baseline" ADD CONSTRAINT "Baseline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongitudinalRecord" ADD CONSTRAINT "LongitudinalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongitudinalRecord" ADD CONSTRAINT "LongitudinalRecord_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeDetection" ADD CONSTRAINT "ChangeDetection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeDetection" ADD CONSTRAINT "ChangeDetection_baselineId_fkey" FOREIGN KEY ("baselineId") REFERENCES "Baseline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextInput" ADD CONSTRAINT "ContextInput_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextInput" ADD CONSTRAINT "ContextInput_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainHealthProfile" ADD CONSTRAINT "BrainHealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainHealthProfile" ADD CONSTRAINT "BrainHealthProfile_changeDetectionId_fkey" FOREIGN KEY ("changeDetectionId") REFERENCES "ChangeDetection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
