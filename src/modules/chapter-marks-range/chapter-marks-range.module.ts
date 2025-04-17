import { Module } from '@nestjs/common';
import { ChapterMarksRangeController } from './chapter-marks-range.controller';
import { ChapterMarksRangeService } from './chapter-marks-range.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChapterMarksRangeController],
  providers: [ChapterMarksRangeService],
  exports: [ChapterMarksRangeService]
})
export class ChapterMarksRangeModule {} 