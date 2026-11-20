/**
 * Patient assistant LLM.
 *
 * Supports Google Gemini (preferred for Google Startup Buildathon) as well as
 * any standard OpenAI-compatible chat-completions endpoint (hosted vendors or local Ollama).
 * Credentials stay on the server.
 *
 * Google Gemini configuration:
 *   GEMINI_API_KEY           Google Gemini API Key (generativelanguage.googleapis.com)
 *   GEMINI_MODEL             e.g. gemini-2.5-flash (default) or gemini-1.5-flash / gemini-2.5-pro
 *
 * Generic OpenAI / Custom endpoint configuration:
 *   ASSISTANT_LLM_BASE_URL   e.g. https://generativelanguage.googleapis.com/v1beta/openai or https://api.openai.com/v1
 *   ASSISTANT_LLM_API_KEY    API key
 *   ASSISTANT_LLM_MODEL      model identifier
 *
 * When these are absent the endpoint reports `configured: false` and the
 * client falls back to its deterministic command replies.
 */

import { selectSkills, skillBodies, skillCatalogue } from './assistantSkills';
import { streamGeminiChat } from './geminiService';
import { warn as logWarn } from './logger';

export interface AssistantContext {
  /** Route path, e.g. /patient/trends. Language-independent. */
  page?: string;
  pageTitle?: string;
  summary?: string;
}

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  provider: 'google-gemini' | 'openai-compatible';
}

export function getLlmConfig(): LlmConfig {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    return {
      baseUrl: (process.env.ASSISTANT_LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, ''),
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL || process.env.ASSISTANT_LLM_MODEL || 'gemini-2.5-flash',
      provider: 'google-gemini'
    };
  }

  return {
    baseUrl: (process.env.ASSISTANT_LLM_BASE_URL || '').replace(/\/$/, ''),
    apiKey: process.env.ASSISTANT_LLM_API_KEY || '',
    model: process.env.ASSISTANT_LLM_MODEL || '',
    provider: 'openai-compatible'
  };
}

/** Short enough to be spoken aloud comfortably. */
const MAX_ANSWER_WORDS = 90;
const MAX_MESSAGE_CHARS = 800;
const MAX_HISTORY_TURNS = 6;

export function isAssistantConfigured(): boolean {
  const config = getLlmConfig();
  return Boolean(
    config.baseUrl &&
    config.model &&
    (config.apiKey || config.baseUrl.includes('localhost') || config.baseUrl.includes('127.0.0.1'))
  );
}

/**
 * Base prompt: identity, hard safety rules and the skill catalogue only.
 * Detailed guidance is attached per turn by {@link selectSkills}.
 */
export function systemPrompt(
  language: 'en' | 'ta' | 'hi' | 'ar',
  context: AssistantContext,
  message = ''
): string {
  let languageRule = 'Reply in Indian English only. Use a warm, plain, respectful, culturally familiar tone suitable for an older Indian adult. Avoid complex clinical jargon.';
  if (language === 'ta') {
    languageRule = 'Reply in natural, spoken Tamil (தமிழ்) only. Use warm, respectful language suitable for an elderly South Indian person (e.g. வணக்கம், நீங்கள்). Keep sentences simple, supportive, and clear.';
  } else if (language === 'hi') {
    languageRule = 'Reply in natural, spoken Hindi (हिन्दी) only. Use warm, respectful language suitable for an elderly Indian adult (e.g. नमस्ते, आप). Keep sentences simple, supportive, and clear.';
  } else if (language === 'ar') {
    languageRule = 'Reply in Modern Standard Arabic only. Use a warm, plain, respectful tone.';
  }

  const grounding = [
    context.pageTitle ? `The patient is currently viewing: ${context.pageTitle}.` : '',
    context.summary ? `Known facts from their own record (do not invent more): ${context.summary}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  const skills = selectSkills(message, context.page, context.pageTitle);
  const guidance = skillBodies(skills);

  return [
    'You are NeuLens, a patient-facing cognitive health portal assistant.',
    languageRule,
    `Answer in at most ${MAX_ANSWER_WORDS} spoken words, in one or two short sentences.`,
    'Never diagnose, interpret scans, predict dementia, recommend medication or dosage changes, or give emergency advice.',
    'If the patient describes a medical emergency, tell them to contact local emergency services or their clinician now.',
    'Never invent values, dates, scores or appointments that are not in the facts below.',
    'If you do not know, say so briefly and suggest speaking with their clinician.',
    'Do not use markdown, lists, or symbols that do not read aloud well.',
    'Available skills (guidance is attached only for the ones relevant to this turn):',
    skillCatalogue(),
    guidance ? `Guidance for this turn:\n${guidance}` : '',
    grounding
  ]
    .filter(Boolean)
    .join('\n');
}

function trimWords(text: string, limit: number): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  return words.length > limit ? `${words.slice(0, limit).join(' ')}.` : words.join(' ');
}

export interface AssistantReply {
  reply: string;
  model: string;
}

/**
 * Streams the answer as it is generated so the client can start speaking the
 * first sentence while the rest is still arriving.
 */
export async function streamAnswer(
  input: {
    message: string;
    language: 'en' | 'ta' | 'hi' | 'ar';
    context?: AssistantContext;
    history?: AssistantTurn[];
  },
  onDelta: (text: string) => void
): Promise<AssistantReply> {
  const config = getLlmConfig();
  if (!isAssistantConfigured()) {
    throw Object.assign(new Error('Assistant is not configured'), { code: 'ASSISTANT_NOT_CONFIGURED' });
  }

  const message = input.message.slice(0, MAX_MESSAGE_CHARS);
  const history = (input.history || [])
    .filter((turn) => turn && (turn.role === 'user' || turn.role === 'assistant') && turn.content)
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE_CHARS) }));

  if (config.provider === 'google-gemini') {
    try {
      const sysInstruction = systemPrompt(input.language, input.context || {}, message);
      const text = await streamGeminiChat(sysInstruction, message, history, onDelta);
      return { reply: trimWords(text, MAX_ANSWER_WORDS), model: config.model };
    } catch (err) {
      logWarn('Native Google GenAI SDK stream failed, attempting HTTP fallback', { error: String(err) });
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        max_tokens: 220,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt(input.language, input.context || {}, message) },
          ...history,
          { role: 'user', content: message }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => '');
      throw Object.assign(new Error(`Assistant provider error (${response.status})`), {
        code: 'ASSISTANT_PROVIDER_ERROR',
        detail: detail.slice(0, 300)
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf('\n');

        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const event = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
          const delta = event.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            onDelta(delta);
          }
        } catch {
          // Ignore keep-alive or malformed frames.
        }
      }
    }

    if (!full.trim()) {
      throw Object.assign(new Error('Assistant returned an empty answer'), { code: 'ASSISTANT_EMPTY' });
    }

    return { reply: trimWords(full, MAX_ANSWER_WORDS), model: config.model };
  } finally {
    clearTimeout(timeout);
  }
}

export async function answerQuestion(input: {
  message: string;
  language: 'en' | 'ta' | 'hi' | 'ar';
  context?: AssistantContext;
  history?: AssistantTurn[];
}): Promise<AssistantReply> {
  const config = getLlmConfig();
  if (!isAssistantConfigured()) {
    throw Object.assign(new Error('Assistant is not configured'), { code: 'ASSISTANT_NOT_CONFIGURED' });
  }

  const message = input.message.slice(0, MAX_MESSAGE_CHARS);
  const history = (input.history || [])
    .filter((turn) => turn && (turn.role === 'user' || turn.role === 'assistant') && turn.content)
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE_CHARS) }));

  if (config.provider === 'google-gemini') {
    try {
      const sysInstruction = systemPrompt(input.language, input.context || {}, message);
      const text = await streamGeminiChat(sysInstruction, message, history, () => {});
      return { reply: trimWords(text, MAX_ANSWER_WORDS), model: config.model };
    } catch (err) {
      logWarn('Native Google GenAI SDK answer failed, attempting HTTP fallback', { error: String(err) });
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          { role: 'system', content: systemPrompt(input.language, input.context || {}, message) },
          ...history,
          { role: 'user', content: message }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw Object.assign(new Error(`Assistant provider error (${response.status})`), {
        code: 'ASSISTANT_PROVIDER_ERROR',
        detail: detail.slice(0, 300)
      });
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      throw Object.assign(new Error('Assistant returned an empty answer'), { code: 'ASSISTANT_EMPTY' });
    }

    return { reply: trimWords(raw, MAX_ANSWER_WORDS), model: config.model };
  } finally {
    clearTimeout(timeout);
  }
}
