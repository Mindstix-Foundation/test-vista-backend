import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImageDto {
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL of the image'
  })
  @IsString()
  @IsNotEmpty()
  image_url: string;
} 