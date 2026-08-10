import { registerAs } from '@nestjs/config'

export interface AppConfig {
  port: number
  nodeEnv: string
  corsOrigin: string
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  })
)
