# Neulens — Open-source posture

This repository is intended to run on a stack that is entirely open source and free of per-seat/platform licensing fees for the demo and for continued self-hosted development. If any dependency, provider, or file in this repo silently pulls in a commercial license, that is a bug.

## What must be fully open source

- Node.js runtime used for the backend and any build tooling
- Express web framework
- React and React DOM
- TypeScript
- Vite
- Tailwind CSS
- Prisma client and the Prisma CLI used to generate the client
- PostgreSQL client driver
- bcryptjs, jsonwebtoken, dotenv, cors, multer, zod
- FastAPI, Uvicorn, Pydantic, Pydantic Settings, httpx, python-multipart
- NumPy, SciPy, librosa
- Braintree/PayPal/restricted commercial voice or vision SDKs must not be required by default

## What is optional and must stay optional

- Ollama or any local model for explanation drafting. If the model is unavailable, the system must still work with a deterministic fallback.
- A local PostgreSQL instance is expected for persistence, but the demo must degrade in a controlled way if the database is unreachable.
- Any third-party voice conversion or transcription provider is optional and must not be the only path that keeps the screening results useful.

## What must never become a hidden commercial dependency

- Browser bundles must not inline service-role keys, model keys, or JWT secrets.
- The demo must not require a commercial account to complete the patient-to-clinician flow on localhost.
- Landmarks, signal processing, and scoring used in the default path must be available under permissive or otherwise acceptable open terms.

## Verification command

From the repository root:

```bash
cd client && npm ls --depth=0
cd ../server && npm ls --depth=0
cd ../ai-service && .venv/bin/pip list --format=columns
```

If you cannot install or run a component without accepting a commercial license, flag it here before treating the stack as fully open source.
