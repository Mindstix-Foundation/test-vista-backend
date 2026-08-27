import { Module } from '@nestjs/common';
import { CurriculumPublicController } from './curriculum-public.controller';
import { BoardModule } from '../board/board.module';
import { StandardModule } from '../standard/standard.module';
import { SubjectModule } from '../subject/subject.module';
import { InstructionMediumModule } from '../instruction_medium/instruction-medium.module';

@Module({
  imports: [BoardModule, StandardModule, SubjectModule, InstructionMediumModule],
  controllers: [CurriculumPublicController],
})
export class CurriculumModule {}
