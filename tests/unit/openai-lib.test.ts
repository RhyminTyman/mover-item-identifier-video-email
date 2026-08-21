/**
 * @jest-environment node
 */

/**
 * Tests for src/lib/openai.ts against the real module.
 *
 * Runs under the node environment: jest.config.js sets jsdom globally, and the
 * OpenAI SDK refuses to construct in a browser-like context without
 * `dangerouslyAllowBrowser`. This is server-only code.
 *
 * The client is constructed lazily: building it at import time threw whenever
 * OPENAI_API_KEY was absent, and `next build` imports every route module, so
 * the production build failed on any machine without a live key. These tests
 * pin that behaviour down.
 */

jest.unmock('@/lib/openai');

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('lib/openai', () => {
  describe('VISION_MODEL', () => {
    it('uses OPENAI_VISION_MODEL when set', async () => {
      process.env.OPENAI_VISION_MODEL = 'gpt-4o';
      const { VISION_MODEL } = await import('@/lib/openai');
      expect(VISION_MODEL).toBe('gpt-4o');
    });

    it('falls back to gpt-4o-mini when unset', async () => {
      delete process.env.OPENAI_VISION_MODEL;
      const { VISION_MODEL } = await import('@/lib/openai');
      expect(VISION_MODEL).toBe('gpt-4o-mini');
    });
  });

  describe('lazy client construction', () => {
    it('imports cleanly with no API key present', async () => {
      delete process.env.OPENAI_API_KEY;
      // Importing must not throw - this is what kept `next build` from running
      // without production secrets.
      await expect(import('@/lib/openai')).resolves.toBeDefined();
    });

    it('throws a clear error only when the client is actually used', async () => {
      delete process.env.OPENAI_API_KEY;
      const { openai } = await import('@/lib/openai');

      expect(() => openai.chat).toThrow('OPENAI_API_KEY is not configured');
    });

    it('constructs the client when a key is present', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      const { openai } = await import('@/lib/openai');

      expect(() => openai.chat).not.toThrow();
      expect(openai.chat.completions).toBeDefined();
    });

    it('reuses the same client across property accesses', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      const { openai } = await import('@/lib/openai');

      expect(openai.chat).toBe(openai.chat);
    });
  });
});
