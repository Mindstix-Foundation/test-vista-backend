import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [PrismaModule, AwsModule],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService]
})
export class QuestionModule {} 