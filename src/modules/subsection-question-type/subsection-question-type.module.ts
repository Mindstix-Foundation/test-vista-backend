import { Module } from '@nestjs/common';
import { SubsectionQuestionTypeService } from './subsection-question-type.service';
import { SubsectionQuestionTypeController } from './subsection-question-type.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubsectionQuestionTypeController],
  providers: [SubsectionQuestionTypeService],
  exports: [SubsectionQuestionTypeService]
})
export class SubsectionQuestionTypeModule {} 