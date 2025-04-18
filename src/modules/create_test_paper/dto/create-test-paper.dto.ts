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

  @ApiProperty({ description: 'Question object', required: false })
  question?: any;
}

export class SubsectionAllocationDto {
  @ApiProperty({ description: 'Subsection question type ID' })
  subsectionQuestionTypeId: number;

  @ApiProperty({ description: 'Section ID' })
  section_id: number;

  @ApiProperty({ description: 'Question type name' })
  questionTypeName: string;

  @ApiProperty({ description: 'Sequential number' })
  sequentialNumber: number;

  @ApiProperty({ description: 'Question type ID' })
  question_type_id: number;

  @ApiProperty({ description: 'Question type object' })
  question_type: {
    id: number;
    type_name: string;
  };

  @ApiProperty({ description: 'Array of allocated chapters', type: [ChapterInfoDto] })
  allocatedChapters: ChapterInfoDto[];
}

export class SectionAllocationDto {
  @ApiProperty({ description: 'Section ID' })
  sectionId: number;

  @ApiProperty({ description: 'Pattern ID' })
  pattern_id: number;

  @ApiProperty({ description: 'Section name' })
  sectionName: string;

  @ApiProperty({ description: 'Sequential number' })
  sequentialNumber: number;

  @ApiProperty({ description: 'Section number' })
  section_number: number;

  @ApiProperty({ description: 'Sub section' })
  subSection: string;

  @ApiProperty({ description: 'Total questions in the section' })
  totalQuestions: number;

  @ApiProperty({ description: 'Mandatory questions in the section' })
  mandotory_questions: number;

  @ApiProperty({ description: 'Marks per question' })
  marks_per_question: number;

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