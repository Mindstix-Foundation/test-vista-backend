import { Module } from '@nestjs/common';
import { McqPatternFilterController } from './mcq-pattern-filter.controller';
import { McqPatternFilterService } from './mcq-pattern-filter.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [McqPatternFilterController],
  providers: [McqPatternFilterService, PrismaService],
  exports: [McqPatternFilterService],
})
export class McqPatternFilterModule {}
