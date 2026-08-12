import { HttpStatus, Injectable } from '@nestjs/common'
import { AppError } from '../../errors/app.error'
import { PrismaService } from '../../lib/prisma/prisma.service'

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async storeToken(userId: string, expiresAt: Date): Promise<string> {
    const created = await this.prisma.refreshToken.create({
      data: { user_id: userId, expires_at: expiresAt }
    })

    return created.id
  }

  async consumeToken(jti: string): Promise<{ userId: string }> {
    const token = await this.prisma.refreshToken.findUnique({ where: { id: jti } })

    if (!token) throw new AppError('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED)

    await this.prisma.refreshToken.delete({ where: { id: jti } }).catch(() => {})

    if (token.expires_at < new Date())
      throw new AppError('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED)

    return { userId: token.user_id }
  }

  async invalidateToken(jti: string): Promise<void> {
    await this.prisma.refreshToken.delete({ where: { id: jti } }).catch(() => {})
  }

  async invalidateAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { user_id: userId } })
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expires_at: { lt: new Date() } }
    })

    return result.count
  }
}
