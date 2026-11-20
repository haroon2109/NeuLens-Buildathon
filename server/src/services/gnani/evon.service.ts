/**
 * Gnani Evon 30B Reasoning Model Service (Optional Evaluation Service)
 *
 * Model: gnani/gnani-evon-v3.3-30B-A3B (Hugging Face)
 * Architecture: Hybrid Mamba-Transformer Mixture-of-Experts (30B total, ~3.5B active/token)
 *
 * NOTE: As per healthcare software architecture standards and the project specifications:
 * - Evon is an optional clinician-facing synthesis service and NEVER autonomously diagnoses
 *   or modifies validated Brain Health Index (BHI) risk stratifications.
 * - This service connects to an external inference endpoint if EVON_INFERENCE_URL /
 *   HUGGINGFACE_API_KEY is configured. It does not download model weights locally.
 */

export interface EvonSummaryRequest {
  testScores: {
    memoryScore: number;
    attentionScore: number;
    visuospatialScore: number;
    executiveScore: number;
    compositeScore: number;
  };
  speechAcoustics?: {
    jitter?: number;
    shimmer?: number;
    pitch?: number;
    speechRate?: number;
  };
  language: string;
}

export interface EvonSummaryResponse {
  available: boolean;
  model: string;
  summary?: string;
  clinicalNote?: string;
  reason?: string;
  latencyMs?: number;
  /** Always true: nothing in this response is approved for patient display. */
  requiresClinicianReview?: boolean;
  deidentified?: boolean;
}

const REVIEW_NOTE =
  'Draft for clinician review. Not a diagnosis, disease probability or treatment recommendation.';

const BANNED_OUTPUT = /dementia|alzheimer|diagnos|probab|predict|impair|declin|treat|medicat|cure/i;

export class GnaniEvonService {
  private inferenceUrl: string | null;
  private apiKey: string | null;
  private externalProcessingApproved: boolean;

  constructor() {
    this.inferenceUrl = process.env.EVON_INFERENCE_URL || null;
    this.apiKey = process.env.EVON_API_KEY || process.env.HUGGINGFACE_API_KEY || null;
    // Sending assessment data to a third-party model API requires a privacy
    // and data-processing arrangement. Without an explicit opt-in, stay off.
    this.externalProcessingApproved = process.env.EVON_DATA_PROCESSING_APPROVED === 'true';
  }

  public isAvailable(): boolean {
    return Boolean(
      this.inferenceUrl &&
        this.inferenceUrl.trim().length > 0 &&
        this.externalProcessingApproved
    );
  }

  public getStatus() {
    return {
      model: 'gnani/gnani-evon-v3.3-30B-A3B',
      available: this.isAvailable(),
      reason: this.isAvailable()
        ? 'External inference gateway configured; numeric scores only, clinician review required'
        : 'Disabled. Set EVON_INFERENCE_URL and confirm EVON_DATA_PROCESSING_APPROVED=true only after a privacy/data-processing review. Prefer the local FastAPI explanation endpoint.'
    };
  }

  /**
   * Generate an optional structured clinical synthesis draft for licensed neurologist review.
   */
  public async generateClinicianDraft(request: EvonSummaryRequest): Promise<EvonSummaryResponse> {
    const startTime = Date.now();

    if (!this.isAvailable()) {
      return {
        available: false,
        model: 'gnani/gnani-evon-v3.3-30B-A3B',
        reason: 'External synthesis is disabled. Configure EVON_INFERENCE_URL and set EVON_DATA_PROCESSING_APPROVED=true only after a privacy review; or use the local FastAPI explanation endpoint.',
        latencyMs: 0
      };
    }

    try {
      const response = await fetch(this.inferenceUrl as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          inputs: `System: You are an assistive clinical documentation synthesizer. Draft a factual, neutral summary for a neurologist. ` +
                  `Do not diagnose, predict disease, recommend treatment, or invent numbers. ` +
                  `Only restate the scores provided.\n` +
                  `Scores: Composite ${request.testScores.compositeScore}%, Memory: ${request.testScores.memoryScore}%, ` +
                  `Attention: ${request.testScores.attentionScore}%, Spatial: ${request.testScores.visuospatialScore}%.`,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.2
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Evon inference returned HTTP ${response.status}`);
      }

      const data = await response.json() as any;
      const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text || '';

      // A generated summary that strays into diagnosis or invented values is
      // discarded rather than shown to a clinician as if it were verified.
      if (typeof text !== 'string' || !text.trim() || BANNED_OUTPUT.test(text)) {
        return {
          available: false,
          model: 'gnani/gnani-evon-v3.3-30B-A3B',
          reason: 'Generated draft failed the clinical-language guardrail; use the deterministic summary.',
          requiresClinicianReview: true,
          deidentified: true,
          latencyMs: Date.now() - startTime
        };
      }

      return {
        available: true,
        model: 'gnani/gnani-evon-v3.3-30B-A3B',
        summary: `${text.trim()}\n\n${REVIEW_NOTE}`,
        clinicalNote: REVIEW_NOTE,
        requiresClinicianReview: true,
        deidentified: true,
        latencyMs: Date.now() - startTime
      };
    } catch (err: any) {
      console.warn('[GnaniEvonService]: Evon request failed:', err.message);
      return {
        available: false,
        model: 'gnani/gnani-evon-v3.3-30B-A3B',
        reason: err.message,
        latencyMs: Date.now() - startTime
      };
    }
  }
}

export const gnaniEvonService = new GnaniEvonService();
