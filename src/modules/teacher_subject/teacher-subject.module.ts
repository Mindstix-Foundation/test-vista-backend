import { Module } from '@nestjs/common';
import { TeacherSubjectService } from './teacher-subject.service';
import { TeacherSubjectController } from './teacher-subject.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherSubjectController],
  providers: [TeacherSubjectService],
  exports: [TeacherSubjectService]
})
export class TeacherSubjectModule {} 