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
  return process.env.GEMINI_MODEL || config.gemini.model || 'gemini-3.5-flash';
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
  const candidateModels = [getGeminiModelName(), 'gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.5-flash'];
  const timeoutMs = options.timeoutMs ?? 4500;

  let lastError: any = null;

  for (const modelName of candidateModels) {
    let retries = 1;
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

        // If this model is unavailable/not found/quota/503, try next candidate model
        if (status === 404 || status === 503 || msg.includes('not found') || msg.includes('high demand')) {
          logger.warn(`Model ${modelName} returned ${status}. Attempting fallback model...`);
          break; // break retry loop to try next model in candidateModels
        }

        // Bounded retry on 429
        if (retries > 0 && status === 429) {
          retries--;
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }

        break;
      }
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
  const candidateModels = [getGeminiModelName(), 'gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.5-flash'];
  const timeoutMs = options.timeoutMs ?? 4500;

  // Prepare and sanitize chat history (Gemini requires history to start with 'user', alternate, and end with 'model')
  const rawHistory = messages.slice(0, -1);
  const firstUserIdx = rawHistory.findIndex((m) => m.role === 'user');
  const validHistorySlice = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

  const sanitizedHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  for (const m of validHistorySlice) {
    if (!m.text || m.text.trim() === '') continue;
    const lastItem = sanitizedHistory[sanitizedHistory.length - 1];
    if (!lastItem || lastItem.role !== m.role) {
      sanitizedHistory.push({
        role: m.role,
        parts: [{ text: m.text.trim() }],
      });
    }
  }

  // Ensure history ends with 'model' so that chat.sendMessage(latestMessage) is a valid alternating 'user' turn
  while (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role !== 'model') {
    sanitizedHistory.pop();
  }

  // Keep only the most recent complete turns (up to 10 messages)
  const history = sanitizedHistory.slice(-10);

  const latestMessage = messages[messages.length - 1];
  if (!latestMessage || !latestMessage.text || latestMessage.text.trim() === '') {
    throw new Error('Chat requires at least one user query message.');
  }

  let lastError: any = null;

  for (const modelName of candidateModels) {
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

      const chat = model.startChat({ history });
      const result = await withTimeout(
        chat.sendMessage(latestMessage.text),
        timeoutMs,
        `Gemini chat request timed out after ${timeoutMs}ms`
      );

      const answer = result.response.text();
      if (answer && answer.trim() !== '') {
        return answer.trim();
      }
    } catch (err: any) {
      lastError = err;
      logger.warn(`Model ${modelName} chat attempt failed: ${err.message}. Trying next fallback model...`);
    }
  }

  throw new Error(`Gemini chat service failure: ${lastError?.message || 'Unable to get response from Gemini'}`);
}
