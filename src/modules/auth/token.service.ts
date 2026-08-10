import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { convertToSeconds } from '../../utils/time.util'

export interface JwtPayload {
  sub: string
  email: string
  type: 'access' | 'refresh'
  /** Refresh tokens only: the RefreshToken row id backing this token. */
  jti?: string
}

@Injectable()
export class TokenService {
  private readonly accessExpiry: string
  private readonly refreshExpiry: string

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService
  ) {
    this.accessExpiry = configService.get<string>('auth.expiresIn') ?? '15m'
    this.refreshExpiry = configService.get<string>('auth.refreshExpiresIn') ?? '14d'
  }

  /** Returns null on any invalid, expired or tampered token. */
  async validate(token: string): Promise<JwtPayload | null> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token)
    } catch {
      return null
    }
  }

  async signAccess(payload: Omit<JwtPayload, 'type' | 'jti'>): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'access' },
      { expiresIn: convertToSeconds(this.accessExpiry) }
    )
  }

  async signRefresh(payload: Omit<JwtPayload, 'type' | 'jti'>, jti: string): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'refresh', jti },
      { expiresIn: convertToSeconds(this.refreshExpiry) }
    )
  }

  getRefreshTokenExpiryDate(): Date {
    const expiresAt = new Date()

    expiresAt.setSeconds(expiresAt.getSeconds() + convertToSeconds(this.refreshExpiry))

    return expiresAt
  }
}
