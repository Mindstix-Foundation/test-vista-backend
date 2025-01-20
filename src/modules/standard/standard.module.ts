import { Module } from '@nestjs/common';
import { StandardService } from './standard.service';
import { StandardController } from './standard.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StandardController],
  providers: [StandardService],
  exports: [StandardService],
})
export class StandardModule {} 