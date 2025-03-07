import { Module } from '@nestjs/common';
import { QuestionTextService } from './question-text.service';
import { QuestionTextController } from './question-text.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionTextController],
  providers: [QuestionTextService],
  exports: [QuestionTextService]
})
export class QuestionTextModule {} 