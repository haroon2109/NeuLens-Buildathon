# NeuLens — deployed topology and trust boundaries

One page for reviewers: what runs where, and what credential guards each hop.
Companion to [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (component detail) and
[`UAE_DEPLOYMENT_CHECKLIST.md`](UAE_DEPLOYMENT_CHECKLIST.md) (deploy settings).

## Services

```mermaid
flowchart LR
    subgraph B["Browser (patient or clinician)"]
        SPA["React 18 SPA<br/>Vite build served by the API"]
        EDGE["On-device processing<br/>MediaPipe landmarks · Web Audio FFT<br/>Web Speech API (wake word, STT)"]
        SPA --- EDGE
    end

    subgraph N["cognivision-ai — Node 20 / Express 4 (Render)"]
        API["REST API /api/v1/*<br/>auth · patient · doctor · screening<br/>longitudinal · change detection · appointments"]
        ASST["Assistant proxy<br/>skill selection + SSE"]
        VOICE["Voice proxy<br/>STT / TTS queue + daily budget"]
        API --- ASST
        API --- VOICE
    end

    subgraph P["neulens-ai — FastAPI (Render, Python 3.12)"]
        ACOU["Acoustic feature extraction<br/>librosa · parselmouth · Silero VAD"]
        SCORE["Feature scoring & explanation<br/>returned as observations, not verdicts"]
        ACOU --- SCORE
    end

    DB[("PostgreSQL<br/>Prisma · 17 models")]
    GNANI["Gnani AI<br/>STT + TTS"]
    LLM["Any OpenAI-compatible<br/>chat endpoint"]
    MAIL["Resend<br/>verification email"]

    SPA -- "HttpOnly session cookie (JWT)" --> API
    SPA -- "audio blob + Supabase JWT" --> ACOU
    API -- "Prisma" --> DB
    API -- "Bearer key (server-held)" --> VOICE
    VOICE -- "Bearer key (server-held)" --> GNANI
    API -- "Bearer key (server-held)" --> ASST
    ASST -- "provider key (server-held)" --> LLM
    API -- "server key" --> MAIL
    API -- "X-Internal-Key + JWT forward" --> ACOU
```

## What crosses each boundary

| Hop | Credential | Never crosses |
| --- | --- | --- |
| Browser → Node API | HttpOnly, SameSite session cookie containing a short-lived JWT; role checked per route (`requireRole(['PATIENT'])`) | Provider keys, other patients' records |
| Browser → Python service | The patient's Supabase JWT, verified against Supabase JWKS, plus an allow-listed origin | Node's internal key, database credentials |
| Node → Python | `AI_SERVICE_INTERNAL_KEY` shared secret, matching `INTERNAL_API_KEY` | Public internet exposure of the Python service |
| Node → Gnani / LLM / Resend | Server-side environment variables only (`sync: false` in `render.yaml`) | Any key reaching the browser bundle |
| Node → Postgres | `DATABASE_URL` injected by Render | PHI in logs or the client |

## Request paths worth knowing

```mermaid
sequenceDiagram
    autonumber
    participant U as Patient
    participant S as SPA
    participant A as Node API
    participant D as Postgres
    participant L as LLM provider

    U->>S: speaks or types a question
    S->>S: deterministic command match (navigation, language, repeat)
    alt command recognised
        S-->>U: acts locally, no network
    else open-ended question
        S->>A: POST /assistant/chat/stream (cookie + route + page title)
        A->>A: select skills, build prompt (base + matched skill bodies)
        A->>L: chat completion, streamed
        L-->>A: tokens
        A-->>S: SSE deltas
        S-->>U: speaks sentence by sentence
    end
    A->>D: audit log entry for the interaction
```

## Trust boundaries in one line each

- **The browser is untrusted.** All access control, rate limiting and prompt safety rules are enforced server-side; the client only hides controls.
- **Clinical interpretation stops at the clinician.** The assistant may explain what a score or page is, never whether it is good, bad or diagnostic.
- **Raw media stays on the device.** Only derived features and, for the speech tasks, the recorded audio needed for acoustic analysis are sent — no continuous recording or camera capture.
- **Degradation is visible, not silent.** No database → in-memory demo fallback and `/health` reports 503; no Gnani key → silent replies with written answers; no LLM → scripted replies.
