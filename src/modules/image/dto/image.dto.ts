import { IsString, IsNotEmpty, IsInt, IsPositive, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImageDto {
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL of the image'
  })
  @IsString()
  @IsNotEmpty()
  image_url: string;

  @ApiProperty({
    example: 'original-image.jpg',
    description: 'Original filename of the uploaded image'
  })
  @IsString()
  @IsNotEmpty()
  original_filename: string;

  @ApiProperty({
    example: 102400,
    description: 'Size of the image in bytes'
  })
  @IsInt()
  @IsPositive()
  file_size: number;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type of the image'
  })
  @IsString()
  @IsNotEmpty()
  file_type: string;

  @ApiProperty({
    example: 800,
    description: 'Width of the image in pixels'
  })
  @IsInt()
  @IsPositive()
  width: number;

  @ApiProperty({
    example: 600,
    description: 'Height of the image in pixels'
  })
  @IsInt()
  @IsPositive()
  height: number;
}

export class ImageUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file to upload'
  })
  file: any;
} 