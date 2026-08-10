import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { CreateUserDto } from '../users/dto/user.dto'
import { UsersService } from '../users/users.service'
import { LoginDto, RefreshTokenDto } from './auth.dto'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { AuthenticatedUser } from './auth.types'
import { CurrentUser } from './current-user.decorator'
import { Public } from './public.decorator'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Public()
  @Post('register')
  async register(@Body() input: CreateUserDto) {
    return this.authService.register(input)
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() input: LoginDto) {
    return this.authService.login(input)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() input: RefreshTokenDto) {
    return this.authService.refresh(input.refreshToken)
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() input: RefreshTokenDto) {
    return this.authService.logout(input.refreshToken)
  }

  @UseGuards(AuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logoutAll(user.id)
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id)
  }
}
