import { z } from 'zod';

/**
 * Railway service variables (design/04-backend-architecture.md).
 * Fails fast at boot on missing required config; optional integrations
 * (PayPal, R2, Redis) degrade to disabled so local dev can run with
 * just DATABASE_URL and JWT secrets.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  APP_ORIGIN: z.string().default('http://localhost:8081'),

  REDIS_URL: z.string().optional(),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),

  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_ENV: z.enum(['sandbox', 'live']).default('sandbox'),

  EXPO_ACCESS_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const isProd = env.NODE_ENV === 'production';
