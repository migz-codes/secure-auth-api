import { HttpStatus, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { AppError } from '../../errors/app.error'
import { CreateUserDto } from '../users/dto/user.dto'
import { SafeUser, UsersService } from '../users/users.service'
import { LoginDto } from './auth.dto'
import { RefreshTokenService } from './refresh-token.service'
import { TokenService } from './token.service'

export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: SafeUser
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService
  ) {}

  private async generateTokens(id: string, email: string) {
    const payload = { sub: id, email }
    const expiresAt = this.tokenService.getRefreshTokenExpiryDate()
    const jti = await this.refreshTokenService.storeToken(id, expiresAt)

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccess(payload),
      this.tokenService.signRefresh(payload, jti)
    ])

    return { accessToken, refreshToken }
  }

  async login(input: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithPassword(input.email)

    const hash =
      user?.password ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'
    const isPasswordValid = await bcrypt.compare(input.password, hash)

    if (!user || !isPasswordValid)
      throw new AppError('Invalid credentials', HttpStatus.UNAUTHORIZED)

    const { password: _password, ...safeUser } = user
    const tokens = await this.generateTokens(user.id, user.email)

    return { ...tokens, user: safeUser }
  }

  async register(input: CreateUserDto): Promise<AuthResult> {
    const user = await this.usersService.create(input)
    const tokens = await this.generateTokens(user.id, user.email)

    return { ...tokens, user }
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = await this.tokenService.validate(refreshToken)

    if (!payload || payload.type !== 'refresh' || !payload.jti)
      throw new AppError('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED)

    await this.refreshTokenService.consumeToken(payload.jti)

    const user = await this.usersService.findById(payload.sub)
    const tokens = await this.generateTokens(user.id, user.email)

    return { ...tokens, user }
  }

  async logout(refreshToken: string): Promise<{ success: boolean }> {
    const payload = await this.tokenService.validate(refreshToken)

    if (payload?.jti) await this.refreshTokenService.invalidateToken(payload.jti)

    return { success: true }
  }

  async logoutAll(userId: string): Promise<{ success: boolean }> {
    await this.refreshTokenService.invalidateAllUserTokens(userId)

    return { success: true }
  }
}
