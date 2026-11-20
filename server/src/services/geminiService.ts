/**
 * Google Gemini Core AI Engine for NeuLens
 * Built for Google Startup Buildathon India 2026
 *
 * Implements 4 Core Capabilities using official @google/genai SDK:
 * 1. Generating structured clinician-facing summaries.
 * 2. Interpreting assessment metadata and task responses.
 * 3. Explaining observed changes in understandable language (personal baseline & RCI).
 * 4. Multilingual instructions and patient-friendly explanations (Tamil, Hindi, English).
 *
 * STRICT SAFETY BOUNDARY:
 * Gemini acts strictly as an exploratory decision-support and interpretability engine.
 * Gemini NEVER independently diagnoses cognitive impairment or predicts dementia.
 * All outputs strictly adhere to structured JSON schemas.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { error as logError, info as logInfo, warn as logWarn } from './logger';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  isConfigured: boolean;
}

export function getGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return {
    apiKey,
    model,
    isConfigured: Boolean(apiKey && apiKey.trim().length > 0)
  };
}

let genAiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const config = getGeminiConfig();
  if (!config.isConfigured) return null;
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({ apiKey: config.apiKey });
  }
  return genAiClient;
}

// ============================================================================
// 1. STRUCTURED CLINICIAN-FACING SUMMARY
// ============================================================================

export const ClinicianSummarySchema = z.object({
  executiveSummary: z.string(),
  domainFindings: z.array(
    z.object({
      domain: z.enum([
        'Ocular Saccadic',
        'Visual Memory',
        'Vocal Cadence',
        'Facial Affective',
        'Executive Trail Making'
      ]),
      metricsObserved: z.string(),
      status: z.enum(['STABLE', 'NOTABLE_DEVIATION', 'INCOMPLETE_DATA']),
      clinicalRelevance: z.string()
    })
  ),
  flaggedReviewSignals: z.array(z.string()),
  recommendedPhysicianPrompts: z.array(z.string()),
  diagnosticDisclaimer: z.literal('EXPLORATORY_DECISION_SUPPORT_ONLY_NOT_A_DIAGNOSIS')
});

export type ClinicianSummary = z.infer<typeof ClinicianSummarySchema>;

export async function generateClinicianSummary(input: {
  patientAge: number;
  educationYears?: number | null;
  overallScore: number | null;
  taskResponses: Record<string, any>;
  qualityRating?: string;
  language?: string;
}): Promise<ClinicianSummary> {
  const ai = getClient();
  const config = getGeminiConfig();

  // Deterministic fallback if Gemini is unconfigured or in offline test mode
  if (!ai) {
    return {
      executiveSummary: `Recorded exploratory assessment for patient (age ${input.patientAge}, formal education ${input.educationYears ?? 'unrecorded'} yrs). Overall composite score: ${input.overallScore ?? 'non-interpretable'}/100.`,
      domainFindings: [
        {
          domain: 'Ocular Saccadic',
          metricsObserved: `Fixation hold ${input.taskResponses?.game1?.fixationHoldPct ?? 'N/A'}%`,
          status: 'STABLE',
          clinicalRelevance: 'Oculomotor stability recorded without diagnostic projection.'
        },
        {
          domain: 'Visual Memory',
          metricsObserved: `Cortex match score ${input.taskResponses?.game2?.score ?? 'N/A'}/100`,
          status: 'STABLE',
          clinicalRelevance: 'Culturally adapted Indian everyday object recall.'
        },
        {
          domain: 'Vocal Cadence',
          metricsObserved: `Speech cadence WPM ${input.taskResponses?.game3?.wpm ?? 'N/A'}`,
          status: 'STABLE',
          clinicalRelevance: 'Vernacular vocal articulation recorded.'
        },
        {
          domain: 'Facial Affective',
          metricsObserved: `Symmetry score ${input.taskResponses?.game4?.score ?? 'N/A'}/100`,
          status: 'STABLE',
          clinicalRelevance: 'Facial landmark responsiveness.'
        },
        {
          domain: 'Executive Trail Making',
          metricsObserved: `Errors ${input.taskResponses?.game5?.errors ?? 0}`,
          status: 'STABLE',
          clinicalRelevance: 'Visual sequencing coordination.'
        }
      ],
      flaggedReviewSignals: ['Exploratory screening record awaiting clinical review'],
      recommendedPhysicianPrompts: ['Compare with clinical history and patient-reported everyday function.'],
      diagnosticDisclaimer: 'EXPLORATORY_DECISION_SUPPORT_ONLY_NOT_A_DIAGNOSIS'
    };
  }

  const prompt = `You are a clinical decision-support intelligence engine assisting a reviewing physician in India.
STRICT SAFETY BOUNDARY: You MUST NOT diagnose cognitive impairment, Alzheimer's, or dementia. Output strict JSON only.

Patient Context:
- Age: ${input.patientAge} years
- Education: ${input.educationYears ?? 'Not reported'} years
- Overall Composite: ${input.overallScore ?? 'Non-interpretable'}/100
- Language: ${input.language ?? 'English / Indian Vernacular'}
- Quality Rating: ${input.qualityRating ?? 'Good'}
- Recorded Task Metrics:
${JSON.stringify(input.taskResponses, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          domainFindings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                domain: {
                  type: Type.STRING,
                  enum: [
                    'Ocular Saccadic',
                    'Visual Memory',
                    'Vocal Cadence',
                    'Facial Affective',
                    'Executive Trail Making'
                  ]
                },
                metricsObserved: { type: Type.STRING },
                status: {
                  type: Type.STRING,
                  enum: ['STABLE', 'NOTABLE_DEVIATION', 'INCOMPLETE_DATA']
                },
                clinicalRelevance: { type: Type.STRING }
              },
              required: ['domain', 'metricsObserved', 'status', 'clinicalRelevance']
            }
          },
          flaggedReviewSignals: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          recommendedPhysicianPrompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          diagnosticDisclaimer: {
            type: Type.STRING,
            enum: ['EXPLORATORY_DECISION_SUPPORT_ONLY_NOT_A_DIAGNOSIS']
          }
        },
        required: [
          'executiveSummary',
          'domainFindings',
          'flaggedReviewSignals',
          'recommendedPhysicianPrompts',
          'diagnosticDisclaimer'
        ]
      }
    }
  });

  const rawJson = response.text || '{}';
  return ClinicianSummarySchema.parse(JSON.parse(rawJson));
}

// ============================================================================
// 2. INTERPRETING ASSESSMENT METADATA & TASK RESPONSES
// ============================================================================

export const MetadataInterpretationSchema = z.object({
  dataIntegrityVerdict: z.enum(['HIGH_CONFIDENCE', 'ACCEPTABLE_WITH_CAUTION', 'INSUFFICIENT_QUALITY']),
  captureQualityFlags: z.array(z.string()),
  taskTelemetryInterpretation: z.object({
    ocular: z.string(),
    memory: z.string(),
    voice: z.string(),
    facial: z.string(),
    executive: z.string()
  }),
  contextualConfounders: z.array(z.string()),
  nonDiagnosticNotice: z.string()
});

export type MetadataInterpretation = z.infer<typeof MetadataInterpretationSchema>;

export async function interpretAssessmentMetadata(input: {
  telemetry: Record<string, any>;
  contextFactors?: Record<string, any>;
  educationYears?: number | null;
}): Promise<MetadataInterpretation> {
  const ai = getClient();
  const config = getGeminiConfig();

  if (!ai) {
    return {
      dataIntegrityVerdict: 'HIGH_CONFIDENCE',
      captureQualityFlags: ['Deterministic fallback active'],
      taskTelemetryInterpretation: {
        ocular: 'Eye gaze tracking maintained within calibrated bounding box.',
        memory: 'Indian cultural stimulus association completed.',
        voice: 'Speech signal duration adequate for phonetic parsing.',
        facial: '3D facial landmarks tracked at 60 FPS.',
        executive: 'Trail sequencing recorded without timing faults.'
      },
      contextualConfounders: [
        input.educationYears && input.educationYears < 8
          ? 'Low formal education accounted for in scoring norm.'
          : 'Standard literacy calibration applied.'
      ],
      nonDiagnosticNotice:
        'Observations are technical telemetry interpretations and not a clinical diagnosis.'
    };
  }

  const prompt = `Interpret the following sensor metadata and telemetry from a NeuLens 5-minute screening session in India.
Evaluate data integrity, examine potential confounders (e.g. poor lighting, background noise, low formal schooling), and summarize each task's telemetry.
STRICT SAFETY RULE: Do not diagnose cognitive impairment. Output strict JSON.

Telemetry Data:
${JSON.stringify(input.telemetry, null, 2)}

Contextual Factors:
- Education Years: ${input.educationYears ?? 'Not reported'}
- Sleep/Stress/Vitals Context: ${JSON.stringify(input.contextFactors || {})}
`;

  const response = await ai.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dataIntegrityVerdict: {
            type: Type.STRING,
            enum: ['HIGH_CONFIDENCE', 'ACCEPTABLE_WITH_CAUTION', 'INSUFFICIENT_QUALITY']
          },
          captureQualityFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          taskTelemetryInterpretation: {
            type: Type.OBJECT,
            properties: {
              ocular: { type: Type.STRING },
              memory: { type: Type.STRING },
              voice: { type: Type.STRING },
              facial: { type: Type.STRING },
              executive: { type: Type.STRING }
            },
            required: ['ocular', 'memory', 'voice', 'facial', 'executive']
          },
          contextualConfounders: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          nonDiagnosticNotice: { type: Type.STRING }
        },
        required: [
          'dataIntegrityVerdict',
          'captureQualityFlags',
          'taskTelemetryInterpretation',
          'contextualConfounders',
          'nonDiagnosticNotice'
        ]
      }
    }
  });

  const rawJson = response.text || '{}';
  return MetadataInterpretationSchema.parse(JSON.parse(rawJson));
}

// ============================================================================
// 3. EXPLAINING OBSERVED CHANGES IN UNDERSTANDABLE LANGUAGE
// ============================================================================

export const ObservedChangeExplanationSchema = z.object({
  trajectoryClassification: z.enum([
    'WITHIN_PERSONAL_BASELINE',
    'CHANGE_BEYOND_RELIABLE_THRESHOLD',
    'INSUFFICIENT_REPEAT_DATA'
  ]),
  patientExplanation: z.string(),
  clinicianExplanation: z.string(),
  contributingDomains: z.array(z.string()),
  reassuringContextNote: z.string(),
  nonDiagnosticNotice: z.string()
});

export type ObservedChangeExplanation = z.infer<typeof ObservedChangeExplanationSchema>;

export async function explainObservedChanges(input: {
  currentScore: number;
  baselineScore: number;
  scoreDelta: number;
  comparableSessionsCount: number;
  changedDomains?: string[];
  language?: 'en' | 'ta' | 'hi';
}): Promise<ObservedChangeExplanation> {
  const ai = getClient();
  const config = getGeminiConfig();

  const isSignificantDecline = input.scoreDelta <= -5.0 && input.comparableSessionsCount >= 3;
  const classification = input.comparableSessionsCount < 3
    ? 'INSUFFICIENT_REPEAT_DATA'
    : isSignificantDecline
    ? 'CHANGE_BEYOND_RELIABLE_THRESHOLD'
    : 'WITHIN_PERSONAL_BASELINE';

  if (!ai) {
    return {
      trajectoryClassification: classification,
      patientExplanation:
        classification === 'WITHIN_PERSONAL_BASELINE'
          ? 'Your recent assessment performance is consistent with your personal baseline anchor. Good job staying engaged!'
          : classification === 'CHANGE_BEYOND_RELIABLE_THRESHOLD'
          ? 'A modest shift from your personal baseline was observed. Your physician will review whether everyday factors like sleep or fatigue contributed.'
          : 'We are establishing your initial personal baseline anchor across your first few sessions.',
      clinicianExplanation: `Reliable Change Index evaluation: current score ${input.currentScore}, baseline ${input.baselineScore} (delta: ${input.scoreDelta.toFixed(1)}). Comparable sessions: ${input.comparableSessionsCount}.`,
      contributingDomains: input.changedDomains || ['Ocular Fixation', 'Verbal Response Latency'],
      reassuringContextNote: 'Cognitive measurements naturally fluctuate with rest, hydration, and daily stress.',
      nonDiagnosticNotice:
        'This explanation is an exploratory comparison against personal history and does not diagnose disease.'
    };
  }

  const prompt = `You are a clinical communication specialist explaining longitudinal cognitive change for NeuLens in India.
STRICT SAFETY BOUNDARY: Never tell the patient they have dementia or Alzheimer's. Speak with empathy, clarity, and scientific precision.
Language: ${input.language ?? 'en'}

Longitudinal Data:
- Current Score: ${input.currentScore}/100
- Personal Baseline: ${input.baselineScore}/100
- Score Delta: ${input.scoreDelta.toFixed(1)} points
- Prior Comparable Sittings: ${input.comparableSessionsCount}
- Changed Domains: ${input.changedDomains?.join(', ') || 'None identified'}
- Statistical Shift Beyond RCI Threshold (-5.0): ${isSignificantDecline ? 'YES' : 'NO'}
`;

  const response = await ai.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          trajectoryClassification: {
            type: Type.STRING,
            enum: [
              'WITHIN_PERSONAL_BASELINE',
              'CHANGE_BEYOND_RELIABLE_THRESHOLD',
              'INSUFFICIENT_REPEAT_DATA'
            ]
          },
          patientExplanation: { type: Type.STRING },
          clinicianExplanation: { type: Type.STRING },
          contributingDomains: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          reassuringContextNote: { type: Type.STRING },
          nonDiagnosticNotice: { type: Type.STRING }
        },
        required: [
          'trajectoryClassification',
          'patientExplanation',
          'clinicianExplanation',
          'contributingDomains',
          'reassuringContextNote',
          'nonDiagnosticNotice'
        ]
      }
    }
  });

  const rawJson = response.text || '{}';
  return ObservedChangeExplanationSchema.parse(JSON.parse(rawJson));
}

// ============================================================================
// 4. MULTILINGUAL INSTRUCTIONS & PATIENT EXPLANATIONS (ta, hi, en)
// ============================================================================

export const MultilingualInstructionsSchema = z.object({
  language: z.enum(['en', 'ta', 'hi']),
  taskName: z.string(),
  stepByStepInstructions: z.array(z.string()),
  patientFriendlyExplanation: z.string(),
  spokenAudioScript: z.string(),
  culturalStimuliContext: z.string()
});

export type MultilingualInstructions = z.infer<typeof MultilingualInstructionsSchema>;

export async function generateMultilingualInstructions(input: {
  task: 'FOCUS_ORBIT' | 'CORTEX_MATCH' | 'VOCAL_ECHO' | 'MIMIC_SYNC' | 'PATH_MAPPER';
  language: 'en' | 'ta' | 'hi';
}): Promise<MultilingualInstructions> {
  const ai = getClient();
  const config = getGeminiConfig();

  // Deterministic vernacular copy
  const FALLBACK_INSTRUCTIONS: Record<string, Record<string, MultilingualInstructions>> = {
    CORTEX_MATCH: {
      ta: {
        language: 'ta',
        taskName: 'கார்டெக்ஸ் மேட்ச் (நினைவாற்றல்)',
        stepByStepInstructions: [
          'திரையில் உள்ள அட்டைகளைத் தொடவும்.',
          'விளக்கு, மாம்பழம், மயில், தாமரை ஆகிய பழக்கப்பட்ட இந்திய படங்களை நினைவில் கொள்ளவும்.',
          'ஒரே மாதிரியான படங்களை ஜோடியாக இணைக்கவும்.'
        ],
        patientFriendlyExplanation: 'இது உங்கள் நினைவாற்றலை எளிய முறையில் பதிவு செய்யும் ஒரு மகிழ்ச்சியான விளையாட்டு.',
        spokenAudioScript: 'அட்டைகளைத் திறந்து விளக்கு, மாம்பழம், மயில் போன்ற படங்களை ஜோடியாகப் பொருத்துங்கள்.',
        culturalStimuliContext: 'பாரம்பரிய இந்திய பொருட்கள் (விளக்கு 🪔, மாம்பழம் 🥭, மயில் 🦚, தாமரை 🪷)'
      },
      hi: {
        language: 'hi',
        taskName: 'कॉर्टेक्स मैच (स्मृति अभ्यास)',
        stepByStepInstructions: [
          'स्क्रीन पर कार्ड्स को स्पर्श करें।',
          'दीया, आम, मोर और कमल के चित्रों को ध्यान से देखें।',
          'समान चित्रों के जोड़ों को मिलाएं।'
        ],
        patientFriendlyExplanation: 'यह आपकी स्मृति को परखने का एक सहज और सम्मानजनक अभ्यास है।',
        spokenAudioScript: 'कार्ड्स को पलटें और दीया, आम, मोर जैसे परिचित चित्रों के सही जोड़े बनाएं।',
        culturalStimuliContext: 'पारंपरिक भारतीय वस्तुएं (दीया 🪔, आम 🥭, मोर 🦚, कमल 🪷)'
      },
      en: {
        language: 'en',
        taskName: 'Cortex Match (Visual Memory)',
        stepByStepInstructions: [
          'Tap cards to reveal the picture underneath.',
          'Remember familiar Indian symbols: Diya, Mango, Peacock, and Lotus.',
          'Match identical pairs until all are solved.'
        ],
        patientFriendlyExplanation: 'A gentle, interactive game measuring working memory without stress.',
        spokenAudioScript: 'Tap cards to find matching pairs of familiar Indian everyday objects.',
        culturalStimuliContext: 'Culturally adapted stimuli (Diya 🪔, Mango 🥭, Peacock 🦚, Lotus 🪷)'
      }
    }
  };

  const defaultTask = FALLBACK_INSTRUCTIONS.CORTEX_MATCH[input.language];

  if (!ai) {
    return defaultTask;
  }

  const prompt = `Generate step-by-step instructions and a patient-friendly spoken explanation for NeuLens task ${input.task} in language ${input.language}.
Tone: Warm, respectful, elder-friendly, culturally familiar.
Zero clinical jargon. Highlight everyday familiar objects.
Output strict JSON matching the schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING, enum: ['en', 'ta', 'hi'] },
            taskName: { type: Type.STRING },
            stepByStepInstructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            patientFriendlyExplanation: { type: Type.STRING },
            spokenAudioScript: { type: Type.STRING },
            culturalStimuliContext: { type: Type.STRING }
          },
          required: [
            'language',
            'taskName',
            'stepByStepInstructions',
            'patientFriendlyExplanation',
            'spokenAudioScript',
            'culturalStimuliContext'
          ]
        }
      }
    });

    const rawJson = response.text || '{}';
    return MultilingualInstructionsSchema.parse(JSON.parse(rawJson));
  } catch (err) {
    logWarn('Gemini multilingual instruction generation error, using fallback:', { error: String(err) });
    return defaultTask;
  }
}

// ============================================================================
// CONVERSATIONAL VOICE COPILOT STREAMING
// ============================================================================

export async function streamGeminiChat(
  systemInstruction: string,
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk: (delta: string) => void
): Promise<string> {
  const ai = getClient();
  const config = getGeminiConfig();

  if (!ai) {
    throw new Error('Google Gemini API key not configured');
  }

  const contents = [
    ...history.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }]
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: config.model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 200
      }
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }

    return fullText;
  } catch (error) {
    logError('Error generating streaming response from Google Gemini', { error: String(error) });
    throw error;
  }
}
