import { Module } from '@nestjs/common';
import { MediumStandardSubjectService } from './medium-standard-subject.service';
import { MediumStandardSubjectController } from './medium-standard-subject.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MediumStandardSubjectController],
  providers: [MediumStandardSubjectService],
  exports: [MediumStandardSubjectService]
})
export class MediumStandardSubjectModule {} 