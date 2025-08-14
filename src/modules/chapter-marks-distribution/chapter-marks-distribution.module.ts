import { Module } from '@nestjs/common';
import { ChapterMarksDistributionService } from './chapter-marks-distribution.service';
import { ChapterMarksDistributionController } from './chapter-marks-distribution.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [PrismaModule, AwsModule],
  controllers: [ChapterMarksDistributionController],
  providers: [ChapterMarksDistributionService],
  exports: [ChapterMarksDistributionService]
})
export class ChapterMarksDistributionModule {} 