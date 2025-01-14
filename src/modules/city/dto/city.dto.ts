import { ApiProperty } from '@nestjs/swagger';

export class CityDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  state_id: number;
} 