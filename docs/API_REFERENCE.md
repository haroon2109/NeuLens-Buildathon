# API Reference

Every endpoint group exposed by NeuLens. Split out of the README to keep the front door
readable; the content is unchanged.

---

## Endpoint groups

Base URL: `http://localhost:5000/api/v1` (or relative `/api/v1` via Vite proxy).

### System & Health

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | None | Service liveness probe. Returns HTTP 200 and server timestamp. |

---

### Authentication (`/auth`)

#### 1. Register User
* **Endpoint**: `POST /auth/register`
* **Auth**: None
* **Request Payload**:
```json
{
  "email": "dr.sharma@hospital.org",
  "password": "SecurePassword123!",
  "name": "Dr. Sarah Sharma",
  "age": 42,
  "gender": "FEMALE",
  "language": "ENGLISH"
}
```
* **Response (`201 Created`)**:
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c3e981ad-e612-4e44-bca5-b289cf422d14",
    "email": "dr.sharma@hospital.org",
    "name": "Dr. Sarah Sharma",
    "age": 42,
    "gender": "FEMALE",
    "language": "ENGLISH",
    "createdAt": "2026-10-24T15:30:00.000Z"
  }
}
```

#### 2. Login User
* **Endpoint**: `POST /auth/login`
* **Auth**: None
* **Request Payload**:
```json
{
  "email": "dr.sharma@hospital.org",
  "password": "SecurePassword123!"
}
```
* **Response (`200 OK`)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c3e981ad-e612-4e44-bca5-b289cf422d14",
    "email": "dr.sharma@hospital.org",
    "name": "Dr. Sarah Sharma"
  }
}
```

#### 3. Get Authenticated User Profile
* **Endpoint**: `GET /auth/me`
* **Auth**: `Bearer <token>`
* **Response (`200 OK`)**:
```json
{
  "user": {
    "id": "c3e981ad-e612-4e44-bca5-b289cf422d14",
    "email": "dr.sharma@hospital.org",
    "name": "Dr. Sarah Sharma",
    "age": 42,
    "gender": "FEMALE",
    "language": "ENGLISH"
  }
}
```

#### 4. Update Profile Demographics
* **Endpoint**: `PUT /auth/profile`
* **Auth**: `Bearer <token>`
* **Request Payload**:
```json
{
  "age": 43,
  "gender": "FEMALE",
  "language": "ENGLISH"
}
```
* **Response (`200 OK`)**:
```json
{
  "message": "Profile updated successfully",
  "user": { "id": "...", "age": 43, "gender": "FEMALE", "language": "ENGLISH" }
}
```

#### 5. Forgot Password Recovery
* **Endpoint**: `POST /auth/forgot-password`
* **Auth**: None
* **Request Payload**:
```json
{
  "email": "dr.sharma@hospital.org"
}
```
* **Response (`200 OK`)**:
```json
{
  "message": "If the email exists, a password reset link has been dispatched.",
  "debugResetLink": "http://localhost:5173/auth/reset-password?token=..."
}
```

---

### Patient Portal Endpoints (`/api/v1/patient`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/patient/register` | None | Patient portal registration. Generates collision-resistant Patient ID (`CV-2026-XXXXXX`). |
| `POST` | `/patient/login` | None | Patient portal authentication using Patient ID + PIN or birth year verification. |
| `GET` | `/patient/session` | `Bearer <token>` | Returns authenticated patient identity & assigned battery. |
| `POST` | `/patient/assessment` | `Bearer <token>` | The only assessment submission entry point. Score is derived server-side from `taskResponses`; returns the session record and clinician-review workflow state. |
| `GET` | `/patient/confirmation-card` | `Bearer <token>` | Downloads/prints patient ID confirmation slip with check-in timestamp. |

---

### Doctor Portal Endpoints (`/api/v1/doctor`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/doctor/login` | None | Clinician credentials authentication (1-click evaluation access available). |
| `GET` | `/doctor/dashboard` | `Bearer <token>` (Clinician) | Real-time database metrics: total patients, today's screenings, pending reviews, recent queue. |
| `GET` | `/doctor/patients` | `Bearer <token>` (Clinician) | Searchable patient directory by Patient ID or name, with risk filter (`ALL`, `LOW`, `MODERATE`, `HIGH`). |
| `GET` | `/doctor/patients/:id` | `Bearer <token>` (Clinician) | Complete clinical patient dossier with task-by-task recorded responses and longitudinal history. |
| `GET` | `/doctor/reports/:id` | `Bearer <token>` (Clinician) | Official clinical screening report with domain radar chart, AI interpretation, and review notes. |
| `PATCH` | `/doctor/reports/:id/review` | `Bearer <token>` (Clinician) | Updates review status (`PENDING_REVIEW`, `REVIEWED`, `FOLLOWUP_REQUIRED`) and signs neurologist notes. |

---

### Screenings (`/screenings`)

#### 1. Submit Screening Assessment
* **Endpoint**: `POST /screenings`
* **Auth**: `Bearer <token>`
* **Request Payload**:
```json
{
  "taskResponses": {
    "game1": { "score": 88 },
    "game2": { "score": 82 },
    "game3": { "score": 90 },
    "game4": { "score": 84 },
    "game5": { "score": 78 },
    "pianoSequence": { "score": 85 }
  },
  "reactionTime": 248.2,
  "blinkRate": 14.0,
  "fixationScore": 92.4,
  "speechRate": 142.0,
  "pauseScore": 88.0,
  "jitter": 0.11,
  "shimmer": 1.15,
  "symmetry": 95.8,
  "tremorScore": 8.4,
  "recommendation": "Session recorded. Clinician review required.",
  "doctorNotes": "Patient cooperative, high eye-tracking fixation hold."
}
```

There is no `overallScore` field: the score is computed server-side from `taskResponses`
(`server/src/services/sessionScoring.ts`). Sending one is rejected with `400`. A session
whose tasks do not cover all four domains stores `null` and is marked `NOT_INTERPRETABLE`.
* **Response (`201 Created`)**:
```json
{
  "message": "Assessment processed successfully",
  "assessment": {
    "id": "e4f802d1-7c91-4e78-8d02-123456789abc",
    "userId": "c3e981ad-e612-4e44-bca5-b289cf422d14",
    "date": "2026-10-24T15:35:00.000Z",
    "overallScore": 84.5,
    "reviewState": "NOT_REVIEWED",
    "eyeMetrics": {
      "reactionTime": 248.2,
      "blinkRate": 14.0,
      "fixationScore": 92.4
    },
    "voiceMetrics": {
      "speechRate": 142.0,
      "pauseScore": 88.0,
      "jitter": 0.11,
      "shimmer": 1.15
    },
    "faceMetrics": {
      "symmetry": 95.8,
      "tremorScore": 8.4
    },
    "report": {
      "recommendation": "Normal neurocognitive baseline. Re-evaluate in 12 months.",
      "doctorNotes": "Patient cooperative, high eye-tracking fixation hold."
    }
  }
}
```

#### 2. Get Screening History
* **Endpoint**: `GET /screenings`
* **Auth**: `Bearer <token>`
* **Response (`200 OK`)**:
```json
{
  "history": [
    {
      "id": "e4f802d1-7c91-4e78-8d02-123456789abc",
      "date": "2026-10-24T15:35:00.000Z",
      "overallScore": 84.5,
      "reviewState": "NOT_REVIEWED",
      "eyeMetrics": { "reactionTime": 248.2, "blinkRate": 14.0, "fixationScore": 92.4 },
      "voiceMetrics": { "speechRate": 142.0, "pauseScore": 88.0, "jitter": 0.11, "shimmer": 1.15 },
      "faceMetrics": { "symmetry": 95.8, "tremorScore": 8.4 },
      "report": { "recommendation": "Normal baseline." }
    }
  ]
}
```

#### 3. Get Specific Screening by ID
* **Endpoint**: `GET /screenings/:id`
* **Auth**: `Bearer <token>`
* **Response (`200 OK`)**:
```json
{
  "assessment": {
    "id": "e4f802d1-7c91-4e78-8d02-123456789abc",
    "userId": "c3e981ad-e612-4e44-bca5-b289cf422d14",
    "date": "2026-10-24T15:35:00.000Z",
    "overallScore": 84.5,
    "reviewState": "NOT_REVIEWED",
    "eyeMetrics": { "reactionTime": 248.2, "blinkRate": 14.0, "fixationScore": 92.4 },
    "voiceMetrics": { "speechRate": 142.0, "pauseScore": 88.0, "jitter": 0.11, "shimmer": 1.15 },
    "faceMetrics": { "symmetry": 95.8, "tremorScore": 8.4 },
    "report": { "recommendation": "Normal baseline." }
  }
}
```

---

### Analytics (`/analytics`)

#### 1. Retrieve Longitudinal Screening Trends
* **Endpoint**: `GET /analytics/trends`
* **Auth**: `Bearer <token>`
* **Response (`200 OK`)**:
```json
{
  "trends": {
    "labels": ["May 12", "Jun 14", "Jul 26", "Oct 24"],
    "datasets": {
      "overall": [78.0, 81.2, 84.0, 84.5],
      "reactionTime": [290.0, 275.4, 255.0, 248.2],
      "symmetry": [91.0, 93.4, 94.0, 95.8],
      "jitter": [0.14, 0.12, 0.12, 0.11]
    },
    "rawCount": 4
  }
}
```

---

### Voice & Speech AI (`/voice`) — Gnani AI Integration

#### 1. Service Health & Capabilities
* **Endpoint**: `GET /voice/health`
* **Auth**: None
* **Description**: Returns configuration and model status without making paid external calls.
* **Response (`200 OK`)**:
```json
{
  "status": "ok",
  "configured": true,
  "message": "Gnani AI speech engines active (Prisma STT v2.5 / Timbre TTS v2.5)",
  "stt": {
    "model": "Prisma v2.5 (v3 REST)",
    "endpoint": "/api/v1/voice/transcribe",
    "supportedLanguages": ["en", "ta", "hi", "te", "ml", "kn"]
  },
  "tts": {
    "model": "Timbre v2.5",
    "endpoint": "/api/v1/voice/synthesize",
    "supportedLanguages": ["en", "ta", "hi", "te", "ml", "kn"],
    "cacheEntries": 14
  },
  "evon": {
    "model": "gnani/gnani-evon-v3.3-30B-A3B",
    "available": false,
    "reason": "Disabled. Set EVON_INFERENCE_URL and confirm EVON_DATA_PROCESSING_APPROVED=true only after a privacy/data-processing review. Prefer the local FastAPI explanation endpoint."
  }
}
```

#### 2. Verified Voice Catalog
* **Endpoint**: `GET /voice/voices`
* **Auth**: None
* **Description**: Returns supported Indian languages and verified Timbre v2.5 voice identifiers.
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "languages": {
    "ta": { "languageCode": "ta", "bcp47": "ta-IN", "languageName": "Tamil", "defaultVoice": "Asmita", "availableVoices": ["Asmita", "Trisha", "Brinda", "Vedika", "Noopur"] },
    "hi": { "languageCode": "hi", "bcp47": "hi-IN", "languageName": "Hindi", "defaultVoice": "Nalini", "availableVoices": ["Nalini", "Deepak", "Poorvi"] },
    "en": { "languageCode": "en", "bcp47": "en-IN", "languageName": "English (Indian)", "defaultVoice": "Kaveri", "availableVoices": ["Kaveri", "Yashvi", "Arjun"] },
    "te": { "languageCode": "te", "bcp47": "te-IN", "languageName": "Telugu", "defaultVoice": "Suhana", "availableVoices": ["Suhana", "Lehara", "Lavanya", "Yukti", "Varuni"] },
    "kn": { "languageCode": "kn", "bcp47": "kn-IN", "languageName": "Kannada", "defaultVoice": "Saanvi", "availableVoices": ["Saanvi", "Kavin"] },
    "ml": { "languageCode": "ml", "bcp47": "ml-IN", "languageName": "Malayalam", "defaultVoice": "Reshma", "availableVoices": ["Reshma", "Riyaan"] }
  }
}
```

#### 3. Speech-to-Text Transcription (Gnani Prisma v2.5)
* **Endpoint**: `POST /voice/transcribe`
* **Auth**: None (Rate limited: 20 req/min)
* **Content-Type**: `multipart/form-data`
* **Payload Fields**:
  * `audio_file`: Audio recording binary (WAV, WebM, MP3 up to 15MB)
  * `language`: Language code (`ta`, `hi`, `en`, `te`, `kn`, `ml`, or BCP-47 tag)
  * `format`: Optional, `'transcribe'` (default) or `'detailed'`
  * `itnNativeNumerals`: Optional boolean (default: `true`)
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "transcript": "Cognitive markers and visual path tracings measure baseline motor coordination",
  "language": "en-IN",
  "requestId": "req_8b9f1d0a",
  "confidence": 0.94,
  "latencyMs": 284
}
```

#### 4. Text-to-Speech Synthesis (Gnani Timbre v2.5)
* **Endpoint**: `POST /voice/synthesize`
* **Auth**: None (Rate limited: 45 req/min)
* **Content-Type**: `application/json`
* **Request Payload**:
```json
{
  "text": "வணக்கம், நான் வழிகாட்டுவேன்.",
  "language": "ta",
  "voice": "Asmita",
  "speed": 0.95
}
```
* **Response (`200 OK`)**:
  * `Content-Type`: `audio/wav`
  * `X-Gnani-Voice`: `Asmita`
  * `X-Gnani-Language`: `ta-IN`
  * `X-Gnani-Cached`: `true` | `false`
  * Body: Binary WAV audio stream (24kHz linear PCM)

#### 5. Evon 30B Clinician Synthesis (Optional Gateway)
* **Endpoint**: `POST /voice/evon-summary`
* **Auth**: Clinician or admin bearer token
* **Description**: Optional clinical documentation summarizer powered by Evon 30B. Disabled (503 with a safe reason) unless `EVON_INFERENCE_URL` is set and `EVON_DATA_PROCESSING_APPROVED=true`. Accepts numeric scores only; age, identifiers, free text and transcripts are rejected. Output is always marked as a clinician-review draft.
* **Request Payload**:
```json
{
  "testScores": {
    "memoryScore": 85,
    "attentionScore": 90,
    "visuospatialScore": 80,
    "executiveScore": 78,
    "compositeScore": 83
  },
  "language": "en"
}
```
