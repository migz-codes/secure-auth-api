import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthenticatedRequest, AuthenticatedUser } from '../types/auth.types'

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().user
  }
)
