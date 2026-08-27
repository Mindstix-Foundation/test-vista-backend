import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { ChapterController } from './chapter.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { SyllabusModule } from '../syllabus/syllabus.module';

@Module({
  imports: [PrismaModule, SyllabusModule],
  controllers: [ChapterController],
  providers: [ChapterService],
  exports: [ChapterService],
})
export class ChapterModule {} 