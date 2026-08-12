import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { RefreshTokenModule } from '../refresh-token/refresh-token.module'
import { TokenModule } from '../token/token.module'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'

@Module({
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
  imports: [UsersModule, RefreshTokenModule, TokenModule],
  providers: [AuthService, AuthGuard, { provide: APP_GUARD, useExisting: AuthGuard }]
})
export class AuthModule {}
