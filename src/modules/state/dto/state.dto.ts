import { ApiProperty } from '@nestjs/swagger';

export class StateDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  country_id: number;
} 