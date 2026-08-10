import { HttpException, HttpStatus } from '@nestjs/common'

export class AppError extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message, status)
    this.name = 'AppError'
  }
}
