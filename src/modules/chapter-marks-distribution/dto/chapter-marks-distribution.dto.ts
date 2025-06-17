import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export type QuestionOriginType = 'board' | 'other' | 'both';

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

  @ApiProperty({ 
    description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)',
    enum: ['board', 'other', 'both'],
    default: 'both'
  })
  @IsOptional()
  questionOrigin?: QuestionOriginType;
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
  @ApiProperty({ description: 'Subsection question type ID', example: 16 })
  @Expose()
  subsectionQuestionTypeId: number;

  @ApiProperty({ description: 'Section ID', example: 8 })
  @Expose()
  section_id: number;

  @ApiProperty({ description: 'Question type name', example: 'Fill in the Blanks' })
  @Expose()
  questionTypeName: string;

  @ApiProperty({ description: 'Sequential number of the subsection', example: 1 })
  @Expose()
  sequentialNumber: number;

  @ApiProperty({ description: 'Question type ID', example: 6 })
  @Expose()
  question_type_id: number;

  @ApiProperty({
    description: 'Question type details',
    example: { id: 6, type_name: 'Fill in the Blanks' }
  })
  @Expose()
  question_type: {
    id: number;
    type_name: string;
  };

  @ApiProperty({ description: 'Allocated chapters', type: [AllocatedChapterDto] })
  @Expose()
  @Type(() => AllocatedChapterDto)
  allocatedChapters: AllocatedChapterDto[];
}

export class SectionAllocationDto {
  @ApiProperty({ description: 'Section ID', example: 8 })
  @Expose()
  sectionId: number;

  @ApiProperty({ description: 'Pattern ID', example: 6 })
  @Expose()
  pattern_id: number;

  @ApiProperty({ description: 'Section name', example: 'Fill in the blanks' })
  @Expose()
  sectionName: string;

  @ApiProperty({ description: 'Sequential number of the section', example: 1 })
  @Expose()
  sequentialNumber: number;

  @ApiProperty({ description: 'Section number', example: 1 })
  @Expose()
  section_number: number;

  @ApiProperty({ description: 'Sub section identifier', example: 'A', required: false })
  @IsOptional()
  @Expose()
  subSection?: string;

  @ApiProperty({ description: 'Total questions in section', example: 7 })
  @Expose()
  totalQuestions: number;

  @ApiProperty({ description: 'Mandatory questions count', example: 5 })
  @Expose()
  mandotory_questions: number;

  @ApiProperty({ description: 'Marks per question', example: 1 })
  @Expose()
  marks_per_question: number;

  @ApiProperty({ description: 'Absolute marks for section', example: 7 })
  @Expose()
  absoluteMarks: number;

  @ApiProperty({ description: 'Total marks for section', example: 7 })
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

  @ApiProperty({ description: 'Marks originally requested for the chapter', example: 12 })
  @Expose()
  requestedMarks: number;
}

export class SectionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  pattern_id: number;

  @ApiProperty()
  sequence_number: number;

  @ApiProperty()
  section_number: number;

  @ApiProperty({ required: false })
  @IsOptional()
  sub_section?: string;

  @ApiProperty()
  section_name: string;

  @ApiProperty()
  total_questions: number;

  @ApiProperty()
  mandotory_questions: number;

  @ApiProperty()
  marks_per_question: number;

  @ApiProperty({ type: 'array', isArray: true })
  subsection_question_types: SubsectionQuestionTypeDto[];
}

export class SubsectionQuestionTypeDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  section_id: number;

  @ApiProperty()
  seqencial_subquestion_number: number;

  @ApiProperty()
  question_type_id: number;

  @ApiProperty()
  question_type: {
    id: number;
    type_name: string;
  };
}

export class MediumResponseDto {
  @ApiProperty({ description: 'Medium ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Medium name', example: 'English' })
  @Expose()
  instruction_medium: string;
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

  @ApiProperty({ description: 'Question origin (board, other, or both)', example: 'board', required: false })
  @Expose()
  @IsOptional()
  questionOrigin?: QuestionOriginType;

  @ApiProperty({ description: 'Instruction mediums used', type: [MediumResponseDto] })
  @Expose()
  @Type(() => MediumResponseDto)
  mediums: MediumResponseDto[];

  @ApiProperty({ description: 'Section allocations', type: [SectionAllocationDto] })
  @Expose()
  @Type(() => SectionAllocationDto)
  sectionAllocations: SectionAllocationDto[];

  @ApiProperty({ description: 'Chapter marks distribution', type: [ChapterMarksDto] })
  @Expose()
  @Type(() => ChapterMarksDto)
  chapterMarks: ChapterMarksDto[];

  @ApiProperty({ 
    description: 'Indicates if there were insufficient questions to allocate marks as requested', 
    example: false,
    required: false 
  })
  @Expose()
  @IsOptional()
  insufficientQuestions?: boolean;

  @ApiProperty({ 
    description: 'Message describing any issues with question allocation', 
    example: 'Some marks could not be allocated due to insufficient questions',
    required: false 
  })
  @Expose()
  @IsOptional()
  allocationMessage?: string;
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

  @ApiProperty({ description: 'Section ID', example: 8 })
  @IsNumber()
  @Expose()
  section_id: number;

  @ApiProperty({ description: 'Question type name', example: 'Fill in the Blanks' })
  @Expose()
  questionTypeName: string;
  
  @ApiProperty({ description: 'Sequential number of the subsection', example: 1 })
  @IsNumber()
  @Expose()
  sequentialNumber: number;

  @ApiProperty({ description: 'Question type ID', example: 6 })
  @IsNumber()
  @Expose()
  question_type_id: number;

  @ApiProperty({ 
    description: 'Question type details',
    example: { id: 6, type_name: 'Fill in the Blanks' }
  })
  @Expose()
  question_type: {
    id: number;
    type_name: string;
  };

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

  @ApiProperty({ description: 'Pattern ID', example: 6 })
  @IsNumber()
  @Expose()
  pattern_id: number;

  @ApiProperty({ description: 'Section name', example: 'Fill in the blanks' })
  @Expose()
  sectionName: string;

  @ApiProperty({ description: 'Sequential number of the section', example: 1 })
  @IsNumber()
  @Expose()
  sequentialNumber: number;

  @ApiProperty({ description: 'Section number', example: 1 })
  @IsNumber()
  @Expose()
  section_number: number;

  @ApiProperty({ description: 'Sub section identifier', example: 'A', required: false })
  @IsString()
  @IsOptional()
  @Expose()
  subSection?: string;

  @ApiProperty({ description: 'Total questions in section', example: 7 })
  @IsNumber()
  @Expose()
  totalQuestions: number;

  @ApiProperty({ description: 'Mandatory questions count', example: 5 })
  @IsNumber()
  @Expose()
  mandotory_questions: number;

  @ApiProperty({ description: 'Marks per question', example: 1 })
  @IsNumber()
  @Expose()
  marks_per_question: number;

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

  @ApiProperty({ 
    description: 'Medium IDs to filter questions by', 
    example: [1, 2], 
    type: [Number],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  mediumIds?: number[];

  @ApiProperty({ 
    description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)',
    enum: ['board', 'other', 'both'],
    default: 'both',
    required: false
  })
  @IsOptional()
  @Expose()
  questionOrigin?: QuestionOriginType;

  @ApiProperty({ 
    description: 'Medium information', 
    type: [MediumResponseDto],
    required: false
  })
  @IsOptional()
  @Expose()
  @Type(() => MediumResponseDto)
  mediums?: MediumResponseDto[];

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
}

export class ChangeQuestionRequestDto {
  @ApiProperty({ 
    description: 'IDs of the question texts to be changed', 
    example: [123, 456], 
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  questionTextIds: number[];

  @ApiProperty({ 
    description: 'Medium IDs to get questions in specific languages', 
    example: [1, 2], 
    type: [Number] 
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  mediumIds: number[];

  @ApiProperty({ 
    description: 'Chapter ID to find replacement questions from', 
    example: 5
  })
  @IsNumber()
  @Expose()
  chapterId: number;
  
  @ApiProperty({ 
    description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)',
    enum: ['board', 'other', 'both'],
    default: 'both',
    required: false
  })
  @IsOptional()
  @Expose()
  questionOrigin?: QuestionOriginType;
}

export class ChangeQuestionResponseDto {
  @ApiProperty({ description: 'The replacement question data' })
  @Expose()
  question: any;

  @ApiProperty({ description: 'Question type details' })
  @Expose()
  questionType: {
    id: number;
    type_name: string;
  };

  @ApiProperty({ description: 'Chapter details' })
  @Expose()
  chapter: {
    id: number;
    name: string;
  };

  @ApiProperty({ description: 'Medium details' })
  @Expose()
  medium: {
    id: number;
    instruction_medium: string;
  };
} 