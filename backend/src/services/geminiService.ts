import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { config } from '../config/env';
import { logger } from '../utils/logger';

let genAIInstance: GoogleGenerativeAI | null = null;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || config.gemini.apiKey || process.env.LLM_API_KEY || '';
  return key.trim();
}

/**
 * Returns whether a Gemini API key is configured and validly structured.
 */
export function isGeminiAvailable(): boolean {
  const key = getApiKey();
  return key.length > 10;
}

/**
 * Lazy-initializes and returns the singleton GoogleGenerativeAI client.
 */
function getClient(): GoogleGenerativeAI {
  const key = getApiKey();
  if (!key) {
    throw new Error('Gemini API Key is not configured. Please set GEMINI_API_KEY in backend/.env');
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(key);
    const masked = key.length > 8 ? `${key.substring(0, 6)}...${key.slice(-4)}` : 'configured';
    logger.info(`✅ Gemini AI Service initialized securely with key: ${masked}`);
  }
  return genAIInstance;
}

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || config.gemini.model || 'gemini-1.5-flash';
}

export interface GeminiTextOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

const DEFAULT_SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

/**
 * Helper to run a promise with a maximum timeout.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = 'Gemini API request timed out'): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Generates text using Gemini with bounded retry on transient errors.
 */
export async function generateGeminiText(prompt: string, options: GeminiTextOptions = {}): Promise<string> {
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('Prompt cannot be empty for Gemini text generation.');
  }

  if (!isGeminiAvailable()) {
    throw new Error('Gemini API Key is not configured. Please set GEMINI_API_KEY in backend/.env');
  }

  const client = getClient();
  const modelName = getGeminiModelName();
  const timeoutMs = options.timeoutMs ?? 15000;

  let retries = 2;
  let lastError: any = null;

  while (retries >= 0) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: options.systemInstruction,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxOutputTokens ?? 1500,
        },
        safetySettings: DEFAULT_SAFETY_SETTINGS,
      });

      const response = await withTimeout(
        model.generateContent(prompt),
        timeoutMs,
        `Gemini API request timed out after ${timeoutMs}ms`
      );

      const text = response.response.text();
      if (!text || text.trim() === '') {
        throw new Error('Gemini returned an empty response.');
      }
      return text.trim();
    } catch (err: any) {
      lastError = err;
      const status = err.status || err.statusCode;
      const msg = err.message || '';

      // Don't retry client errors or invalid credentials
      if (status === 400 || status === 401 || status === 403 || msg.includes('API_KEY_INVALID')) {
        logger.error(`Gemini authorization / bad request error (${status}): ${msg}`);
        throw new Error(`Gemini API authorization failure: ${msg}`);
      }

      // Transient failure (429 or 503 or timeout) -> bounded retry
      if (retries > 0 && (status === 429 || status === 503 || msg.includes('timed out'))) {
        retries--;
        logger.warn(`Gemini transient error (${status || msg}). Retrying... (${retries} left)`);
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }

      break;
    }
  }

  logger.error(`Gemini generation failed: ${lastError?.message || lastError}`);
  throw new Error(`Gemini service error: ${lastError?.message || 'Unable to complete AI request'}`);
}

/**
 * Generates structured JSON from Gemini and safely parses/validates it.
 */
export async function generateGeminiStructured<T>(
  prompt: string,
  schemaDescription: string,
  options: GeminiTextOptions = {}
): Promise<T> {
  const structuredPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching this schema:\n${schemaDescription}\nDo NOT include markdown formatting like \`\`\`json or \`\`\` around the response. Return raw JSON only.`;

  const rawText = await generateGeminiText(structuredPrompt, {
    ...options,
    temperature: options.temperature ?? 0.2, // Low temperature for deterministic formatting
  });

  // Clean any markdown codefence wrapping if present
  let cleanJson = rawText.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleanJson) as T;
  } catch (err) {
    logger.warn('Failed to parse Gemini structured JSON output:', cleanJson.substring(0, 200));
    throw new Error('Gemini output could not be parsed as valid JSON.');
  }
}

/**
 * Multi-turn chat with conversation history context.
 */
export async function chatWithGemini(
  messages: { role: 'user' | 'model'; text: string }[],
  options: GeminiTextOptions = {}
): Promise<string> {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API Key is not configured. Please set GEMINI_API_KEY in backend/.env');
  }

  const client = getClient();
  const modelName = getGeminiModelName();
  const timeoutMs = options.timeoutMs ?? 15000;

  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: options.systemInstruction,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 1500,
    },
    safetySettings: DEFAULT_SAFETY_SETTINGS,
  });

  // Prepare chat history (all messages except the latest user message)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const latestMessage = messages[messages.length - 1];
  if (!latestMessage || !latestMessage.text) {
    throw new Error('Chat requires at least one user query message.');
  }

  const chat = model.startChat({ history });
  const result = await withTimeout(
    chat.sendMessage(latestMessage.text),
    timeoutMs,
    `Gemini chat request timed out after ${timeoutMs}ms`
  );

  const answer = result.response.text();
  if (!answer || answer.trim() === '') {
    throw new Error('Gemini returned an empty response.');
  }

  return answer.trim();
}
