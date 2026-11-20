# Demo script

## Goal

Run one complete spine from the public landing page to a clinician review without touching anything unrelated.

Spine:
1. Landing page → patient hub
2. Register a patient
3. Sign in as that patient
4. Start and finish a guided screening task
5. Submit the assessment
6. See the patient confirmation / session summary
7. Sign in as a clinician and open the same screening for review
8. Read quality warnings and domain observations
9. Generate or load the constrained explanation draft
10. Save the review status

## Before the demo

- Backend is running on `http://127.0.0.1:5000`
- Frontend is running on `http://127.0.0.1:5173`
- Database posture is known and either live or intentionally documented as fallback
- Clinician credentials are created and ready before the demo starts
- Do not rely on per-dewar external vendor keys during the demo unless they are verified live

## Suggested walkthrough

Open the landing page first. Say:
- Neulens starts as a guided screening experience, not a diagnosis screen.

Then:
- Register one patient using the patient portal path.
- Log in and complete one task through the screening flow.
- Submit and show the patient-facing confirmation or summary.
- Emphasize what the patient can and cannot see.

Then switch to the clinician view:
- Log in as the prepared clinician account.
- Open the same screening from the doctor dashboard or review queue.
- Point at the quality warnings, task completion, and domain observations.
- If available, generate the explanation draft and note the review-required marker.

## Demo safety notes to say out loud

- The system records observations and a draft explanation; it does not output a diagnosis.
- A clinician must review before anything is shared.
- If any service is unavailable, the demo still uses a deterministic fallback.

## Failure handling during the demo

If something breaks, do not improvise a new feature in front of judges.
Instead say what was supposed to happen, what the fallback is, and why the breakage does not hide the spine.

## Sensor dependency map (verified against the current build)

The battery degrades in one specific place, not everywhere. Rehearse against this,
not against a guess:

| Task | Sensor needed | Behaviour when the sensor is absent |
| --- | --- | --- |
| game1 Focus Orbit (dot tracking) | Camera optional — the dot can also be clicked | Score falls back to `trackingAccuracy` alone; `fixationStability` stays null rather than being zeroed |
| game2 Cortex Match (card memory) | None | Fully scored |
| game3 Vocal Echo (spoken repeat) | Microphone | `MICROPHONE_UNAVAILABLE`, score null. Feeds no composite domain, so only the voice narrative is lost |
| game4 Mimic Sync (facial expression) | Camera, required | `CAMERA_UNAVAILABLE`, score null → attention domain null → **composite null** |
| game5 Path Mapper (trail making) | None — touch or number keys 1–6 | Fully scored |
| pianoSequence | None | Fully scored |

Domain mapping (`server/src/services/sessionScoring.ts`): memory = game2 + pianoSequence,
attention = game1 + game4, visuospatial = game5, executive = game5 + game2 + pianoSequence.

**The single point of failure is game4.** Losing the microphone does not break the
composite; losing the camera does, because attention depends on game4 and a null
domain makes the composite null (`complete: false`).

## Recommended run order for a live demo

1. Run the sensor preflight first (`SensorCheckStage`). Do not start the battery until it is green.
2. If the camera is available: run the full spine as written above.
3. If the camera is denied, do not abandon the screening and do not fabricate a result.
   Complete game2, game5 and the piano sequence — memory, visuospatial and executive are
   all genuinely measured — then narrate the gap **before** the results screen appears:
   "attention needs the camera, so the system records it as not measured and refuses to
   produce a composite. That refusal is the product."
4. Finish the walkthrough in the clinician portal. The demo workspace seeds sign-in accounts
   only — no synthetic assessments — so the review queue and longitudinal view show exactly
   the session you just completed (or an honest empty state if it was not saved). Say that
   aloud: the portal has no invented history to fall back on.

## Recording plan

Record the full three-minute walkthrough ahead of time on the hardware that will run it.
A recording removes camera, microphone, network and cold-start risk entirely, and it is the
only artefact that survives a broken venue connection. Suggested beats:

1. Patient demo sign-in and one measured activity (5s: what this is, not a diagnosis).
2. Arabic RTL check-in screen in its own right-to-left layout, with the draft/research-status notice visible.
3. Submission, then the patient-facing confirmation — what the patient can and cannot see.
4. Clinician portal: the same screening, quality warnings, per-domain coverage, review status.
5. The constrained explanation draft with its review-required marker.
6. The change-detection result at fewer than three comparable pairs: `NOT_ESTABLISHED`.

Record at 1080p, keep the file local as well as attached, and have it playable offline.

## The 60-second sensor-gap beat

This is the strongest sixty seconds you own, and it needs no camera to run. It turns the
product's least flattering moment — an incomplete battery — into the clearest proof of the
thing that distinguishes Neulens from every demo that fakes completeness.

### Reproduce it reliably

Block the camera **before** the session starts; the camera hook requests access on mount, so
a mid-session block recovers only by reloading the page.

1. Chrome → padlock icon → Site settings → **Camera: Block** → reload the tab.
   (`chrome://settings/content/camera` also works.)
2. Start the screening as the demo patient and pick English.
3. A permission banner appears at the top of the screening. Press **Continue and skip this activity**
   once, to dismiss it — otherwise it sits above every screen for the rest of the run.

### The beat, timed

| Time | Do | Say |
| --- | --- | --- |
| 0:00 | Sit on the permission banner. | "This machine has no camera. Most cognitive demos would either refuse to run or quietly make the number up. Watch what this one does instead." |
| 0:08 | Press **Continue and skip this activity**. Run game1 by clicking the dot five times. | "The dot task still runs and still scores — it just loses its eye-movement component, and it says so." |
| 0:16 | Complete game2 (card match) normally. | "Memory is fully measured. Nothing was lost here." |
| 0:21 | Run game3 (spoken repeat) if the microphone is allowed. If it is blocked too, keep moving — it records `MICROPHONE_UNAVAILABLE`. | "Voice is the one signal we are not claiming today. It isn't part of any composite domain either way." |
| 0:26 | Reach game4. Stop on the card. | Read the card aloud: **"Camera not available. This activity reads facial movement through the camera, so it cannot be scored without one. It will be recorded as not measured — the rest of the assessment still counts."** |
| 0:34 | Press **Continue without this activity**. | "That is the whole design. No stand-in number, no silent zero." |
| 0:38 | Play game5 with the keyboard, keys 1–6, quickly. Submit. | "Visuospatial and executive function are measured. Only attention is missing." |
| 0:45 | Patient dashboard. Point at the status chip **"More data needed"**. | "The patient is never shown a score that was partly invented." |
| 0:50 | Clinician review. Point at **"Not interpretable — no score recorded for this session."** then the limitations line. | Read it: **"Domains not measured in this session: attention (no camera). No score was substituted for a missing domain."** |
| 0:57 | Stop talking. Let it sit for two seconds. | "A system that can prove what it did not measure is the only kind you can audit later." |

### Trimming

The beat must land on the game4 card between 0:20 and 0:35. If game3 runs long, cut the
game2 line, not the card. If the judge's clock is short, drop the patient dashboard and go
straight from submission to the clinician limitation — the limitation line is the payoff
and the dashboard is the coda.

Do not cut the two silent seconds at the end. They are doing the work.

### Why this beat works

The card, the patient status and the clinician limitation are three layers of the same
decision, each visible to a different reader. It also pre-empts the question every panel
asks — *"what happens when it can't measure something?"* — by answering it before it is
asked, on screen, in the product's own words.

### If the card does not appear

- **The battery still shows a camera feed.** The block did not take. Re-check site settings
  and reload; do not proceed, or the beat has no gap to show.
- **A different banner is on screen.** You are seeing the microphone variant. Deny only the
  camera and reload.
- **You accidentally granted access.** Finish the run as a normal complete session and use the
  recorded clip for this beat instead. Do not try to undo it mid-demo.

## What not to say on stage

With limited time before submission, the temptation is to add a headline number to look
more finished. Do not. The audit trail is the differentiator, and each of these would
contradict it in front of a panel that includes clinicians:

- **Do not claim a diagnostic or predictive capability.** No risk score, no "detects
  decline", no accuracy figure. Sessions are described as screening observations that a
  clinician reviews.
- **Do not present the composite as a validated cognitive score.** It is an internal
  summary of recorded task performance, and it is deliberately null when a domain was
  not measured.
- **Do not quote simulated measures as outcomes.** Demo-workspace figures are fictional
  and must be introduced as simulated whenever they are shown.
- **Do not add an ML risk model to look more advanced.** It would replace the one
  defensible claim — deterministic scoring with a recorded reason for every absence —
  with an unvalidated one.
- **Do not describe Arabic task administration as validated.** Translation is not
  back-translation, pretesting or sign-off; use the readiness registry's own wording.
