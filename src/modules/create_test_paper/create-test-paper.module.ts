import { Module } from '@nestjs/common';
import { CreateTestPaperController } from './create-test-paper.controller';
import { CreateTestPaperService } from './create-test-paper.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CreateTestPaperController],
  providers: [CreateTestPaperService],
  exports: [CreateTestPaperService],
})
export class CreateTestPaperModule {} 