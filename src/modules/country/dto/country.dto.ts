import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CountryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  @IsString()
  name: string;
}

export class CreateCountryDto {
  @ApiProperty()
  @IsString()
  name: string;
}

export class UpdateCountryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;
} 