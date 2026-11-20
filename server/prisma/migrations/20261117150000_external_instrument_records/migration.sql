-- External validated-instrument records.
--
-- A clinician may record the score of a licensed/validated screener they
-- administered themselves (MoCA, RUDAS, AD8, MMSE). These rows are written by
-- hand and are never produced, rescored or averaged into the platform's own
-- composite; they exist so a validated anchor can sit next to the platform's
-- longitudinal output and state its language and version.

CREATE TABLE "ExternalInstrumentRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "instrumentKey" TEXT NOT NULL,
    "instrumentVersion" TEXT,
    "language" TEXT NOT NULL,
    "administeredOn" TIMESTAMP(3) NOT NULL,
    "administeredBy" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "licenceConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "licenceReference" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalInstrumentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExternalInstrumentRecord_patientId_administeredOn_idx"
    ON "ExternalInstrumentRecord"("patientId", "administeredOn");

ALTER TABLE "ExternalInstrumentRecord"
    ADD CONSTRAINT "ExternalInstrumentRecord_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
