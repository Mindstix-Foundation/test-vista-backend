import { Module } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { SyllabusModule } from '../syllabus/syllabus.module';

@Module({
  imports: [PrismaModule, SyllabusModule],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {} 