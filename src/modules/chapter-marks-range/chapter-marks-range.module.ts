import { Module } from '@nestjs/common';
import { ChapterMarksRangeController } from './chapter-marks-range.controller';
import { ChapterMarksRangeService } from './chapter-marks-range.service';
import { CreateTestPaperService } from '../create_test_paper/create-test-paper.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChapterMarksRangeController],
  providers: [ChapterMarksRangeService, CreateTestPaperService],
  exports: [ChapterMarksRangeService]
})
export class ChapterMarksRangeModule {} 