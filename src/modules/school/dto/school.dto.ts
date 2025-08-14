import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, IsEmail, IsPhoneNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SchoolDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'Delhi Public School' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  board_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  address_id: number;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  principal_name: string;

  @ApiProperty({ example: 'school@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 1234567890 })
  @IsNumber()
  contact_number: number;

  @ApiPropertyOptional({ example: 9876543210 })
  @IsOptional()
  @IsNumber()
  alternate_contact_number?: number;
}

export class CreateSchoolDto {
  @ApiProperty({ example: 'Delhi Public School' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  board_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  address_id: number;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  principal_name: string;

  @ApiProperty({ example: 'school@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+911234567890', description: 'Contact number with country code' })
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Contact number is required' })
  contact_number: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Alternate contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
  alternate_contact_number?: string;
}

export class UpdateSchoolDto {
  @ApiPropertyOptional({ example: 'Delhi Public School' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  board_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  address_id?: number;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  principal_name?: string;

  @ApiPropertyOptional({ example: 'school@example.com' })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({ example: '+911234567890', description: 'Contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Contact number cannot be empty if provided' })
  contact_number?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Alternate contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
  alternate_contact_number?: string;
}

export class SchoolListDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'Delhi Public School' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Central Board of Secondary Education' })
  @IsString()
  board_name: string;

  @ApiProperty({ example: 'CBSE' })
  @IsString()
  board_abbreviation: string;
}

export class AddressDto {
  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  city_id: number;
}

export class UpsertSchoolDto {
  @ApiPropertyOptional({ example: 1, description: 'School ID for update operation. If not provided, creates new school' })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ example: 'Delhi Public School' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  board_id: number;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  principal_name: string;

  @ApiProperty({ example: 'school@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+911234567890', description: 'Contact number with country code' })
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Contact number is required' })
  contact_number: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Alternate contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
  alternate_contact_number?: string;

  @ApiProperty({ example: [1, 2, 3], description: 'Array of instruction medium IDs' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  instruction_medium_ids: number[];

  @ApiProperty({ example: [1, 2, 3], description: 'Array of standard IDs' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  standard_ids: number[];
}

export class PartialUpsertSchoolDto {
  @ApiProperty({ example: 1, description: 'School ID for update operation. Required for partial updates' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiPropertyOptional({ example: 'Delhi Public School' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  board_id?: number;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  principal_name?: string;

  @ApiPropertyOptional({ example: 'school@example.com' })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({ example: '+911234567890', description: 'Contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Contact number cannot be empty if provided' })
  contact_number?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Alternate contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
  alternate_contact_number?: string;

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'Array of instruction medium IDs' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  instruction_medium_ids?: number[];

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'Array of standard IDs' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  standard_ids?: number[];
} 