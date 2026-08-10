import { registerAs } from '@nestjs/config'

export interface AuthConfig {
  secret: string
  expiresIn: string
  refreshExpiresIn: string
}

export const authConfig = registerAs(
  'auth',
  (): AuthConfig => ({
    // No fallback secret on purpose — env.validation requires JWT_SECRET, so a
    // missing value must fail startup rather than silently sign with a default.
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '14d'
  })
)
