import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  AI_SERVICE_URL: z.string().default('http://localhost:8001'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('qwen/qwen3.8-27b'),
  LLM_PROVIDER: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  BCRYPT_ROUNDS: z.string().default('12'),
  MAX_UPLOAD_SIZE_MB: z.string().default('10'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  mongodbUri: parsed.data.MONGODB_URI,
  jwt: {
    secret: parsed.data.JWT_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },
  frontendOrigin: parsed.data.FRONTEND_ORIGIN,
  aiServiceUrl: parsed.data.AI_SERVICE_URL,
  gemini: {
    apiKey: parsed.data.GEMINI_API_KEY || parsed.data.LLM_API_KEY || '',
    model: parsed.data.GEMINI_MODEL || parsed.data.LLM_MODEL || 'gemini-1.5-flash',
  },
  groq: {
    apiKey: parsed.data.GROQ_API_KEY || (parsed.data.LLM_PROVIDER === 'groq' ? parsed.data.LLM_API_KEY : '') || '',
    model: parsed.data.GROQ_MODEL || (parsed.data.LLM_PROVIDER === 'groq' ? parsed.data.LLM_MODEL : '') || 'qwen/qwen3.8-27b',
  },
  llm: {
    provider: parsed.data.LLM_PROVIDER,
    apiKey: parsed.data.GEMINI_API_KEY || parsed.data.GROQ_API_KEY || parsed.data.LLM_API_KEY,
    model: parsed.data.GROQ_MODEL || parsed.data.GEMINI_MODEL || parsed.data.LLM_MODEL,
  },
  bcryptRounds: parseInt(parsed.data.BCRYPT_ROUNDS, 10),
  maxUploadSizeMb: parseInt(parsed.data.MAX_UPLOAD_SIZE_MB, 10),
  smtp: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT ? parseInt(parsed.data.SMTP_PORT, 10) : 587,
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
    from: parsed.data.SMTP_FROM || 'noreply@cehp.edu',
  },
} as const;
