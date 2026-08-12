import { Module } from '@nestjs/common'
import { RefreshTokenModule } from '../refresh-token/refresh-token.module'
import { TokenModule } from '../token/token.module'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'

@Module({
  imports: [UsersModule, RefreshTokenModule, TokenModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard]
})
export class AuthModule {}
