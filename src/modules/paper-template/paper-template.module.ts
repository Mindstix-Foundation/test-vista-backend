import { Module } from '@nestjs/common';
import { PaperTemplateService } from './paper-template.service';
import { PaperTemplateController } from './paper-template.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaperTemplateController],
  providers: [PaperTemplateService],
  exports: [PaperTemplateService],
})
export class PaperTemplateModule {}
