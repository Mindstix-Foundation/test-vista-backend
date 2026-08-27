import { Module } from '@nestjs/common';
import { TopicService } from './topic.service';
import { TopicController } from './topic.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { SyllabusModule } from '../syllabus/syllabus.module';

@Module({
  imports: [PrismaModule, SyllabusModule],
  controllers: [TopicController],
  providers: [TopicService],
  exports: [TopicService],
})
export class TopicModule {} 