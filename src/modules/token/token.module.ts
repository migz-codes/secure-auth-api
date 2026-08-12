import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { authConfig } from '../../config/auth.config'
import { TokenService } from './token.service'

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule.forFeature(authConfig)],
      useFactory: (config: ConfigService) => ({ secret: config.get<string>('auth.secret') })
    })
  ],
  providers: [TokenService],
  exports: [TokenService]
})
export class TokenModule {}
