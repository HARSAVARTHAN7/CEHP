import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface LLMRequestOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Universal free & low-latency LLM Caller
 * Supports:
 * 1. Google Gemini (Free at aistudio.google.com)
 * 2. Groq Cloud (Free at console.groq.com)
 * 3. OpenAI / OpenRouter compatible APIs
 */
export async function callFreeLLM(options: LLMRequestOptions): Promise<string | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.LLM_API_KEY ||
    config.llm.apiKey;

  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  const trimmedKey = apiKey.trim();
  const provider = (process.env.LLM_PROVIDER || config.llm.provider || '').toLowerCase();

  // 1. Google Gemini (Default if key starts with AIzaSy or provider is gemini)
  if (provider === 'gemini' || trimmedKey.startsWith('AIzaSy')) {
    try {
      const model = process.env.LLM_MODEL || config.llm.model || 'gemini-1.5-flash';
      const cleanModel = model.startsWith('gemini') ? model : 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${trimmedKey}`;

      const contents: any[] = [];
      if (options.systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: `[System Instruction]: ${options.systemPrompt}\n\n[User Query]: ${options.prompt}` }],
        });
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: options.prompt }],
        });
      }

      const res = await axios.post(
        url,
        { contents },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );

      const candidate = res.data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      if (text) {
        return text.trim();
      }
    } catch (err: any) {
      logger.warn('Google Gemini API call failed:', err.response?.data || err.message);
    }
  }

  // 2. Groq Cloud (Free fast Llama-3.3-70b at console.groq.com)
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
