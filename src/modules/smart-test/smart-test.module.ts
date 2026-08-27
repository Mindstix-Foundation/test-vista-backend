import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreateTestPaperModule } from '../create_test_paper/create-test-paper.module';
import { ChapterMarksDistributionModule } from '../chapter-marks-distribution/chapter-marks-distribution.module';
import { ChapterMarksRangeModule } from '../chapter-marks-range/chapter-marks-range.module';
import { PaperTemplateModule } from '../paper-template/paper-template.module';
import { AuthModule } from '../auth/auth.module';
import { SmartTestController } from './smart-test.controller';
import { SmartTestService } from './smart-test.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CreateTestPaperModule,
    ChapterMarksDistributionModule,
    ChapterMarksRangeModule,
    PaperTemplateModule,
  ],
  controllers: [SmartTestController],
  providers: [SmartTestService],
  exports: [SmartTestService],
})
export class SmartTestModule {}
