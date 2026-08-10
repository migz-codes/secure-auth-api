import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './errors/global-exception.filter'
import { LoggerInterceptor } from './interceptors/logger.interceptor'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const config = app.get(ConfigService)
  const port = config.get<number>('app.port') ?? 3001
  const corsOrigin = config.get<string>('app.corsOrigin')

  app.use(helmet())

  app.enableCors({
    credentials: true,
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  })

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  )

  app.useGlobalFilters(new GlobalExceptionFilter())

  app.useGlobalInterceptors(new LoggerInterceptor())

  // Lets Nest run onModuleDestroy (Prisma disconnect) on SIGTERM.
  app.enableShutdownHooks()

  await app.listen(port, '0.0.0.0')
}

bootstrap()
