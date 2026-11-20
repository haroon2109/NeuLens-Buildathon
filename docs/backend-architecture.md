# Backend architecture — Supabase + FastAPI

This document describes the open-source, free-tier backend stack added for
Neulens and how it relates to the existing Express API.

## Target flow

```
                     Browser (React + Vite)
                              |
             Supabase access token (JWT)
                              |
        +---------------------+---------------------+
        |                                           |
        v                                           v
Supabase Auth / PostgREST                  FastAPI AI service
(Postgres + RLS, Storage, Realtime)        (voice, ocular, facial,
        |                                   cognitive, longitudinal)
        |                                           |
        |                  service-role key         |
        +----------------------<--------------------+
                              |
                              v
                     PostgreSQL (Supabase)
```

The browser never receives a service-role key, and never calls a model provider
directly. AI processing runs in FastAPI, which holds provider keys and the
service-role key, and writes results through RLS-bypassing server credentials.

## Components

| Layer | Choice | Licence |
| --- | --- | --- |
| Database | PostgreSQL (Supabase) | PostgreSQL licence (open source) |
| Auth | Supabase Auth (GoTrue) | Apache-2.0 / MIT |
| API layer | Supabase PostgREST + RLS | Apache-2.0 |
| File storage | Supabase Storage | Apache-2.0 |
| Realtime | Supabase Realtime | Apache-2.0 |
| AI service | FastAPI + Pydantic | MIT |
| Auth verification | PyJWT (JWKS) | MIT |

## Roles and access

* `PATIENT` — reads and creates only their own records.
* `CLINICIAN` — reads patients they have a `care_relationships` row for.
* `INSTITUTION` — reads patients whose `institution_id` matches theirs.
* `ADMIN` — full access, and the only role that can change roles.

Enforcement exists in two places on purpose: RLS in PostgreSQL is the
guarantee, and the FastAPI `require_clinician` / `require_self_or_clinician`
guards stop the request before any work is done. A missing guard in one layer
does not expose data through the other.

## Clinical safety rules encoded in the schema/service

1. **No disease probability.** Assessment rows store observations
   (`overall_score`, domain metrics, quality) and review status. There is no
   `risk_probability` column, and the AI service returns
   `model_inference: false` until validated models are configured.
2. **First assessment is a provisional baseline.** `baselines.is_active` is
   unique per patient; `change_detections` requires a baseline and at least
   three comparable repeat pairs before a reliable-change threshold exists. With
   fewer, no score-based change is reported and the record states that reliability
   is not established; the observed spread is never used as a threshold.
3. **Poor quality is never a decline.** Non-comparable sessions are excluded
   from the comparison window and the status becomes `INSUFFICIENT_DATA`.
4. **Clinicians own actions.** AI writes observations and review prompts;
   only clinicians write `review_status`, reports, care plans and referrals.

## Environment variables

### Client (`client/.env`) — public values only

```env
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_AI_SERVICE_URL=http://localhost:8000
```

### AI service (`ai-service/.env`) — server-side secrets

```env
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_JWKS_URL=https://<ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_AUDIENCE=authenticated
ALLOWED_ORIGINS=http://localhost:5173
GNANI_API_KEY=<provider key>
ENABLE_MODEL_INFERENCE=false
INTERNAL_API_KEY=<long random value, shared with the Express API>
```

### Express (`server/.env`) — server-side secrets

```env
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_INTERNAL_KEY=<same value as INTERNAL_API_KEY>
```

The Express API forwards recorded speech to
`POST /api/v1/voice/acoustics` → FastAPI `POST /v1/ai/voice/acoustics`. Patient
portal sessions are authenticated by the Express API rather than Supabase, so
the shared key authenticates that server-to-server call; it must never be
exposed to a browser.

`VITE_*` variables are inlined into the JavaScript bundle. Anything secret must
not be prefixed with `VITE_`.

## Migration path from the Express API

The existing Express server (`server/`) remains the working API during the
transition: JWT auth, Prisma/PostgreSQL, screening persistence, voice proxy.

1. **Schema** — `supabase/migrations/0001_init.sql` mirrors the Prisma models
   with Supabase-specific additions (profiles, care relationships, documents,
   notifications). Existing Prisma tables can be moved with
   `prisma migrate diff` or kept side-by-side during the pilot.
2. **Auth** — new sign-ups can move to Supabase Auth first; `useAuthStore`
   accepts any payload with a role, so a Supabase session can be mapped into it
   behind a flag while Express-issued JWTs keep working.
3. **Client data** — TanStack Query hooks (`usePatientOverview`,
   `useDoctorPatient`) are the single seam: swapping their `queryFn` from
   `fetch('/api/v1/...')` to a Supabase query changes no screen.
4. **AI** — start calling `aiServiceApi.analyze*` from the screening flow when
   Supabase auth is enabled; the Express voice proxy can then be retired.

## Local development

```bash
supabase start                                  # local Postgres/Auth/Storage
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2)" -f supabase/migrations/0001_init.sql

cd ai-service && .venv/bin/uvicorn app.main:app --reload --port 8000
cd client && npm run dev
```
