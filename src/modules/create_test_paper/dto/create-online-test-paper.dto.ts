import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, IsNumber, Min, Max, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// DTO for question data structure - now includes chapter info per question
export class OnlineTestQuestionDto {
  @ApiProperty({
    description: 'Question ID',
    example: 1
  })
  @IsInt()
  question_id: number;

  @ApiProperty({
    description: 'Question Text ID',
    example: 1
  })
  @IsInt()
  question_text_id: number;

  @ApiProperty({
    description: 'Chapter ID for this question',
    example: 1
  })
  @IsInt()
  chapter_id: number;

  @ApiProperty({
    description: 'Marks for this question',
    example: 1
  })
  @IsNumber()
  marks: number;

  @ApiProperty({
    description: 'Question sequence/order in the test',
    example: 1
  })
  @IsInt()
  question_order: number;
}

// Simplified subsection structure - questions directly under subsection
export class OnlineTestSubsectionDto {
  @ApiProperty({
    description: 'Subsection Question Type ID',
    example: 1
  })
  @IsInt()
  subsection_question_type_id: number;

  @ApiProperty({
    description: 'Questions in proper sequence order',
    type: [OnlineTestQuestionDto],
    example: [
      {
        "question_id": 101,
        "question_text_id": 201,
        "chapter_id": 1,
        "marks": 1,
        "question_order": 1
      },
      {
        "question_id": 102,
        "question_text_id": 202,
        "chapter_id": 3,
        "marks": 1,
        "question_order": 2
      },
      {
        "question_id": 103,
        "question_text_id": 203,
        "chapter_id": 4,
        "marks": 1,
        "question_order": 3
      },
      {
        "question_id": 104,
        "question_text_id": 204,
        "chapter_id": 1,
        "marks": 1,
        "question_order": 4
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnlineTestQuestionDto)
  questions: OnlineTestQuestionDto[];
}

export class OnlineTestSectionDto {
  @ApiProperty({
    description: 'Section ID',
    example: 1
  })
  @IsInt()
  section_id: number;

  @ApiProperty({
    description: 'Subsections with questions in sequence',
    type: [OnlineTestSubsectionDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnlineTestSubsectionDto)
  subsections: OnlineTestSubsectionDto[];
}

export class CreateOnlineTestPaperDto {
  @ApiProperty({
    description: 'Name of the test paper',
    example: 'Mathematics Test - 25/06/2024'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Pattern ID for the test paper',
    example: 1
  })
  @IsInt()
  @Type(() => Number)
  pattern_id: number;

  @ApiProperty({
    description: 'Duration of the test in minutes',
    example: 60,
    minimum: 1,
    maximum: 300
  })
  @IsInt()
  @Min(1)
  @Max(300)
  @Type(() => Number)
  duration_minutes: number;

  @ApiProperty({
    description: 'Instructions for the test',
    example: 'Read all questions carefully before answering.',
    required: false
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({
    description: 'Enable negative marking',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  negative_marking?: boolean = false;

  @ApiProperty({
    description: 'Negative marks per wrong answer',
    example: 0.25,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  negative_marks_per_question?: number;

  @ApiProperty({
    description: 'Randomize question order',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  randomize_questions?: boolean = false;

  @ApiProperty({
    description: 'Randomize MCQ options',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  randomize_options?: boolean = false;

  // Additional context fields from the frontend
  @ApiProperty({
    description: 'Board ID',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  board_id?: number;

  @ApiProperty({
    description: 'Medium IDs (comma-separated or array)',
    example: '1,2',
    required: false
  })
  @IsOptional()
  medium_ids?: string | number[];

  @ApiProperty({
    description: 'Standard ID',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  standard_id?: number;

  @ApiProperty({
    description: 'Subject ID',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subject_id?: number;

  @ApiProperty({
    description: 'Chapters (comma-separated or array)',
    example: '1,2,3',
    required: false
  })
  @IsOptional()
  chapters?: string | number[];

  @ApiProperty({
    description: 'Question source - determines the origin of questions used in the test',
    example: 'both',
    enum: ['board', 'other', 'both'],
    required: false
  })
  @IsOptional()
  @IsString()
  @IsIn(['board', 'other', 'both'])
  question_source?: string;

  @ApiProperty({
    description: 'Finalized questions data with proper sequence order',
    type: [OnlineTestSectionDto],
    required: false,
    example: [
      {
        "section_id": 1,
        "subsections": [
          {
            "subsection_question_type_id": 1,
            "questions": [
              {
                "question_id": 101,
                "question_text_id": 201,
                "chapter_id": 1,
                "marks": 1,
                "question_order": 1
              },
              {
                "question_id": 102,
                "question_text_id": 202,
                "chapter_id": 3,
                "marks": 1,
                "question_order": 2
              },
              {
                "question_id": 103,
                "question_text_id": 203,
                "chapter_id": 4,
                "marks": 1,
                "question_order": 3
              },
              {
                "question_id": 104,
                "question_text_id": 204,
                "chapter_id": 1,
                "marks": 1,
                "question_order": 4
              }
            ]
          }
        ]
      }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnlineTestSectionDto)
  questions_data?: OnlineTestSectionDto[];
} 