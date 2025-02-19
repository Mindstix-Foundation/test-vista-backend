import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class ReorderTopicDto {
  @ApiProperty({
    description: 'New sequence number for the topic',
    example: 2
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  sequential_topic_number: number;
} 