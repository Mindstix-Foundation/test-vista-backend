import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, IsEmail, IsBoolean, IsPhoneNumber, Length } from 'class-validator';
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

  @ApiProperty({ example: '+911234567890', description: 'Contact number with country code' })
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Contact number is required' })
  contact_number: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Alternate contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
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

  @ApiPropertyOptional({ example: '+911234567890', description: 'Contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Contact number cannot be empty if provided' })
  contact_number?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Alternate contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
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

export class UserListDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: ['Delhi Public School'] })
  @IsString({ each: true })
  schools: string[];

  @ApiProperty({ example: ['ADMIN', 'TEACHER'] })
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  status: boolean;
}