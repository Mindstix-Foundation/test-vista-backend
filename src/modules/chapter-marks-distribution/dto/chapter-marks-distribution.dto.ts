import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChapterMarksRequestDto {
  @ApiProperty({ description: 'Pattern ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  patternId: number;

  @ApiProperty({ description: 'Array of chapter IDs', example: [1, 2, 3], type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  chapterIds: number[];

  @ApiProperty({ description: 'Array of medium IDs', example: [1, 2], type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  mediumIds: number[];

  @ApiProperty({ description: 'Array of requested marks for each chapter', example: [10, 15, 20], type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  requestedMarks: number[];
}

export class AllocatedChapterDto {
  @ApiProperty({ description: 'Chapter ID', example: 1 })
  chapterId: number;

  @ApiProperty({ description: 'Chapter name', example: 'Chapter 1' })
  chapterName: string;
}

export class SubsectionAllocationDto {
  @ApiProperty({ description: 'Subsection question type ID', example: 1 })
  subsectionQuestionTypeId: number;

  @ApiProperty({ description: 'Question type name', example: 'MCQ' })
  questionTypeName: string;

  @ApiProperty({ description: 'Allocated chapters', type: [AllocatedChapterDto] })
  allocatedChapters: AllocatedChapterDto[];
}

export class SectionAllocationDto {
  @ApiProperty({ description: 'Section ID', example: 1 })
  sectionId: number;

  @ApiProperty({ description: 'Section name', example: 'Section A' })
  sectionName: string;

  @ApiProperty({ description: 'Total questions in section', example: 5 })
  totalQuestions: number;

  @ApiProperty({ description: 'Absolute marks for section', example: 10 })
  absoluteMarks: number;

  @ApiProperty({ description: 'Total marks for section', example: 10 })
  totalMarks: number;

  @ApiProperty({ description: 'Subsection allocations', type: [SubsectionAllocationDto] })
  subsectionAllocations: SubsectionAllocationDto[];
}

export class ChapterMarksDto {
  @ApiProperty({ description: 'Chapter ID', example: 1 })
  chapterId: number;

  @ApiProperty({ description: 'Chapter name', example: 'Chapter 1' })
  chapterName: string;

  @ApiProperty({ description: 'Absolute marks allocated to chapter', example: 10 })
  absoluteMarks: number;
}

export class ChapterMarksDistributionResponseDto {
  @ApiProperty({ description: 'Pattern ID', example: 1 })
  patternId: number;

  @ApiProperty({ description: 'Pattern name', example: 'Main testing pattern' })
  patternName: string;

  @ApiProperty({ description: 'Total marks in pattern', example: 40 })
  totalMarks: number;

  @ApiProperty({ description: 'Absolute marks in pattern', example: 54 })
  absoluteMarks: number;

  @ApiProperty({ description: 'Section allocations', type: [SectionAllocationDto] })
  sectionAllocations: SectionAllocationDto[];

  @ApiProperty({ description: 'Chapter marks distribution', type: [ChapterMarksDto] })
  chapterMarks: ChapterMarksDto[];
} 