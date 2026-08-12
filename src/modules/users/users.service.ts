import { HttpStatus, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import type { User } from '../../../generated/prisma/client'
import { AppError } from '../../errors/app.error'
import { PrismaService } from '../../lib/prisma/prisma.service'
import { CreateUserDto, UpdatePasswordDto, UpdateProfileDto } from './types/user.dto'

const BCRYPT_ROUNDS = 10

export type SafeUser = Omit<User, 'password'>

function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safe } = user

  return safe
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserDto): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } })

    if (existing) throw new AppError('Email already registered', HttpStatus.CONFLICT)

    const password = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

    const user = await this.prisma.user.create({
      data: { name: input.name, email: input.email, password }
    })

    return toSafeUser(user)
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } })

    if (!user) throw new AppError('User not found', HttpStatus.NOT_FOUND)

    return toSafeUser(user)
  }

  async updateProfile(userId: string, input: UpdateProfileDto): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: input.name, email: input.email }
    })

    return toSafeUser(user)
  }

  async updatePassword(userId: string, input: UpdatePasswordDto): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })

    if (!user) throw new AppError('User not found', HttpStatus.NOT_FOUND)

    const isPasswordValid = await bcrypt.compare(input.currentPassword, user.password)

    if (!isPasswordValid)
      throw new AppError('Current password is incorrect', HttpStatus.BAD_REQUEST)

    const password = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS)
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { password } })

    return toSafeUser(updated)
  }
}
