import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://edumatch:edumatch@localhost:5432/edumatch'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(12).default('change-me-access-secret'),
  JWT_REFRESH_SECRET: z.string().min(12).default('change-me-refresh-secret')
});

export const config = envSchema.parse(process.env);
