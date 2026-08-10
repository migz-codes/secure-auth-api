import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RefreshTokenService } from './refresh-token.service'

@Injectable()
export class TokenCleanupTask {
  private readonly logger = new Logger(TokenCleanupTask.name)

  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanup() {
    const count = await this.refreshTokenService.cleanupExpiredTokens()

    this.logger.log(`Cleaned up ${count} expired refresh tokens`)
  }
}
