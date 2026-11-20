-- Add indexes for the per-patient scan patterns used by the portal and the
-- change-monitor services. Without these, each portal load scans the whole
-- table for the patient's rows.

-- Longitudinal history is always read "this patient, newest first".
CREATE INDEX IF NOT EXISTS "LongitudinalRecord_userId_recordedAt_idx"
  ON "LongitudinalRecord"("userId", "recordedAt");

-- Change detection queues filter by patient and order by detection time.
CREATE INDEX IF NOT EXISTS "ChangeDetection_userId_detectedAt_idx"
  ON "ChangeDetection"("userId", "detectedAt");

-- Context inputs (sleep, activity, clinical) load per patient in date order.
CREATE INDEX IF NOT EXISTS "ContextInput_userId_recordedAt_idx"
  ON "ContextInput"("userId", "recordedAt");
