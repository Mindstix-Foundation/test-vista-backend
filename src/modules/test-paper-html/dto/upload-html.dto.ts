import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadHtmlDto {
  @ApiProperty({
    description: 'HTML content of the test paper',
    example: '<html><body><h1>Test Paper</h1>...</body></html>',
  })
  @IsString()
  htmlContent: string;

  @ApiProperty({
    description: 'Filename for the HTML content',
    example: 'test-paper-1.html',
    required: false,
  })
  @IsString()
  @IsOptional()
  filename?: string;
} 