import { Module } from '@nestjs/common';
import { InstructionMediumService } from './instruction-medium.service';
import { InstructionMediumController } from './instruction-medium.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstructionMediumController],
  providers: [InstructionMediumService],
  exports: [InstructionMediumService],
})
export class InstructionMediumModule {} 