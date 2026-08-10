import * as Joi from 'joi'

export const envSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  CORS_ORIGIN: Joi.string().uri().required(),

  // Infrastructure
  DATABASE_URL: Joi.string().required(),

  // Auth — JWT_SECRET has no fallback in auth.config, so it must be required here.
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('14d')
})
