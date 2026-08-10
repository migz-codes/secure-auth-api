import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { appConfig } from './app.config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { authConfig } from './config/auth.config'
import { envSchema } from './config/env.validation'

import { PrismaModule } from './lib/prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      ignoreEnvFile: false,
      expandVariables: true,
      validationSchema: envSchema,
      load: [appConfig, authConfig],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env']
    }),
    PrismaModule,

    ScheduleModule.forRoot(),

    AuthModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
