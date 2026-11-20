-- A change detection can exist without a personal baseline.
--
-- Sessions that produce no interpretable score, or no functional check-in, do not
-- establish a baseline. They still record that no change conclusion was possible,
-- which previously required storing an empty-string baseline id — a value that
-- looks like a relation but points at nothing.

ALTER TABLE "ChangeDetection" ALTER COLUMN "baselineId" DROP NOT NULL;

UPDATE "ChangeDetection" SET "baselineId" = NULL WHERE "baselineId" = '';
