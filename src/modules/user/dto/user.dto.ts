import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, IsEmail, IsBoolean, IsPhoneNumber, Matches, Length } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password.validator';

export class UserDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email_id: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  contact_number: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  alternate_contact_number?: string;

  @ApiPropertyOptional({ example: 'M.Tech' })
  @IsOptional()
  @IsString()
  highest_qualification?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  status: boolean;
}

export class CreateUserDto {
  @ApiProperty({ 
    example: 'Password123!',
    description: 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character'
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email_id: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString({ message: 'Contact number must be a string' })
  @IsNotEmpty({ message: 'Contact number is required' })
  @Matches(/^\d{10}$/, { message: 'Contact number must be exactly 10 digits' })
  contact_number: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString({ message: 'Alternate contact number must be a string' })
  @Matches(/^\d{10}$/, { message: 'Alternate contact number must be exactly 10 digits' })
  alternate_contact_number?: string;

  @ApiPropertyOptional({ example: 'M.Tech' })
  @IsOptional()
  @IsString({ message: 'Qualification must be a string' })
  @Length(2, 50, { message: 'Qualification must be between 2 and 50 characters' })
  highest_qualification?: string;

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'Status must be a boolean' })
  status: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ 
    example: 'NewPassword123!',
    description: 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character'
  })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty if provided' })
  @IsStrongPassword()
  password?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email_id?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString({ message: 'Contact number must be a string' })
  @Matches(/^\d{10}$/, { message: 'Contact number must be exactly 10 digits' })
  contact_number?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString({ message: 'Alternate contact number must be a string' })
  @Matches(/^\d{10}$/, { message: 'Alternate contact number must be exactly 10 digits' })
  alternate_contact_number?: string;

  @ApiPropertyOptional({ example: 'M.Tech' })
  @IsOptional()
  @IsString({ message: 'Qualification must be a string' })
  @Length(2, 50, { message: 'Qualification must be between 2 and 50 characters' })
  highest_qualification?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
} 