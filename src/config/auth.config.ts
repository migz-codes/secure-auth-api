import { registerAs } from '@nestjs/config'

export interface AuthConfig {
  accessSecret: string
  refreshSecret: string
  expiresIn: string
  refreshExpiresIn: string
}

export const authConfig = registerAs(
  'auth',
  (): AuthConfig => ({
    accessSecret: process.env.JWT_ACCESS_SECRET as string,
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '14d'
  })
)
