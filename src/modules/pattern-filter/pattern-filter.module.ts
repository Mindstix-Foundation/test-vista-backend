import { Module } from '@nestjs/common';
import { PatternFilterController } from './pattern-filter.controller';
import { PatternFilterService } from './pattern-filter.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [PatternFilterController],
  providers: [PatternFilterService, PrismaService],
  exports: [PatternFilterService],
})
export class PatternFilterModule {} 