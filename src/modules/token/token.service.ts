import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { convertToSeconds } from '../../utils/time.util'

export interface JwtPayload {
  sub: string
  jti?: string
  email: string
  type: 'access' | 'refresh'
}

@Injectable()
export class TokenService {
  private readonly accessSecret: string
  private readonly refreshSecret: string
  private readonly accessExpiry: string
  private readonly refreshExpiry: string

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService
  ) {
    this.accessSecret = configService.get<string>('auth.accessSecret') as string
    this.refreshSecret = configService.get<string>('auth.refreshSecret') as string
    this.accessExpiry = configService.get<string>('auth.expiresIn') ?? '15m'
    this.refreshExpiry = configService.get<string>('auth.refreshExpiresIn') ?? '14d'
  }

  // Kept private so no caller can ask for "whichever class this token is" —
  // that question is how a refresh token gets accepted as an access token.
  private async verify(
    token: string,
    secret: string,
    type: JwtPayload['type']
  ): Promise<JwtPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret })

      return payload.type === type ? payload : null
    } catch {
      return null
    }
  }

  async validateAccess(token: string): Promise<JwtPayload | null> {
    return this.verify(token, this.accessSecret, 'access')
  }

  async validateRefresh(token: string): Promise<JwtPayload | null> {
    return this.verify(token, this.refreshSecret, 'refresh')
  }

  async signAccess(payload: Omit<JwtPayload, 'type' | 'jti'>): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'access' },
      { secret: this.accessSecret, expiresIn: convertToSeconds(this.accessExpiry) }
    )
  }

  async signRefresh(payload: Omit<JwtPayload, 'type' | 'jti'>, jti: string): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'refresh', jti },
      { secret: this.refreshSecret, expiresIn: convertToSeconds(this.refreshExpiry) }
    )
  }

  getRefreshTokenExpiryDate(): Date {
    const expiresAt = new Date()

    expiresAt.setSeconds(expiresAt.getSeconds() + convertToSeconds(this.refreshExpiry))

    return expiresAt
  }
}
