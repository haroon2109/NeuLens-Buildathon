import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, Sparkles, X, Volume2 } from 'lucide-react';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { getVoiceAssistantCopy } from '../../services/voice/voiceAssistantCopy';
import { useVoiceCopilotStore } from '../../services/voice/VoiceCopilotEngine';
import { SpeechRecognitionService } from '../../services/voice/SpeechRecognitionService';

/**
 * Jarvis-style patient copilot: continuous speech in English and Arabic,
 * interruptible replies, and live transcripts. Mounted once in the portal
 * layout so it can navigate from any page.
 */
export const VoiceCopilot: React.FC = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguageStore();
  const copy = getVoiceAssistantCopy(currentLanguage);

  const {
    isOpen,
    isActive,
    status,
    liveTranscript,
    messages,
    isAwake,
    backgroundEnabled,
    error,
    setOpen,
    setBackgroundEnabled,
    restoreBackgroundPreference,
    suspendListening,
    submitText,
    registerNavigator
  } = useVoiceCopilotStore();

  const [typed, setTyped] = useState('');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const supported = SpeechRecognitionService.isSupported();

  useEffect(() => {
    registerNavigator(navigate);
  }, [navigate, registerNavigator]);

  // Resume hands-free listening if the patient left it on, and never keep the
  // microphone open after the portal is left (e.g. sign-out).
  useEffect(() => {
    restoreBackgroundPreference();
    return () => suspendListening();
  }, [restoreBackgroundPreference, suspendListening]);

  // Track the browser's microphone permission so we can explain it before
  // asking for it, and recover gracefully when it has been blocked.
  useEffect(() => {
    if (!supported) return;
    let perm: PermissionStatus | null = null;
    const update = () => {
      if (perm) setPermissionState(perm.state as 'prompt' | 'granted' | 'denied');
    };
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((result) => {
          perm = result;
          update();
          result.onchange = update;
        })
        .catch(() => setPermissionState('unknown'));
    } else {
      setPermissionState('unknown');
    }
    return () => {
      if (perm) perm.onchange = null;
    };
  }, [supported]);

  // The first interaction is a valid user gesture, so it is the right moment
  // to either start listening (permission already granted) or explain why we
  // need the microphone (permission still pending).
  useEffect(() => {
    if (!supported) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('neulens_voice_background');
    } catch {
      stored = null;
    }
    if (stored !== null) return;

    const handle = () => {
      let current: string | null = null;
      try {
        current = localStorage.getItem('neulens_voice_background');
      } catch {
        current = null;
      }
      if (current !== null) return;
      if (permissionState === 'granted') {
        setBackgroundEnabled(true);
      } else {
        setShowPermissionPrompt(true);
      }
      window.removeEventListener('click', handle);
      window.removeEventListener('keydown', handle);
    };
    window.addEventListener('click', handle, { once: false });
    window.addEventListener('keydown', handle, { once: false });
    return () => {
      window.removeEventListener('click', handle);
      window.removeEventListener('keydown', handle);
    };
  }, [supported, permissionState, setBackgroundEnabled]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, liveTranscript, isOpen]);

  // Closing the panel keeps listening when hands-free mode is on.
  const togglePanel = () => {
    if (isOpen) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (supported && !backgroundEnabled) {
      if (permissionState === 'granted') {
        setBackgroundEnabled(true);
      } else {
        setShowPermissionPrompt(true);
      }
    }
  };

  const handleMic = () => {
    if (!backgroundEnabled && permissionState !== 'granted') {
      setShowPermissionPrompt(true);
      return;
    }
    setBackgroundEnabled(!backgroundEnabled);
  };

  const submitTyped = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = typed.trim();
    if (!value) return;
    setTyped('');
    await submitText(value);
  };

  const statusLabel =
    status === 'listening' ? (isAwake ? copy.statusListening : copy.statusWaitingForWake)
      : status === 'thinking' ? copy.statusThinking
        : status === 'speaking' ? copy.statusSpeaking
          : copy.statusIdle;

  return (
    <>
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={isOpen}
        aria-label={copy.buttonLabel}
        className="fixed bottom-5 end-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-forest text-white shadow-lg shadow-forest/30 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
      >
        {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Mic className="h-6 w-6" aria-hidden="true" />}
        {isActive && !isOpen && (
          <span className="absolute inset-0 animate-ping rounded-full bg-forest/40" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <section
          aria-label={copy.panelTitle}
          className="fixed bottom-24 end-4 z-40 flex max-h-[min(560px,75vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
        >
          <header className="flex items-start gap-2 border-b border-line bg-mint px-4 py-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-white">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-ink">{copy.panelTitle}</p>
              <p className="text-[12px] text-muted">{copy.panelSubtitle}</p>
            </div>              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={copy.close}
              className="rounded-md p-1 text-sage-deep hover:bg-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div ref={scrollRef} className="min-h-[120px] flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
            {messages.length === 0 && !liveTranscript && (
              <p className="text-[13px] text-muted">{isActive ? copy.wakeHint : copy.emptyState}</p>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[92%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                  message.role === 'user'
                    ? 'ms-auto bg-forest text-white'
                    : 'me-auto border border-line bg-warm text-ink'
                }`}
              >
                <span className="sr-only">{message.role === 'user' ? copy.you : copy.assistant}: </span>
                {message.text}
              </div>
            ))}

            {liveTranscript && isAwake && (
              <div className="ms-auto max-w-[92%] rounded-xl border border-dashed border-sage-deep/40 bg-warm px-3 py-2 text-[13px] italic text-muted">
                {liveTranscript}
              </div>
            )}
          </div>

          {messages.length === 0 && (
            <div className="border-t border-line px-4 py-2.5">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-sage-deep">
                {copy.suggestionsTitle}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {copy.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => submitText(suggestion)}
                    className="rounded-full border border-line px-2.5 py-1 text-[12px] text-body transition-colors hover:bg-mint hover:text-forest"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-[12px] text-amber-800" role="alert">
              {error}
            </p>
          )}

          <div className="border-t border-line px-3 py-2.5">
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleMic}
                aria-pressed={backgroundEnabled}
                aria-label={backgroundEnabled ? copy.backgroundOn : copy.backgroundOff}
                disabled={!supported}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
                  backgroundEnabled ? 'bg-forest text-white' : 'border border-line text-body hover:bg-mint'
                }`}
              >
                {backgroundEnabled ? <Mic className="h-4 w-4" aria-hidden="true" /> : <MicOff className="h-4 w-4" aria-hidden="true" />}
              </button>
              <p
                className="flex-1 truncate text-[12px] font-medium text-sage-deep"
                aria-live="polite"
                aria-atomic="true"
              >
                {status === 'speaking' && <Volume2 className="me-1 inline h-3.5 w-3.5" aria-hidden="true" />}
                {statusLabel}
              </p>
            </div>

            <form onSubmit={submitTyped} className="flex items-center gap-1.5">
              <input
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={copy.micHint}
                aria-label={copy.micHint}
                className="min-w-0 flex-1 rounded-lg border border-line px-2.5 py-1.5 text-[13px] text-ink placeholder:text-muted focus:border-forest focus:outline-none"
              />
              <button
                type="submit"
                disabled={!typed.trim()}
                aria-label={copy.assistant}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest text-white disabled:opacity-40"
              >
                <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      )}

      {showPermissionPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="neulens-mic-permission-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white">
                <Mic className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 id="neulens-mic-permission-title" className="text-[16px] font-bold text-ink">
                {copy.permissionTitle}
              </h2>
            </div>
            <p className="mb-3 text-[13px] leading-relaxed text-body">{copy.permissionBody}</p>
            <ul className="mb-4 space-y-1 text-[12px] text-muted">
              <li>• {copy.permissionBullet1}</li>
              <li>• {copy.permissionBullet2}</li>
              <li>• {copy.permissionBullet3}</li>
            </ul>
            {permissionState === 'denied' && (
              <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800" role="alert">
                {copy.permissionDenied}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPermissionPrompt(false);
                  try {
                    localStorage.setItem('neulens_voice_background', '0');
                  } catch {
                    // Ignore storage failures.
                  }
                }}
                className="flex-1 rounded-lg border border-line px-3 py-2 text-[13px] text-body transition-colors hover:bg-mint"
              >
                {copy.permissionNotNow}
              </button>
              {permissionState === 'denied' ? (
                <button
                  type="button"
                  onClick={() => setShowPermissionPrompt(false)}
                  className="flex-1 rounded-lg bg-forest px-3 py-2 text-[13px] font-semibold text-white"
                >
                  {copy.permissionClose}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowPermissionPrompt(false);
                    setBackgroundEnabled(true);
                  }}
                  className="flex-1 rounded-lg bg-forest px-3 py-2 text-[13px] font-semibold text-white"
                >
                  {copy.permissionAllow}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceCopilot;
