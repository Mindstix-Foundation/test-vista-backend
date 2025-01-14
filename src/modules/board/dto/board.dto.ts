import { ApiProperty } from '@nestjs/swagger';

export class BoardDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  abbreviation?: string;

  @ApiProperty()
  address_id: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class CreateBoardDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  abbreviation?: string;

  @ApiProperty()
  address_id: number;
}

export class UpdateBoardDto {
  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  abbreviation?: string;

  @ApiProperty({ required: false })
  address_id?: number;
} 