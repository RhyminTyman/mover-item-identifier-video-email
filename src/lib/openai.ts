import OpenAI from "openai";

/**
 * The OpenAI client is created lazily.
 *
 * Constructing it at module scope throws when OPENAI_API_KEY is absent, and
 * `next build` imports every route module to collect page data - so the build
 * itself failed on any machine or CI job without a production API key. Deferring
 * construction to first use keeps builds hermetic while leaving call sites
 * (`openai.chat.completions.create(...)`) untouched.
 */
let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});

export const VISION_MODEL = process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini";
