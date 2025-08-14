import { Module } from '@nestjs/common';
import { QuestionTypeService } from './question-type.service';
import { QuestionTypeController } from './question-type.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionTypeController],
  providers: [QuestionTypeService],
  exports: [QuestionTypeService]
})
export class QuestionTypeModule {} 