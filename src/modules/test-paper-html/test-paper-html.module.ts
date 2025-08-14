import { Module } from '@nestjs/common';
import { TestPaperHtmlService } from './test-paper-html.service';
import { TestPaperHtmlController } from './test-paper-html.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [PrismaModule, AwsModule],
  controllers: [TestPaperHtmlController],
  providers: [TestPaperHtmlService],
  exports: [TestPaperHtmlService],
})
export class TestPaperHtmlModule {} 