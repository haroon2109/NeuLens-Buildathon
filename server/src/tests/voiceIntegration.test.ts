/**
 * Gnani AI Voice Integration Test Suite
 * In-process unit & integration tests for STT, TTS, Validation, Caching & Controller handlers.
 * Compatible with Node 22 test runner (node:test).
 */

process.env.NODE_ENV = 'test';

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GnaniSttService } from '../services/gnani/gnaniStt.service';
import { GnaniTtsService } from '../services/gnani/gnaniTts.service';
import { GnaniEvonService } from '../services/gnani/evon.service';
import { GNANI_LANGUAGE_CATALOG } from '../services/gnani/types';
import { voiceController } from '../controllers/voice.controller';

// Mock Express Response helper
function createMockResponse() {
  const res: any = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
    setHeader(key: string, val: any) {
      res.headers[key.toLowerCase()] = val;
      return res;
    },
    send(data: any) {
      res.body = data;
      return res;
    }
  };
  return res;
}

describe('Gnani AI Voice Integration Test Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = originalFetch;
  });

  describe('1. Language & Voice Catalog Verification', () => {
    it('verifies all 6 languages have valid BCP-47 codes and default Timbre v2.5 voices', () => {
      const langs = ['en', 'ta', 'hi', 'te', 'ml', 'kn'] as const;
      for (const lang of langs) {
        const item = GNANI_LANGUAGE_CATALOG[lang];
        assert.ok(item, `Language catalog item exists for ${lang}`);
        assert.ok(item.bcp47.includes('-IN'), `BCP-47 tag contains -IN for ${lang}`);
        assert.ok(item.defaultVoice.length > 0, `Default voice exists for ${lang}`);
        assert.ok(item.availableVoices.includes(item.defaultVoice), `Default voice in available catalog for ${lang}`);
      }

      // Check specific expected voices
      assert.strictEqual(GNANI_LANGUAGE_CATALOG.ta.defaultVoice, 'Asmita');
      assert.strictEqual(GNANI_LANGUAGE_CATALOG.hi.defaultVoice, 'Nalini');
      assert.strictEqual(GNANI_LANGUAGE_CATALOG.en.defaultVoice, 'Kaveri');
      assert.strictEqual(GNANI_LANGUAGE_CATALOG.te.defaultVoice, 'Suhana');
      assert.strictEqual(GNANI_LANGUAGE_CATALOG.kn.defaultVoice, 'Saanvi');
      assert.strictEqual(GNANI_LANGUAGE_CATALOG.ml.defaultVoice, 'Reshma');
    });

    it('VoiceController.getVoices returns 200 and catalog payload', async () => {
      const req: any = {};
      const res = createMockResponse();

      await voiceController.getVoices(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.languages.ta);
    });

    it('VoiceController.getHealth returns 200 and model metadata', async () => {
      const req: any = {};
      const res = createMockResponse();

      await voiceController.getHealth(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.ok('configured' in res.body);
      assert.ok(res.body.stt.model.includes('Prisma'));
      assert.ok(res.body.tts.model.includes('Timbre'));
    });
  });

  describe('2. Gnani Timbre v2.5 TTS Service', () => {
    it('rejects empty text synthesis with descriptive error', async () => {
      const tts = new GnaniTtsService();
      await assert.rejects(
        async () => tts.synthesize({ text: '  ', language: 'ta' }),
        { message: 'Synthesis text cannot be empty.' }
      );
    });

    it('rejects oversized text exceeding 2,500 characters', async () => {
      const tts = new GnaniTtsService();
      const largeText = 'A'.repeat(2600);
      await assert.rejects(
        async () => tts.synthesize({ text: largeText, language: 'en' }),
        { message: 'Synthesis text exceeds maximum character limit of 2,500 characters.' }
      );
    });

    it('resolves correct voices for Tamil, Hindi, and English', () => {
      const tts = new GnaniTtsService();
      const taRes = tts.resolveVoiceAndLanguage('ta');
      assert.strictEqual(taRes.bcp47, 'ta-IN');
      assert.strictEqual(taRes.voice, 'Asmita');

      const hiRes = tts.resolveVoiceAndLanguage('hi');
      assert.strictEqual(hiRes.bcp47, 'hi-IN');
      assert.strictEqual(hiRes.voice, 'Nalini');

      const enRes = tts.resolveVoiceAndLanguage('en');
      assert.strictEqual(enRes.bcp47, 'en-IN');
      assert.strictEqual(enRes.voice, 'Kaveri');
    });

    it('synthesizes Tamil speech with timbre-v2.5 and caches repeated instruction', async () => {
      const tts = new GnaniTtsService();
      (tts as any).apiKey = 'test_mock_key';

      let upstreamCalls = 0;
      global.fetch = (async (url: string, init: any) => {
        if (url.includes('/api/v1/tts/inference')) {
          upstreamCalls++;
          const body = JSON.parse(init.body);
          assert.strictEqual(body.model, 'timbre-v2.5');
          assert.strictEqual(body.language, 'ta-IN');
          assert.strictEqual(body.voice, 'Asmita');

          return new Response(Buffer.from('RIFFmockwavaudio'), {
            status: 200,
            headers: { 'Content-Type': 'audio/wav' }
          });
        }
        return originalFetch(url, init);
      }) as any;

      // First call -> upstream fetch
      const res1 = await tts.synthesize({
        text: 'வணக்கம், நான் வழிகாட்டுவேன்.',
        language: 'ta',
        speed: 0.95
      });

      assert.strictEqual(res1.cached, false);
      assert.strictEqual(res1.voice, 'Asmita');
      assert.strictEqual(res1.contentType, 'audio/wav');
      assert.strictEqual(upstreamCalls, 1);

      // Second call -> cached hit to preserve 5,000 credit budget
      const res2 = await tts.synthesize({
        text: 'வணக்கம், நான் வழிகாட்டுவேன்.',
        language: 'ta',
        speed: 0.95
      });

      assert.strictEqual(res2.cached, true);
      assert.strictEqual(upstreamCalls, 1); // Upstream was NOT called again
    });

    it('handles upstream 401 authentication error gracefully', async () => {
      const tts = new GnaniTtsService();
      (tts as any).apiKey = 'invalid_key';

      global.fetch = (async () => {
        return new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      }) as any;

      await assert.rejects(
        async () => tts.synthesize({ text: 'Hello', language: 'en', bypassCache: true }),
        { message: 'Gnani speech service authentication failed (401/403).' }
      );
    });

    it('handles upstream 429 rate limit gracefully', async () => {
      const tts = new GnaniTtsService();
      (tts as any).apiKey = 'valid_key';

      global.fetch = (async () => {
        return new Response('Rate limit', { status: 429, statusText: 'Too Many Requests' });
      }) as any;

      await assert.rejects(
        async () => tts.synthesize({ text: 'Hello', language: 'en', bypassCache: true }),
        { message: 'Gnani speech service rate limit exceeded (429).' }
      );
    });
  });

  describe('3. Gnani Prisma v2.5 STT Service', () => {
    it('rejects empty audio buffer with validation error', async () => {
      const stt = new GnaniSttService();
      (stt as any).apiKey = 'test_key';

      await assert.rejects(
        async () => stt.transcribe(Buffer.alloc(0), 'empty.wav', 'audio/wav', { languageCode: 'en' }),
        { message: 'Audio payload is empty or invalid.' }
      );
    });

    it('rejects audio buffer exceeding 15MB limit', async () => {
      const stt = new GnaniSttService();
      (stt as any).apiKey = 'test_key';
      const oversized = Buffer.alloc(16 * 1024 * 1024);

      await assert.rejects(
        async () => stt.transcribe(oversized, 'big.wav', 'audio/wav', { languageCode: 'en' }),
        /exceeds maximum allowed size/
      );
    });

    it('transcribes valid audio buffer using Prisma REST v3 format', async () => {
      const stt = new GnaniSttService();
      (stt as any).apiKey = 'test_stt_key';

      global.fetch = (async (url: string, init: any) => {
        if (url.includes('/stt/v3')) {
          assert.strictEqual(init.headers['X-API-Key-ID'], 'test_stt_key');
          return new Response(JSON.stringify({
            success: true,
            request_id: 'req_stt_789',
            transcript: 'Cognitive markers and visual path tracings measure baseline motor coordination'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return originalFetch(url, init);
      }) as any;

      const mockBuffer = Buffer.from('RIFFwavtestaudio');
      const result = await stt.transcribe(mockBuffer, 'rec.wav', 'audio/wav', { languageCode: 'en' });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.transcript, 'Cognitive markers and visual path tracings measure baseline motor coordination');
      assert.strictEqual(result.language, 'en-IN');
      assert.strictEqual(result.requestId, 'req_stt_789');
    });

    it('handles empty transcript without failing', async () => {
      const stt = new GnaniSttService();
      (stt as any).apiKey = 'test_stt_key';

      global.fetch = (async (url: string) => {
        if (url.includes('/stt/v3')) {
          return new Response(JSON.stringify({
            success: true,
            transcript: ''
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return originalFetch(url);
      }) as any;

      const mockBuffer = Buffer.from('RIFFwavtestaudio');
      const result = await stt.transcribe(mockBuffer, 'rec.wav', 'audio/wav', { languageCode: 'ta' });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.transcript, '');
      assert.strictEqual(result.language, 'ta-IN');
    });
  });

  describe('4. VoiceController Request Handlers & Rate Limiting', () => {
    it('rejects transcribe request when req.file is missing with 400', async () => {
      const req: any = { body: { language: 'en' } };
      const res = createMockResponse();

      await voiceController.transcribe(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.body.error.includes('Missing audio file'));
    });

    it('rejects unsupported media type with 415', async () => {
      const req: any = {
        file: {
          mimetype: 'application/pdf',
          buffer: Buffer.from('test')
        },
        body: { language: 'en' }
      };
      const res = createMockResponse();

      await voiceController.transcribe(req, res);
      assert.strictEqual(res.statusCode, 415);
      assert.ok(res.body.error.includes('Unsupported media type'));
    });

    it('rejects synthesize with invalid empty text with 400', async () => {
      const req: any = {
        body: { text: '', language: 'ta' }
      };
      const res = createMockResponse();

      await voiceController.synthesize(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.error, 'Validation failed for synthesis request');
    });

    it('Evon summary evaluates status cleanly without crashing', async () => {
      const req: any = {
        body: {
          testScores: {
            memoryScore: 85,
            attentionScore: 90,
            visuospatialScore: 80,
            executiveScore: 78,
            compositeScore: 83
          },
          language: 'en'
        }
      };
      const res = createMockResponse();

      await voiceController.evonSummary(req, res);
      // Evon unconfigured returns 503 with safe reason
      assert.strictEqual(res.statusCode, 503);
      assert.strictEqual(res.body.available, false);
      assert.ok(res.body.model.includes('evon'));
    });
  });
});

