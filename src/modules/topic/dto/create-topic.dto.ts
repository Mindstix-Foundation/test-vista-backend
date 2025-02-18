import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTopicDto {
  @ApiProperty({
    description: 'Chapter ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  chapter_id: number;

  @ApiProperty({
    description: 'Sequential number of the topic',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  sequential_topic_number: number;

  @ApiProperty({
    description: 'Name of the topic',
    example: 'Linear Equations'
  })
  @IsString()
  @IsNotEmpty()
  name: string;
} 