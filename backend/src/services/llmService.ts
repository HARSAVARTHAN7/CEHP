import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { generateGeminiText, isGeminiAvailable } from './geminiService';

export interface LLMRequestOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Universal free & low-latency LLM Caller
 * Prioritizes Google Gemini via the official SDK in geminiService.ts
 */
export async function callFreeLLM(options: LLMRequestOptions): Promise<string | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.LLM_API_KEY ||
    config.gemini.apiKey ||
    config.llm.apiKey;

  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  const trimmedKey = apiKey.trim();
  const provider = (process.env.LLM_PROVIDER || config.llm.provider || 'gemini').toLowerCase();

  // 1. Google Gemini (Preferred primary provider)
  if (provider === 'gemini' || isGeminiAvailable() || trimmedKey.startsWith('AIzaSy')) {
    try {
      const text = await generateGeminiText(options.prompt, {
        systemInstruction: options.systemPrompt,
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      });
      if (text) {
        return text;
      }
    } catch (err: any) {
      logger.warn('Gemini call failed in callFreeLLM:', err.message);
    }
  }

  // 2. Groq Cloud (Secondary fallback)
  if (provider === 'groq' || trimmedKey.startsWith('gsk_')) {
    try {
      const model = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';
      const cleanModel = model.includes('llama') ? model : 'llama-3.3-70b-versatile';
      const url = 'https://api.groq.com/openai/v1/chat/completions';

      const messages: any[] = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: options.prompt });

      const res = await axios.post(
        url,
        {
          model: cleanModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${trimmedKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const content = res.data?.choices?.[0]?.message?.content;
      if (content) {
        return content.trim();
      }
    } catch (err: any) {
      logger.warn('Groq API call failed:', err.response?.data || err.message);
    }
  }

  // 3. Generic OpenAI / OpenRouter endpoint if configured
  if (provider === 'openai' || provider === 'openrouter') {
    try {
      const baseUrl = provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const model = process.env.LLM_MODEL || config.llm.model || (provider === 'openrouter' ? 'meta-llama/llama-3.1-8b-instruct:free' : 'gpt-4o-mini');

      const messages: any[] = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: options.prompt });

      const res = await axios.post(
        baseUrl,
        {
          model,
          messages,
          temperature: options.temperature ?? 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${trimmedKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const content = res.data?.choices?.[0]?.message?.content;
      if (content) {
        return content.trim();
      }
    } catch (err: any) {
      logger.warn(`${provider} API call failed:`, err.response?.data || err.message);
    }
  }

  return null;
}
