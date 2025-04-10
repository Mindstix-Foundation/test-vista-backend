import { ApiProperty } from '@nestjs/swagger';

export class CreateTestPaperFilterDto {
  @ApiProperty({ description: 'Pattern ID' })
  patternId: number;

  @ApiProperty({ description: 'Array of chapter IDs', type: [Number] })
  chapterIds: number[];

  @ApiProperty({ description: 'Array of instruction medium IDs', type: [Number] })
  mediumIds: number[];
}

export class ChapterInfoDto {
  @ApiProperty({ description: 'Chapter ID' })
  chapterId: number;

  @ApiProperty({ description: 'Chapter name' })
  chapterName: string;
}

export class SubsectionAllocationDto {
  @ApiProperty({ description: 'Subsection question type ID' })
  subsectionQuestionTypeId: number;

  @ApiProperty({ description: 'Question type name' })
  questionTypeName: string;

  @ApiProperty({ description: 'Array of allocated chapters', type: [ChapterInfoDto] })
  allocatedChapters: ChapterInfoDto[];
}

export class SectionAllocationDto {
  @ApiProperty({ description: 'Section ID' })
  sectionId: number;

  @ApiProperty({ description: 'Section name' })
  sectionName: string;

  @ApiProperty({ description: 'Total questions in the section' })
  totalQuestions: number;

  @ApiProperty({ description: 'Absolute marks for the section' })
  absoluteMarks: number;

  @ApiProperty({ description: 'Total marks for the section' })
  totalMarks: number;

  @ApiProperty({ description: 'Subsection allocations', type: [SubsectionAllocationDto] })
  subsectionAllocations: SubsectionAllocationDto[];
}

export class ChapterMarksDto {
  @ApiProperty({ description: 'Chapter ID' })
  chapterId: number;

  @ApiProperty({ description: 'Chapter name' })
  chapterName: string;

  @ApiProperty({ description: 'Absolute marks allocated to this chapter' })
  absoluteMarks: number;
}

export class CreateTestPaperResponseDto {
  @ApiProperty({ description: 'Pattern ID' })
  patternId: number;

  @ApiProperty({ description: 'Pattern name' })
  patternName: string;

  @ApiProperty({ description: 'Total marks for the pattern' })
  totalMarks: number;

  @ApiProperty({ description: 'Absolute marks for the pattern' })
  absoluteMarks: number;

  @ApiProperty({ description: 'Section allocations', type: [SectionAllocationDto] })
  sectionAllocations: SectionAllocationDto[];

  @ApiProperty({ description: 'Chapter marks', type: [ChapterMarksDto] })
  chapterMarks: ChapterMarksDto[];
} 