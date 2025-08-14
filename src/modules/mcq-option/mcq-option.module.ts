import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { McqOptionController } from './mcq-option.controller';
import { McqOptionService } from './mcq-option.service';

@Module({
  imports: [PrismaModule],
  controllers: [McqOptionController],
  providers: [McqOptionService],
  exports: [McqOptionService],
})
export class McqOptionModule {} 