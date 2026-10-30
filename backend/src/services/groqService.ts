import Groq from 'groq-sdk';
import { config } from '../config/env';
import { logger } from '../utils/logger';

let groqInstance: Groq | null = null;

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY || config.groq.apiKey || (process.env.LLM_PROVIDER === 'groq' ? process.env.LLM_API_KEY : '') || '';
  return key.trim();
}

/**
 * Returns whether a Groq API key is configured.
 */
export function isGroqAvailable(): boolean {
  const key = getApiKey();
  return key.startsWith('gsk_') && key.length > 20;
}

/**
 * Returns the Groq client singleton.
 */
function getClient(): Groq {
  const key = getApiKey();
  if (!key) {
    throw new Error('Groq API Key is not configured. Please set GROQ_API_KEY in server environment.');
  }
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: key });
    const masked = `${key.substring(0, 6)}...${key.slice(-4)}`;
    logger.info(`✅ Groq AI Service initialized securely with key: ${masked}`);
  }
  return groqInstance;
}

export function getGroqModelName(): string {
  return process.env.GROQ_MODEL || config.groq.model || 'qwen/qwen3.8-27b';
}

export interface GroqTextOptions {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Supported Groq candidate models in order of priority for seamless failover.
 */
const CANDIDATE_GROQ_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

async function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Generates text from Groq using prompt and optional system instruction.
 */
export async function generateGroqText(
  prompt: string,
  options: GroqTextOptions = {}
): Promise<string> {
  const client = getClient();
  const configuredModel = getGroqModelName();
  const candidateModels = [configuredModel, ...CANDIDATE_GROQ_MODELS.filter((m) => m !== configuredModel)];
  const timeoutMs = options.timeoutMs ?? 10000;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [];
  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const completion = await withTimeout(
        client.chat.completions.create({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1500,
        }),
        timeoutMs,
        `Groq API request timed out after ${timeoutMs}ms for model ${model}`
      );

      const content = completion.choices[0]?.message?.content;
      if (content && content.trim() !== '') {
        return content.trim();
      }
    } catch (err: any) {
      lastError = err;
      const status = err.status || err.statusCode;
      logger.warn(`Groq model ${model} attempt failed: ${err.message || status}. Trying fallback model...`);
    }
  }

  logger.error(`Groq generation failed on all candidate models: ${lastError?.message || lastError}`);
  throw new Error(`Groq service error: ${lastError?.message || 'Unable to complete AI request'}`);
}

/**
 * Multi-turn chat conversation using Groq.
 */
export async function chatWithGroq(
  messages: { role: 'user' | 'assistant'; text: string }[],
  options: GroqTextOptions = {}
): Promise<string> {
  const client = getClient();
  const configuredModel = getGroqModelName();
  const candidateModels = [configuredModel, ...CANDIDATE_GROQ_MODELS.filter((m) => m !== configuredModel)];
  const timeoutMs = options.timeoutMs ?? 4500;

  const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [];
  if (options.systemInstruction) {
    groqMessages.push({ role: 'system', content: options.systemInstruction });
  }

  for (const m of messages) {
    if (!m.text || m.text.trim() === '') continue;
    groqMessages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text.trim(),
    });
  }

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const completion = await withTimeout(
        client.chat.completions.create({
          model,
          messages: groqMessages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1500,
        }),
        timeoutMs,
        `Groq chat request timed out after ${timeoutMs}ms for model ${model}`
      );

      const content = completion.choices[0]?.message?.content;
      if (content && content.trim() !== '') {
        return content.trim();
      }
    } catch (err: any) {
      lastError = err;
      const status = err.status || err.statusCode;
      logger.warn(`Groq chat model ${model} attempt failed: ${err.message || status}. Trying fallback model...`);
    }
  }

  throw new Error(`Groq chat service failure: ${lastError?.message || 'Unable to get response from Groq'}`);
}

/**
 * Generates structured JSON from Groq and parses it safely.
 */
export async function generateGroqStructured<T>(
  prompt: string,
  jsonSchemaHint: string,
  options: GroqTextOptions = {}
): Promise<T> {
  const structuredPrompt = `${prompt}\n\nYou MUST respond with valid JSON matching this schema:\n${jsonSchemaHint}\nDo not include code block fences, explanatory text, or markdown. Output raw JSON only.`;
  const rawText = await generateGroqText(structuredPrompt, {
    ...options,
    temperature: options.temperature ?? 0.2,
  });

  const cleanJson = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleanJson) as T;
  } catch {
    logger.warn('Failed to parse Groq structured JSON output:', cleanJson.substring(0, 200));
    throw new Error('Groq output could not be parsed as valid JSON.');
  }
}
