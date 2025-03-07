import { Module } from '@nestjs/common';
import { QuestionTopicService } from './question-topic.service';
import { QuestionTopicController } from './question-topic.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionTopicController],
  providers: [QuestionTopicService],
  exports: [QuestionTopicService]
})
export class QuestionTopicModule {} 