import { Module } from '@nestjs/common'
import { RefreshTokenService } from './refresh-token.service'
import { TokenCleanupTask } from './token-cleanup.task'

@Module({
  providers: [RefreshTokenService, TokenCleanupTask],
  exports: [RefreshTokenService]
})
export class RefreshTokenModule {}
