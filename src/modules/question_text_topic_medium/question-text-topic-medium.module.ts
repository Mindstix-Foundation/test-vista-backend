import { Module } from '@nestjs/common';
import { QuestionTextTopicMediumController } from './question-text-topic-medium.controller';
import { QuestionTextTopicMediumService } from './question-text-topic-medium.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionTextTopicMediumController],
  providers: [QuestionTextTopicMediumService],
  exports: [QuestionTextTopicMediumService]
})
export class QuestionTextTopicMediumModule {} 