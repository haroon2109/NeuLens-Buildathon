# AI explanations and report generation

The platform separates two jobs that are easy to confuse:

1. **Deterministic scoring** decides what the assessment recorded. It lives in
   `ai-service/app/services/scoring.py` and `features.py` and uses fixed,
   testable code. No language model contributes to a score, a change status or
   a review prompt.
2. **Constrained explanation** rewrites those already-computed observations in
   plain language. It cannot add, remove or change a number, and its output is a
   draft that a clinician must review before anyone shares it.

An LLM is never asked whether a person has cognitive impairment, and its prose
is never stored as a clinical result.

## Endpoint

`POST /v1/ai/explanation` on the FastAPI service. Clinician role required.

```json
{
  "audience": "patient",
  "metrics": {
    "memory_accuracy": 82,
    "attention_response_time_ms": 640
  },
  "session_count": 3,
  "quality": "good"
}
```

Allowed metric keys are a closed enum in `ai-service/app/schemas.py`:

`memory_accuracy`, `attention_response_time_ms`,
`visuospatial_completion_seconds`, `executive_errors`, `composite_score`,
`speech_rate_syllables_per_minute`, `pause_count`, `pitch_jitter_percent`,
`shimmer_percent`, `gaze_fixation_score`, `tracking_quality_score`.

There is deliberately no free-text field. When the caller has a transcript,
patient name, patient ID, date of birth or clinician note, it stays in the
platform database and is not part of this request.

Response:

```json
{
  "text": "The memory-task accuracy recorded was 82%. ... A healthcare professional should interpret them with you.",
  "provider": "deterministic",
  "model": null,
  "review_required": true,
  "guardrail": "model_unavailable",
  "note": "Draft for clinician review. Not a diagnosis, disease probability or treatment recommendation."
}
```

`provider` is `ollama` when a local model produced the draft and
`deterministic` when the template was used. Both are drafts; neither is a
clinical opinion.

## Local model deployment

The default provider is [Ollama](https://ollama.com) on `localhost`, so
assessment data stays inside the deployment. Any of the recommended
open-weights families can be used:

```bash
ollama pull qwen2.5:3b     # default; small and fast
# alternatives
ollama pull llama3.2:3b
ollama pull gemma2:2b
ollama pull mistral:7b
```

Set the model and endpoint in `ai-service/.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_TIMEOUT_SECONDS=20
```

When the AI service runs in a container and Ollama runs on the host, point
`OLLAMA_BASE_URL` at the host gateway (for example
`http://host.docker.internal:11434`) and keep the port off the public internet.

Check the model's licence before commercial deployment. Several open-weight
families have community licences with usage conditions, so "open weights" is
not the same as "unrestricted commercial use".

## Running the local model-assisted demo

Nothing needs to be enabled in code. The explanation route calls Ollama at
`OLLAMA_BASE_URL` on every request and falls back to the deterministic template
when the call fails, so the only precondition for a model-assisted draft is a
reachable model.

`ENABLE_MODEL_INFERENCE` does **not** gate this path. It controls the reported
capability and health payload only:

- `/health` reports it as `model_inference`
- the capability list reports `pipeline="model_inference", available=<flag>`

Because it is unrelated to drafting, a deployment with
`ENABLE_MODEL_INFERENCE=false` still produces Ollama drafts if a model is
reachable, and a deployment with it set to `true` still produces templates if
Ollama is not running. Do not use it to explain which provider produced a
report; read the `provider` field instead.

### Steps

Ollama and the AI service are separate processes, so use two terminals.

```bash
# terminal 1
ollama serve
ollama pull qwen2.5:3b     # once per machine
```

```env
# ai-service/.env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

```bash
# terminal 2
cd ai-service
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Confirm the model is up before generating a report:

```bash
ollama list                                  # qwen2.5:3b present
curl -s localhost:11434/api/tags | head -c 200
```

### Confirming which provider drafted the text

The draft panel in the clinician report view prints a `Provider:` badge next to
the returned `provider` and `model` values. On a working local run it reads
`Provider: ollama` with the model name; when the template was used it reads
`Provider: deterministic`. This is the fastest way to check the setup, and it
makes the fallback visible during a demo rather than hidden.

### What a rejected draft looks like

`qwen2.5:3b` is small and will occasionally emit a sentence the guardrail
rejects, for example a diagnostic term or a number that was not in the supplied
observations. The response is then the deterministic template with
`provider: deterministic` and `guardrail: rejected`.

That is the design working, not a setup failure. There is no retry with a
looser prompt, by intention. Say so during a demo instead of regenerating until
the badge happens to read `ollama`.

### Before a demo

Do a full dry run on the demo machine the day before. If `ollama serve` is not
running or the model was never pulled, the `.env` values point at nothing and
every draft silently falls back to the template, which looks like the feature is
missing entirely.

For a hosted deployment, the same applies: the service can only reach a model on
the address it is given. A deployment that does not run Ollama next to the AI
service returns `provider: deterministic` for every request, whatever
`ENABLE_MODEL_INFERENCE` says. Keep the port off the public internet if the
model is reached over a network.

## Guardrails enforced in code

`ai-service/app/services/explanation.py` applies all of these before returning a
model draft:

| Guardrail | Behaviour |
| --- | --- |
| Closed metric enum | Unknown keys and free text are rejected with 422 |
| `extra="forbid"` | Attempts to include names, transcripts or IDs are rejected, not silently dropped |
| Clinician-only route | A patient token receives 403 |
| Diagnostic language filter | Dementia, Alzheimer's, diagnosis, probability, prediction, decline, impairment, disease, treatment, medication, cure and risk terms cause rejection |
| Numeric fidelity | Every number in the model output must already exist in the supplied observations; invented values cause rejection |
| Length cap | Overlong output is rejected |
| Quality gating | An `insufficient`-quality session is described as not comparable; it is never described as change |
| Fixed disclaimer | The review note is appended server-side and cannot be overridden by the model |
| Offline fallback | Any network error, timeout or malformed response returns the deterministic template |

A rejected draft is not retried with a looser prompt. The deterministic
template is returned instead, so the clinician still gets a factual summary.

## Deterministic fallback

The fallback is built from the same numbers and does not mention risk,
diagnosis or decline. It states the metric values, the number of comparable
sessions, the quality limitation when present, and that a clinician should
interpret the results. This is also the behaviour when Ollama is not installed.

## External model APIs

The older optional Evon gateway is not the recommended path. It is disabled
unless all of the following are true:

```env
EVON_INFERENCE_URL=<approved endpoint>
EVON_DATA_PROCESSING_APPROVED=true
```

It accepts numeric scores only (the request schema is strict and rejects age,
identifiers, free text and transcripts), requires a clinician token, filters
diagnostic output, and appends a review note. Sending any health data to a
third-party API still requires an appropriate privacy, security and
data-processing arrangement; the flag is an engineering gate, not that
arrangement.

Never place a provider API key in a `VITE_*` variable. The browser only calls
the platform API.

## Clinician review workflow

1. Deterministic scoring computes the values and quality status.
2. The clinician requests a draft for patient or clinician audience.
3. The draft is shown with the `review_required` marker and the evidence
   values, so the clinician can compare prose with numbers.
4. The clinician edits, approves or discards it. Only approved text may be
   shared with a patient or included in a report.
5. The assessment record and report retain the deterministic values; the
   explanation is auxiliary text, not a result field.

The FastAPI endpoint and guardrails are wired into the clinician report screen
(`DoctorReportViewPage`) as an editable draft panel. The draft is never saved or
shared until the clinician approves it; the deterministic values remain the
record of record.

## What the model must never do

- Decide impairment, dementia or disease probability.
- Change, round or infer a score.
- Recommend treatment or medication.
- See names, patient IDs, dates of birth, addresses, transcripts or free-text
  clinician notes.
- Produce text that is treated as final without clinician review.

## Tests

```bash
cd ai-service && .venv/bin/python -m pytest tests/test_explanation.py -q
```

The tests cover offline fallback, diagnostic-language rejection, invented
numbers, faithful output, and the insufficient-quality rule. API tests also
verify the clinician-only guard and rejection of extra identifier fields.
