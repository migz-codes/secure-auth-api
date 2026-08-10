import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { databaseConfig } from './database.config'
import { PrismaService } from './prisma.service'

@Global()
@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
  exports: [PrismaService],
  providers: [PrismaService]
})
export class PrismaModule {}
