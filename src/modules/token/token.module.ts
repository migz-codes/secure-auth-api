import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { authConfig } from '../../config/auth.config'
import { TokenService } from './token.service'

@Module({
  // No global secret: there are two, and which one applies depends on the
  // token class. Every sign and verify names its own.
  imports: [ConfigModule.forFeature(authConfig), JwtModule.register({})],
  providers: [TokenService],
  exports: [TokenService]
})
export class TokenModule {}
