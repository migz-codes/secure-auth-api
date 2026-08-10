import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { authConfig } from '../../config/auth.config'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { RefreshTokenService } from './refresh-token.service'
import { TokenService } from './token.service'
import { TokenCleanupTask } from './token-cleanup.task'

@Module({
  imports: [
    UsersModule,
    ConfigModule.forFeature(authConfig),
    JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule.forFeature(authConfig)],
      // Per-call signOptions carry the expiry; only the secret is global here.
      useFactory: (config: ConfigService) => ({ secret: config.get<string>('auth.secret') })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, RefreshTokenService, TokenCleanupTask, AuthGuard],
  exports: [AuthService, TokenService, AuthGuard]
})
export class AuthModule {}
