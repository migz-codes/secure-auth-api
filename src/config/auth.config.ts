import { registerAs } from '@nestjs/config'

export interface AuthConfig {
  secret: string
  expiresIn: string
  refreshExpiresIn: string
}

export const authConfig = registerAs(
  'auth',
  (): AuthConfig => ({
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '14d'
  })
)
