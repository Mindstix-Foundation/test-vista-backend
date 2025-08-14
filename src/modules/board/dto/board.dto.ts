import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDate, IsNotEmpty } from 'class-validator';

export class BoardDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  abbreviation?: string;

  @ApiProperty()
  @IsNumber()
  address_id: number;

  @ApiProperty()
  @IsDate()
  created_at: Date;

  @ApiProperty()
  @IsDate()
  updated_at: Date;
}

export class CreateBoardDto {
  @ApiProperty({ example: 'CBSE Board' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @ApiProperty({ required: false, example: 'CBSE' })
  @IsOptional()
  @IsString({ message: 'Abbreviation must be a string' })
  @IsNotEmpty({ message: 'Abbreviation cannot be empty if provided' })
  abbreviation?: string;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: 'Address ID must be a number' })
  @IsNotEmpty({ message: 'Address ID is required' })
  address_id: number;
}

export class UpdateBoardDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty if provided' })
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Abbreviation must be a string' })
  @IsNotEmpty({ message: 'Abbreviation cannot be empty if provided' })
  abbreviation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Address ID must be a number' })
  @IsNotEmpty({ message: 'Address ID cannot be empty if provided' })
  address_id?: number;
}

export class BoardListDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'CBSE Board' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CBSE' })
  @IsString()
  abbreviation: string;
} 