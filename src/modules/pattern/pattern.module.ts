import { Module } from '@nestjs/common';
import { PatternService } from './pattern.service';
import { PatternController } from './pattern.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule
  ],
  controllers: [PatternController],
  providers: [PatternService],
  exports: [PatternService],
})
export class PatternModule {} 