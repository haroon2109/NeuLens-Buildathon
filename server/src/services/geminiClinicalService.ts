import crypto from 'crypto';
import { getLlmConfig } from './assistantLlm';
import { GeminiKeyPool } from './geminiService';
import { gemmaLocalService } from './google/gemmaLocalService';

export interface ClinicalInsightRequest {
  patient: {
    patientId: string;
    age: number;
    gender: string;
    educationYears?: number | null;
    language: string;
  };
  assessment: {
    id: string;
    date: string | Date;
    score: number;
    classification: string;
    sessionNumber?: number;
    repeatCount?: number;
  };
  metrics: {
    saccadicLatencyMs?: number | null;
    fixationHoldScore?: number | null;
    memoryMatchedPairs?: number | null;
    memoryMismatches?: number | null;
    speechRateWpm?: number | null;
    pitchHz?: number | null;
    facialSymmetryPct?: number | null;
    trailBCompletionSec?: number | null;
    sequencingErrors?: number | null;
  };
  context?: {
    dailyFunctionChange?: boolean;
    sleepIssues?: boolean;
    stressReported?: boolean;
    familyHistory?: string[];
    medications?: string[];
  };
  modelPreference?: 'gemini-2.5-flash' | 'gemma-2-2b' | 'auto';
}

export interface ClinicalInsightResponse {
  executiveSummary: string;
  domainFindings: {
    ocular: string;
    vocal: string;
    facial: string;
    executiveAndMemory: string;
  };
  differentialConsiderations: string[];
  recommendedActions: string[];
  vernacularWorkerAdvice?: string;
  modelUsed: string;
  provider: 'google-gemini' | 'google-gemma-local' | 'deterministic-clinician-model';
  generatedAt: string;
  cached?: boolean;
}

// In-Memory Credit-Guard Cache (Preserves Hackathon Quotas & Eliminates Duplicate Billing)
const clinicalInsightCache = new Map<string, { data: ClinicalInsightResponse; timestamp: number }>();

function generateCacheKey(data: ClinicalInsightRequest, modelChoice: string): string {
  const raw = `${data.patient.patientId}:${data.assessment.id}:${data.assessment.score}:${modelChoice}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Synthesize offline clinical reasoning adhering to Google Gemma 2 (2B)
 * instruction fine-tuning tags (<start_of_turn>user ... <end_of_turn><start_of_turn>model).
 */
async function generateGemma2Insight(data: ClinicalInsightRequest): Promise<ClinicalInsightResponse> {
  const result = await gemmaLocalService.triage(
    {
      patientId: data.patient.patientId,
      age: data.patient.age,
      gender: data.patient.gender,
      educationYears: data.patient.educationYears,
      language: data.patient.language
    },
    {
      id: data.assessment.id,
      date: data.assessment.date,
      score: data.assessment.score,
      classification: data.assessment.classification,
      saccadicLatencyMs: data.metrics.saccadicLatencyMs,
      fixationHoldScore: data.metrics.fixationHoldScore,
      speechRateWpm: data.metrics.speechRateWpm,
      pitchHz: data.metrics.pitchHz,
      facialSymmetryPct: data.metrics.facialSymmetryPct,
      trailBCompletionSec: data.metrics.trailBCompletionSec,
      sequencingErrors: data.metrics.sequencingErrors,
      memoryMatchedPairs: data.metrics.memoryMatchedPairs
    }
  );

  return {
    executiveSummary: result.executiveSummary,
    domainFindings: result.domainFindings,
    differentialConsiderations: result.differentialConsiderations,
    recommendedActions: result.recommendedActions,
    modelUsed: result.modelUsed,
    provider: 'google-gemma-local',
    generatedAt: new Date().toISOString()
  };
}

export async function generateClinicalInsight(data: ClinicalInsightRequest): Promise<ClinicalInsightResponse> {
  const modelChoice = data.modelPreference || 'gemini-2.5-flash';
  const cacheKey = generateCacheKey(data, modelChoice);

  // Credit-Guard: Instant cache retrieval (Preserves $5 credit pool)
  const cached = clinicalInsightCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 86400000) {
    return {
      ...cached.data,
      cached: true
    };
  }

  // Route 1: Offline Edge Rural PHC Mode -> Google Gemma 2 (2B)
  if (modelChoice === 'gemma-2-2b') {
    const result = await generateGemma2Insight(data);
    clinicalInsightCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  // Route 2: Cloud Multimodal Copilot -> Google Gemini 2.5 Flash
  const config = getLlmConfig();
  const hasGemini = Boolean(config.apiKey);

  if (hasGemini) {
    try {
      const prompt = `You are the Google Gemini 2.5 Clinical Decision Support Copilot for NeuLens, an exploratory neurological and cognitive screening platform.
Analyze the following objective patient multimodal screening telemetry and produce a clinical pre-consultation synthesis for the attending neurologist or physician.

PATIENT PROFILE:
- ID: ${data.patient.patientId}
- Age: ${data.patient.age} | Gender: ${data.patient.gender} | Education: ${data.patient.educationYears ?? 'Unspecified'} years
- Language: ${data.patient.language}

ASSESSMENT TELEMETRY:
- Screening Date: ${new Date(data.assessment.date).toLocaleDateString()}
- Composite Score: ${data.assessment.score}/100 (${data.assessment.classification})
- Session Index: Sitting #${data.assessment.sessionNumber ?? 1} (Historical Repeats: ${data.assessment.repeatCount ?? 0})

BIOMETRIC MODALITY METRICS:
1. Ocular (MediaPipe Sub-pixel Gaze Tracking):
   - Saccadic Latency: ${data.metrics.saccadicLatencyMs ?? 'N/A'} ms
   - Fixation Stability Index: ${data.metrics.fixationHoldScore ?? 'N/A'}%
2. Vocal Acoustics & Prosody (Web Audio FFT):
   - Speech Rate: ${data.metrics.speechRateWpm ?? 'N/A'} WPM
   - Mean Fundamental Pitch: ${data.metrics.pitchHz ?? 'N/A'} Hz
3. Facial Kinematics (MediaPipe 478 3D Mesh):
   - Bilateral Symmetry Index: ${data.metrics.facialSymmetryPct ?? 'N/A'}%
4. Psychomotor & Executive (Digital Trail Making B & Matrix Recall):
   - Memory Recall: ${data.metrics.memoryMatchedPairs ?? 'N/A'} pairs matched (${data.metrics.memoryMismatches ?? 'N/A'} errors)
   - Trail Making Part B: ${data.metrics.trailBCompletionSec ?? 'N/A'} seconds (${data.metrics.sequencingErrors ?? 'N/A'} sequencing errors)

HEALTH & LIFESTYLE CONTEXT:
- Daily Function Drift Reported: ${data.context?.dailyFunctionChange ? 'YES' : 'None reported'}
- Sleep Disturbances: ${data.context?.sleepIssues ? 'YES' : 'Normal'}
- Reported Stress/Mood Drift: ${data.context?.stressReported ? 'YES' : 'Normal'}
- Recorded Family History: ${data.context?.familyHistory?.join(', ') || 'None reported'}
- Current Active Medications: ${data.context?.medications?.join(', ') || 'None recorded'}

REQUIRED INSTRUCTIONS:
- Synthesize all 4 sensor modalities in relation to the patient's age and education level.
- Highlight any discrepancy between motor/ocular speed and executive sequencing.
- Return ONLY a valid JSON object matching this schema without markdown fences:
{
  "executiveSummary": "2-3 concise sentences summarizing key clinical observations.",
  "domainFindings": {
    "ocular": "Clinical summary of gaze/saccade stability.",
    "vocal": "Clinical summary of speech prosody and tempo.",
    "facial": "Clinical summary of facial symmetry and dynamic tone.",
    "executiveAndMemory": "Clinical summary of working memory and psychomotor sequencing speed."
  },
  "differentialConsiderations": [
    "Differential consideration 1 (e.g., Mild Cognitive Impairment amnestic vs non-amnestic)",
    "Differential consideration 2 (e.g., Sensory-motor fatigue / sleep disruption impact)"
  ],
  "recommendedActions": [
    "Action 1 (e.g., Schedule formal in-person MoCA / ACE-III assessment)",
    "Action 2 (e.g., Sleep hygiene and blood pressure review)"
  ]
}`;

      const pool = GeminiKeyPool.getInstance();
      const result = await pool.executeWithFailover(async (activeKey) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeKey}`
          },
          body: JSON.stringify({
            model: config.model || 'gemini-2.5-flash',
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: 'You are an expert clinical neurologist AI copilot. Provide structured, evidence-grounded decision support JSON. Never invent unmeasured numbers.'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`Gemini upstream error: HTTP ${res.status}`);
        }

        const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = payload.choices?.[0]?.message?.content?.trim();
        if (!content) {
          throw new Error('Empty response from Gemini');
        }

        const parsed = JSON.parse(content);
        return {
          executiveSummary: parsed.executiveSummary || 'Multimodal screening data processed.',
          domainFindings: parsed.domainFindings || {
            ocular: 'Ocular observations recorded.',
            vocal: 'Acoustic prosody recorded.',
            facial: 'Facial landmarks tracked.',
            executiveAndMemory: 'Executive and memory tasks recorded.'
          },
          differentialConsiderations: parsed.differentialConsiderations || ['Correlate with formal clinical cognitive instrument.'],
          recommendedActions: parsed.recommendedActions || ['Review findings with the patient in upcoming consultation.'],
          modelUsed: config.model || 'gemini-2.5-flash',
          provider: 'google-gemini' as const,
          generatedAt: new Date().toISOString()
        };
      });

      if (result) {
        // Store in credit-guard cache
        clinicalInsightCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    } catch (err) {
      console.warn('[GeminiClinicalService]: Gemini API failed, falling back to Google Gemma 2B edge synthesis:', err);
    }
  }

  // Graceful fallback to Google Gemma 2 (2B) on-device edge synthesis
  const fallbackResult = await generateGemma2Insight(data);
  clinicalInsightCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}
