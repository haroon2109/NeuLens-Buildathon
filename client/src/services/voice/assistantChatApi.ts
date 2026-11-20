/**
 * Client for the LLM-backed voice copilot answers.
 *
 * The server holds the provider credentials; this module only forwards the
 * signed-in patient's session cookie.
 */

const API_BASE_URL = ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '').replace(/\/$/, '');

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantQuestion {
  message: string;
  language: 'en' | 'ta' | 'hi' | 'ar';
  context?: { page?: string; pageTitle?: string; summary?: string };
  history?: AssistantTurn[];
}

/**
 * Resolves to the spoken-ready answer, or `null` when the deployment has no
 * assistant model configured, so the caller can fall back to fixed replies.
 */
/**
 * Streams the answer. `onDelta` fires for every token batch so the caller can
 * display and speak the first sentence before the answer is finished.
 * Resolves to the full reply, or `null` when no model is configured.
 */
export async function streamAssistant(
  question: AssistantQuestion,
  onDelta: (text: string) => void
): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/assistant/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question)
    });
  } catch {
    throw new Error('Cannot reach the Neulens server.');
  }

  if (response.status === 503) return null;
  if (!response.ok || !response.body) {
    throw new Error(`Assistant request failed (status ${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  const handleFrame = (frame: string) => {
    let event = 'message';
    let data = '';
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (!data) return;

    let payload: { text?: string; reply?: string; error?: string };
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }

    if (event === 'delta' && payload.text) {
      full += payload.text;
      onDelta(payload.text);
    } else if (event === 'done' && payload.reply && !full) {
      full = payload.reply;
      onDelta(payload.reply);
    } else if (event === 'error') {
      throw new Error(payload.error || 'The assistant could not answer that right now.');
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
      handleFrame(frame);
    }
  }

  return full.trim() || null;
}

export async function askAssistant(question: AssistantQuestion): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/assistant/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question)
    });
  } catch {
    throw new Error('Cannot reach the Neulens server.');
  }

  if (response.status === 503) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Assistant request failed (status ${response.status}).`);
  }

  const payload = (await response.json()) as { reply?: string };
  return payload.reply?.trim() || null;
}
