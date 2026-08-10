import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { AppError } from '@/src/errors/app.error'
import { logStyledError } from '@/src/errors/utils/errorLogger'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const contextType = host.getType<string>()

    if (contextType !== 'http') return

    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    if (exception instanceof AppError) {
      const status = exception.getStatus()

      logStyledError({ status, type: 'HTTP', message: exception.message })

      return response.status(status).json({
        errors: [{ status, message: exception.message, timestamp: new Date().toISOString() }]
      })
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || 'Internal server error'

      const messages = Array.isArray(message) ? message : [message]

      logStyledError({ status, message: messages.join(', '), type: 'HTTP' })

      if (status === 400 && Array.isArray(message)) {
        return response.status(status).json({
          errors: [
            {
              status: 400,
              validationErrors: messages,
              message: 'Validation failed',
              timestamp: new Date().toISOString()
            }
          ]
        })
      }

      return response
        .status(status)
        .json({ errors: [{ status, message: messages[0], timestamp: new Date().toISOString() }] })
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR
    const message = exception.message || 'Internal server error'

    logStyledError({ status, message, type: 'HTTP' })

    return response
      .status(status)
      .json({ errors: [{ status, message, timestamp: new Date().toISOString() }] })
  }
}
