import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

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
  @Expose()
  chapterId: number;

  @ApiProperty({ description: 'Chapter name', example: 'Chapter 1' })
  @Expose()
  chapterName: string;

  @ApiProperty({ description: 'Question data', required: false })
  @Expose()
  @Type(() => Object)
  question?: any;
}

export class SubsectionAllocationDto {
  @ApiProperty({ description: 'Subsection question type ID', example: 1 })
  @Expose()
  subsectionQuestionTypeId: number;

  @ApiProperty({ description: 'Question type name', example: 'MCQ' })
  @Expose()
  questionTypeName: string;

  @ApiProperty({ description: 'Sequential number of the subsection', example: 1 })
  @Expose()
  sequentialNumber: number;

  @ApiProperty({ description: 'Allocated chapters', type: [AllocatedChapterDto] })
  @Expose()
  @Type(() => AllocatedChapterDto)
  allocatedChapters: AllocatedChapterDto[];
}

export class SectionAllocationDto {
  @ApiProperty({ description: 'Section ID', example: 1 })
  @Expose()
  sectionId: number;

  @ApiProperty({ description: 'Section name', example: 'Section A' })
  @Expose()
  sectionName: string;

  @ApiProperty({ description: 'Sequential number of the section', example: 1 })
  @Expose()
  sequentialNumber: number;

  @ApiProperty({ description: 'Sub section identifier', example: 'A' })
  @Expose()
  subSection: string;

  @ApiProperty({ description: 'Total questions in section', example: 5 })
  @Expose()
  totalQuestions: number;

  @ApiProperty({ description: 'Absolute marks for section', example: 10 })
  @Expose()
  absoluteMarks: number;

  @ApiProperty({ description: 'Total marks for section', example: 10 })
  @Expose()
  totalMarks: number;

  @ApiProperty({ description: 'Subsection allocations', type: [SubsectionAllocationDto] })
  @Expose()
  @Type(() => SubsectionAllocationDto)
  subsectionAllocations: SubsectionAllocationDto[];
}

export class ChapterMarksDto {
  @ApiProperty({ description: 'Chapter ID', example: 1 })
  @Expose()
  chapterId: number;

  @ApiProperty({ description: 'Chapter name', example: 'Chapter 1' })
  @Expose()
  chapterName: string;

  @ApiProperty({ description: 'Absolute marks allocated to chapter', example: 10 })
  @Expose()
  absoluteMarks: number;
}

export class ChapterMarksDistributionResponseDto {
  @ApiProperty({ description: 'Pattern ID', example: 1 })
  @Expose()
  patternId: number;

  @ApiProperty({ description: 'Pattern name', example: 'Main testing pattern' })
  @Expose()
  patternName: string;

  @ApiProperty({ description: 'Total marks in pattern', example: 40 })
  @Expose()
  totalMarks: number;

  @ApiProperty({ description: 'Absolute marks in pattern', example: 54 })
  @Expose()
  absoluteMarks: number;

  @ApiProperty({ description: 'Section allocations', type: [SectionAllocationDto] })
  @Expose()
  @Type(() => SectionAllocationDto)
  sectionAllocations: SectionAllocationDto[];

  @ApiProperty({ description: 'Chapter marks distribution', type: [ChapterMarksDto] })
  @Expose()
  @Type(() => ChapterMarksDto)
  chapterMarks: ChapterMarksDto[];
}

// DTOs for Final Questions Distribution with Request Body

export class FinalQuestionsChapterDto {
  @ApiProperty({ description: 'Chapter ID', example: 1 })
  @IsNumber()
  @Expose()
  chapterId: number;

  @ApiProperty({ description: 'Chapter name', example: 'Addition' })
  @Expose()
  chapterName: string;

  @ApiProperty({ description: 'Question data', required: false })
  @Expose()
  @Type(() => Object)
  question?: any;
}

export class FinalQuestionsSubsectionDto {
  @ApiProperty({ description: 'Subsection question type ID', example: 16 })
  @IsNumber()
  @Expose()
  subsectionQuestionTypeId: number;

  @ApiProperty({ description: 'Question type name', example: 'Fill in the Blanks' })
  @Expose()
  questionTypeName: string;
  
  @ApiProperty({ description: 'Sequential number of the subsection', example: 1 })
  @IsNumber()
  @Expose()
  sequentialNumber: number;

  @ApiProperty({ description: 'Allocated chapters', type: [FinalQuestionsChapterDto] })
  @IsArray()
  @Expose()
  @Type(() => FinalQuestionsChapterDto)
  allocatedChapters: FinalQuestionsChapterDto[];
}

export class FinalQuestionsSectionDto {
  @ApiProperty({ description: 'Section ID', example: 8 })
  @IsNumber()
  @Expose()
  sectionId: number;

  @ApiProperty({ description: 'Section name', example: 'Fill in the blanks' })
  @Expose()
  sectionName: string;

  @ApiProperty({ description: 'Sequential number of the section', example: 1 })
  @IsNumber()
  @Expose()
  sequentialNumber: number;

  @ApiProperty({ description: 'Sub section identifier', example: 'A' })
  @IsString()
  @Expose()
  subSection: string;

  @ApiProperty({ description: 'Total questions in section', example: 7 })
  @IsNumber()
  @Expose()
  totalQuestions: number;

  @ApiProperty({ description: 'Absolute marks for section', example: 7 })
  @IsNumber()
  @Expose()
  absoluteMarks: number;

  @ApiProperty({ description: 'Total marks for section', example: 7 })
  @IsNumber()
  @Expose()
  totalMarks: number;

  @ApiProperty({ description: 'Subsection allocations', type: [FinalQuestionsSubsectionDto] })
  @IsArray()
  @Expose()
  @Type(() => FinalQuestionsSubsectionDto)
  subsectionAllocations: FinalQuestionsSubsectionDto[];
}

export class FinalQuestionsChapterMarksDto {
  @ApiProperty({ description: 'Chapter ID', example: 1 })
  @IsNumber()
  @Expose()
  chapterId: number;

  @ApiProperty({ description: 'Chapter name', example: 'Addition' })
  @Expose()
  chapterName: string;

  @ApiProperty({ description: 'Absolute marks allocated to chapter', example: 8 })
  @IsNumber()
  @Expose()
  absoluteMarks: number;
}

export class FinalQuestionsDistributionBodyDto {
  @ApiProperty({ description: 'Pattern ID', example: 6 })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  patternId: number;

  @ApiProperty({ description: 'Pattern name', example: 'Main testing pattern' })
  @Expose()
  patternName: string;

  @ApiProperty({ description: 'Total marks in pattern', example: 54 })
  @IsNumber()
  @Expose()
  totalMarks: number;

  @ApiProperty({ description: 'Absolute marks in pattern', example: 54 })
  @IsNumber()
  @Expose()
  absoluteMarks: number;

  @ApiProperty({ description: 'Section allocations', type: [FinalQuestionsSectionDto] })
  @IsArray()
  @Expose()
  @Type(() => FinalQuestionsSectionDto)
  sectionAllocations: FinalQuestionsSectionDto[];

  @ApiProperty({ description: 'Chapter marks distribution', type: [FinalQuestionsChapterMarksDto] })
  @IsArray()
  @Expose()
  @Type(() => FinalQuestionsChapterMarksDto)
  chapterMarks: FinalQuestionsChapterMarksDto[];

  @ApiProperty({ 
    description: 'Optional medium IDs to filter questions by', 
    example: [1, 2], 
    type: [Number],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  mediumIds?: number[];
} 