import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortField {
  NAME = 'name',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export class PaginationDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiProperty({ required: false, default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page size must be an integer' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Max(100)
  page_size?: number = 15;

  @ApiProperty({ required: false, enum: SortField, default: SortField.NAME })
  @IsOptional()
  @IsEnum(SortField, { message: 'Sort field must be one of: name, created_at, updated_at' })
  sort_by?: SortField = SortField.NAME;

  @ApiProperty({ required: false, enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order must be one of: asc, desc' })
  sort_order?: SortOrder = SortOrder.ASC;

  @ApiProperty({ required: false, description: 'Search term to filter results' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
} 