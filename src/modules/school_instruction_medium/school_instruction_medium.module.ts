import { Module } from '@nestjs/common';
import { SchoolInstructionMediumService } from './school_instruction_medium.service';
import { SchoolInstructionMediumController } from './school_instruction_medium.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SchoolInstructionMediumController],
  providers: [SchoolInstructionMediumService],
  exports: [SchoolInstructionMediumService]
})
export class SchoolInstructionMediumModule {}
