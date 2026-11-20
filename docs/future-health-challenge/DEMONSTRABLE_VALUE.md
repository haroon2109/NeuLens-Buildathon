# Demonstrable value

One page of measures for the "Demonstrable value" requirement: *"Show performance on
realistic or simulated cases and report measures such as completed assessments, time to
appropriate evaluation, referral completion, user trust and fairness across relevant
population groups."*

## Standing of these numbers

| | |
| --- | --- |
| **What they are** | Output of a fixed-seed simulated cohort run through the platform's own measure definitions |
| **What they are not** | Clinical evidence, a validation result, or a measurement of real patients |
| **Cohort** | 120 simulated patients, 302 simulated sessions, English only, seed `20261118` |
| **Reproduce** | `npx ts-node --project server/tsconfig.json server/src/scripts/evidence-cohort.ts` |
| **Definitions** | Mirror `server/src/services/platformInsights.ts`; reliability from `server/src/services/reliability.ts` |

Arabic is excluded because task administration is gated by the language readiness registry
(translation done; back-translation, pretesting and clinical sign-off pending). Reporting
Arabic outcomes would imply an administration that does not yet exist.

The jury demo workspace is also not the source. Seeded fictional records are excluded from
every aggregate by design (`isDemoAssessment`), so the platform insights page reports zero
there — the exclusion is the correct behaviour, not an empty dashboard.

## Operational measures

| Measure | Definition | Simulated result |
| --- | --- | --- |
| Completed assessments | Sessions recorded with `status = COMPLETED` | **302** |
| Completion rate | Sessions whose quality record reports `completion = FULL` | **86.4%** |
| Comparability rate | Sessions whose quality record reports `comparable = true` | **72.8%** |
| Median time to clinical review | Session timestamp → recorded `reviewedAt`, reviewed sessions only (n = 278) | **17.8 h** |
| 90th percentile time to review | Same measure at p90 | **57.8 h** |
| Pending clinical review | Completed sessions with no reviewer | **24** |
| Follow-up required | Completed sessions flagged `FOLLOWUP_REQUIRED` | **40** |
| Referrals recorded | Referral records with a recorded outcome | **35** |
| Referral completion | Referrals with `outcomeStatus = COMPLETED` | **54.3%** |
| Referral non-completion | Declined, cancelled or no-show | **45.7%** |

Non-completion is reported alongside completion deliberately: a referral pathway that only
publishes the successes cannot be managed.

## Measurement properties

| Measure | Definition | Simulated result |
| --- | --- | --- |
| Repeat pairs | Consecutive *comparable* sessions for the same person | **109 pairs** |
| Mean absolute score change | Within-person change between those pairs | **5.28 points** |
| ICC(2,1) | Two-way random effects, absolute agreement, single measurement | **0.687** (provisional) |

The coefficient is descriptive and provisional. It is not a validation result, and no
reliable-change threshold is derived from it — the platform withholds a change signal until
at least `MIN_REPEAT_PAIRS_FOR_ICC = 3` comparable pairs exist, and labels anything computed
from more than that as provisional rather than established.

## Fairness monitoring

Comparability rate by band, the form in which the platform actually reports group measures:

| Age band | Sessions | Comparable |
| --- | --- | --- |
| <60 | 40 | 77.5% |
| 60–69 | 115 | 71.3% |
| 70–79 | 75 | 76.0% |
| 80+ | 72 | 69.4% |

| Education band | Sessions | Comparable |
| --- | --- | --- |
| 0–8 years | 91 | 70.3% |
| 9–12 years | 101 | 78.2% |
| 13+ years | 110 | 70.0% |

These bands are flat because the generator assigns session quality independently of both
attributes. That is a statement about the generator, not about Neulens, and it must not be
read either way: the sheet demonstrates that banded monitoring exists and is reported with
its sample sizes, not that the instrument is fair. A real fairness conclusion requires real
administration data, and differences observed there would still be a prompt to investigate
measurement conditions, access and sample size rather than proof of bias.

## What is real and verifiable today

These are engineering properties, not outcome claims, and they can be checked by anyone
with the repository:

- Deterministic scoring: the composite is derived server-side from recorded task responses;
  no submission schema accepts a client-supplied score.
- No substitute values: a task that produced no measurement makes its domain null and the
  composite null, with a recorded reason (`CAMERA_UNAVAILABLE`, `MICROPHONE_UNAVAILABLE`,
  `SKIPPED`, `TIME_LIMIT`, `NOT_COMPLETED`, `NO_RECORDING`).
- Safety gating: non-comparable sessions are excluded from change interpretation rather than
  averaged in.
- Session isolation of demonstration data, and 106 passing tests covering these behaviours.

## Not yet available

- **Clinical validity or diagnostic performance.** No sensitivity, specificity or predictive
  value is claimed, and none is reported here.
- **Real referral completion.** The figure above is simulated; no live pathway exists to
  measure.
- **User trust.** There is no trust instrument in the product and no proxy in this sheet.
  Completion and abandonment rates are workflow measures and should not be presented as a
  trust result. If the panel wants a trust measure, it has to be collected, not inferred.
