import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { notEqual } from 'assert';
import { IsString, IsNumber, IsOptional, IsNotEmpty, IsDate } from 'class-validator';

export class AddressDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Street cannot be empty' })
  street: string;

  @ApiProperty()
  @IsNumber()
  city_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @ApiProperty()
  @IsDate()
  created_at: Date;

  @ApiProperty()
  @IsDate()
  updated_at: Date;
}

export class CreateAddressDto {
  @ApiProperty({ example: '123 Main Street' })
  @IsString({ message: 'Street must be a string' })
  @IsNotEmpty({ message: 'Street cannot be empty' })
  street: string;

  @ApiProperty({ example: '12345' })
  @IsString({ message: 'Postal code must be a string' })
  @IsNotEmpty({ message: 'Postal code cannot be empty' })
  postal_code: string;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: 'City ID must be a number' })
  @IsNotEmpty({ message: 'City ID is required' })
  city_id: number;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString({ message: 'Street must be a string' })
  @IsNotEmpty({ message: 'Street cannot be empty if provided' })
  street?: string;

  @ApiPropertyOptional({ example: '12345' })
  @IsOptional()
  @IsString({ message: 'Postal code must be a string' })
  @IsNotEmpty({ message: 'Postal code cannot be empty if provided' })
  postal_code?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber({}, { message: 'City ID must be a number' })
  @IsNotEmpty({ message: 'City ID cannot be empty if provided' })
  city_id?: number;
} 