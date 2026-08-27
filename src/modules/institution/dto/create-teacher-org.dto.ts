import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  Matches,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InstitutionTypeDto, InstitutionVisibilityDto } from './institution.dto';

export class CreateOrgAddressDto {
  @ApiProperty({ example: '123 Main Road' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: '411001' })
  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  city_id: number;
}

/**
 * Teacher self-serve create School or Coaching Center (P3).
 * Creates School + Institution + ADMIN membership in one transaction.
 * Coaching centers also get a linked School (S1=A) for standards / Teacher_Subject.
 */
export class CreateTeacherOrgDto {
  @ApiProperty({
    enum: [InstitutionTypeDto.SCHOOL, InstitutionTypeDto.COACHING_CENTER],
    example: InstitutionTypeDto.SCHOOL,
  })
  @IsEnum(InstitutionTypeDto)
  institution_type: InstitutionTypeDto.SCHOOL | InstitutionTypeDto.COACHING_CENTER;

  @ApiProperty({ example: 'Sunrise High School' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  board_id: number;

  @ApiProperty({ type: [Number], example: [1, 2] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  standard_ids: number[];

  @ApiProperty({ type: [Number], example: [1] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  instruction_medium_ids: number[];

  @ApiProperty({ type: CreateOrgAddressDto })
  @ValidateNested()
  @Type(() => CreateOrgAddressDto)
  address: CreateOrgAddressDto;

  @ApiPropertyOptional({ example: 'Ramesh Patil' })
  @IsOptional()
  @IsString()
  principal_name?: string;

  @ApiPropertyOptional({ example: 'school@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Contact number must be 10 digits' })
  contact_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alternate_contact_number?: string;

  @ApiPropertyOptional({
    enum: InstitutionVisibilityDto,
    default: InstitutionVisibilityDto.PRIVATE,
  })
  @IsOptional()
  @IsEnum(InstitutionVisibilityDto)
  visibility?: InstitutionVisibilityDto;
}
