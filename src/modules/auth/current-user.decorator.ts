import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthenticatedRequest, AuthenticatedUser } from './auth.types'

/** Reads the user AuthGuard attached to the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().user
  }
)
