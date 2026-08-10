import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'

const colors = { dim: '\x1b[2m', cyan: '\x1b[36m', reset: '\x1b[0m' }

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now()
    const request = context.switchToHttp().getRequest()

    const url = request?.url || 'unknown'
    const method = request?.method || 'UNKNOWN'

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start

        console.log(
          `🌐 ${colors.cyan}${method}${colors.reset} ${url} ${colors.dim}${duration}ms${colors.reset}`
        )
      })
    )
  }
}
