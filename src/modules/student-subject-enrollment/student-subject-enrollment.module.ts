import { Module } from '@nestjs/common';
import { StudentSubjectEnrollmentService } from './student-subject-enrollment.service';
import { StudentSubjectEnrollmentController } from './student-subject-enrollment.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentSubjectEnrollmentController],
  providers: [StudentSubjectEnrollmentService],
  exports: [StudentSubjectEnrollmentService]
})
export class StudentSubjectEnrollmentModule {} 