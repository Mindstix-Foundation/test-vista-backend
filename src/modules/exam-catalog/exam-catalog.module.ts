import { Module } from '@nestjs/common';
import { ExamCatalogService } from './exam-catalog.service';
import { ExamCatalogController } from './exam-catalog.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExamCatalogController],
  providers: [ExamCatalogService],
  exports: [ExamCatalogService],
})
export class ExamCatalogModule {}
