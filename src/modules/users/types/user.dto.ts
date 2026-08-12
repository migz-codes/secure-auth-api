import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @IsEmail()
  @IsNotEmpty()
  email!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  password!: string
}

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @IsEmail()
  @IsNotEmpty()
  email!: string
}

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  newPassword!: string
}
