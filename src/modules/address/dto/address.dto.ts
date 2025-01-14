import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  country_id: number;

  @ApiProperty()
  state_id: number;

  @ApiProperty()
  city_id: number;

  @ApiProperty()
  postal_code: string;

  @ApiProperty()
  street: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class CreateAddressDto {
  @ApiProperty()
  country_id: number;

  @ApiProperty()
  state_id: number;

  @ApiProperty()
  city_id: number;

  @ApiProperty()
  postal_code: string;

  @ApiProperty()
  street: string;
}

export class UpdateAddressDto {
  @ApiProperty({ required: false })
  country_id?: number;

  @ApiProperty({ required: false })
  state_id?: number;

  @ApiProperty({ required: false })
  city_id?: number;

  @ApiProperty({ required: false })
  postal_code?: string;

  @ApiProperty({ required: false })
  street?: string;
} 