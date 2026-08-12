import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AppError } from '../../errors/app.error'
import { AuthenticatedRequest } from './auth.types'
import { IS_PUBLIC_KEY } from './public.decorator'
import { TokenService } from './token.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const [scheme, token] = request.headers.authorization?.split(' ') ?? []

    if (scheme?.toLowerCase() !== 'bearer' || !token)
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED)

    const payload = await this.tokenService.validate(token)

    if (!payload || payload.type !== 'access')
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED)

    request.user = { id: payload.sub, email: payload.email }

    return true
  }
}
