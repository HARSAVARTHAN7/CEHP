import { config } from '../config/env';
import { logger } from '../utils/logger';
import { generateGroqText, isGroqAvailable } from './groqService';

export interface LLMRequestOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Universal free & low-latency LLM Caller
 * Uses Groq exclusively via official SDK in groqService.ts
 */
export async function callFreeLLM(options: LLMRequestOptions): Promise<string | null> {
  if (!isGroqAvailable()) {
    logger.warn('Groq is not available for callFreeLLM.');
    return null;
  }

  try {
    const text = await generateGroqText(options.prompt, {
      systemInstruction: options.systemPrompt,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      timeoutMs: options.timeoutMs ?? 4500,
    });
    return text || null;
  } catch (err: any) {
    logger.warn('Groq call failed in callFreeLLM:', err.message);
    return null;
  }
}
