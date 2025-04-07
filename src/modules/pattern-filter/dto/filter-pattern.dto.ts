import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

enum QuestionOrigin {
  BOARD = 'board',
  OTHER = 'other',
  BOTH = 'both'
}

export class FilterPatternDto {
  @ApiProperty({ description: 'Instruction medium ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'mediumId must be a number' })
  mediumId?: number;

  @ApiProperty({ description: 'Standard ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'standardId must be a number' })
  standardId?: number;

  @ApiProperty({ description: 'Subject ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'subjectId must be a number' })
  subjectId?: number;

  @ApiProperty({ description: 'Array of chapter IDs', required: true, type: [Number] })
  @IsNotEmpty()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(id => parseInt(id.trim(), 10));
    }
    return value;
  })
  @Type(() => Number)
  @IsNumber({}, { each: true, message: 'Each chapterIds must be a number' })
  chapterIds: number[];

  @ApiProperty({ description: 'Question origin type (board, other, both)', required: false, enum: QuestionOrigin, default: QuestionOrigin.BOTH })
  @IsOptional()
  @IsEnum(QuestionOrigin, { message: 'questionOrigin must be one of: board, other, both' })
  questionOrigin?: QuestionOrigin = QuestionOrigin.BOTH;

  @ApiProperty({ description: 'Total marks filter', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'marks must be an integer' })
  marks?: number;
} 