-- Remove the fabricated clinical risk tier and allow sessions to record the
-- absence of an interpretable score.
--
-- `riskLevel` (LOW / MODERATE / HIGH) was derived from invented cut-offs on an
-- unvalidated score and was rendered to clinicians as a clinical classification.
-- It is renamed to `reviewState`, an administrative review flag:
--   NOT_REVIEWED | NOT_INTERPRETABLE | REVIEW_PROMPT | CLINICIAN_REVIEWED
--
-- Existing tier values are collapsed to NOT_REVIEWED. They are not carried
-- forward, because they were never evidence-based clinical signals.

ALTER TABLE "Assessment" ALTER COLUMN "overallScore" DROP NOT NULL;

ALTER TABLE "Assessment" RENAME COLUMN "riskLevel" TO "reviewState";
ALTER TABLE "Assessment" ALTER COLUMN "reviewState" SET DEFAULT 'NOT_REVIEWED';
UPDATE "Assessment"
   SET "reviewState" = 'NOT_INTERPRETABLE'
 WHERE "overallScore" IS NULL;
UPDATE "Assessment"
   SET "reviewState" = 'NOT_REVIEWED'
 WHERE "reviewState" IN ('LOW', 'MODERATE', 'HIGH', 'UNRATED', 'PENDING');

ALTER TABLE "BrainHealthProfile" ALTER COLUMN "profileScore" DROP NOT NULL;

ALTER TABLE "BrainHealthProfile" RENAME COLUMN "riskTier" TO "reviewSignal";
ALTER TABLE "BrainHealthProfile" ALTER COLUMN "reviewSignal" SET DEFAULT 'NOT_REVIEWED';
UPDATE "BrainHealthProfile"
   SET "reviewSignal" = 'NOT_INTERPRETABLE'
 WHERE "profileScore" IS NULL;
UPDATE "BrainHealthProfile"
   SET "reviewSignal" = 'NOT_REVIEWED'
 WHERE "reviewSignal" IN ('LOW', 'MODERATE', 'HIGH', 'UNRATED', 'PENDING');
