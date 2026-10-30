import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb+srv://harsavarthancs23_db_user:embF3w8VMzqsEZUU@cehp-cluster.njlqkzi.mongodb.net/cehp_db?retryWrites=true&w=majority&appName=cehp-cluster'),
  JWT_SECRET: z.string().default('your_super_secret_jwt_key_change_in_production_minimum_32_chars'),
  JWT_REFRESH_SECRET: z.string().default('your_refresh_secret_key_change_in_production_minimum_32_chars'),
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
  console.warn('⚠️ Some environment variables are invalid, using resilient defaults:', parsed.error.format());
}

const safeData = parsed.success ? parsed.data : envSchema.parse({});

export const config = {
  port: parseInt(safeData.PORT, 10),
  nodeEnv: safeData.NODE_ENV,
  mongodbUri: safeData.MONGODB_URI,
  jwt: {
    secret: safeData.JWT_SECRET,
    refreshSecret: safeData.JWT_REFRESH_SECRET,
    expiresIn: safeData.JWT_EXPIRES_IN,
    refreshExpiresIn: safeData.JWT_REFRESH_EXPIRES_IN,
  },
  frontendOrigin: safeData.FRONTEND_ORIGIN,
  aiServiceUrl: safeData.AI_SERVICE_URL,
  gemini: {
    apiKey: safeData.GEMINI_API_KEY || safeData.LLM_API_KEY || '',
    model: safeData.GEMINI_MODEL || safeData.LLM_MODEL || 'gemini-1.5-flash',
  },
  groq: {
    apiKey: safeData.GROQ_API_KEY || (safeData.LLM_PROVIDER === 'groq' ? safeData.LLM_API_KEY : '') || '',
    model: safeData.GROQ_MODEL || (safeData.LLM_PROVIDER === 'groq' ? safeData.LLM_MODEL : '') || 'qwen/qwen3.8-27b',
  },
  llm: {
    provider: safeData.LLM_PROVIDER,
    apiKey: safeData.GEMINI_API_KEY || safeData.GROQ_API_KEY || safeData.LLM_API_KEY,
    model: safeData.GROQ_MODEL || safeData.GEMINI_MODEL || safeData.LLM_MODEL,
  },
  bcryptRounds: parseInt(safeData.BCRYPT_ROUNDS, 10),
  maxUploadSizeMb: parseInt(safeData.MAX_UPLOAD_SIZE_MB, 10),
  smtp: {
    host: safeData.SMTP_HOST,
    port: safeData.SMTP_PORT ? parseInt(safeData.SMTP_PORT, 10) : 587,
    user: safeData.SMTP_USER,
    pass: safeData.SMTP_PASS,
    from: safeData.SMTP_FROM || 'noreply@cehp.edu',
  },
} as const;
