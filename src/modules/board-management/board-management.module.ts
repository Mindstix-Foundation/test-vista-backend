import { Module } from '@nestjs/common';
import { BoardManagementController } from './board-management.controller';
import { BoardManagementService } from './board-management.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BoardModule } from '../board/board.module';
import { AddressModule } from '../address/address.module';
import { InstructionMediumModule } from '../instruction_medium/instruction-medium.module';
import { StandardModule } from '../standard/standard.module';
import { SubjectModule } from '../subject/subject.module';

@Module({
  imports: [
    PrismaModule,
    BoardModule,
    AddressModule,
    InstructionMediumModule,
    StandardModule,
    SubjectModule,
  ],
  controllers: [BoardManagementController],
  providers: [BoardManagementService],
})
export class BoardManagementModule {} 