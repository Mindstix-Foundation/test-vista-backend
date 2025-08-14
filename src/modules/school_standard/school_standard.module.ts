import { Module } from '@nestjs/common';
import { SchoolStandardController } from './school_standard.controller';
import { SchoolStandardService } from './school_standard.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SchoolStandardController],
  providers: [SchoolStandardService],
  exports: [SchoolStandardService]
})
export class SchoolStandardModule {}
