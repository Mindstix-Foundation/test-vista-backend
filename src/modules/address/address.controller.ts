import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressDto, CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('addresses')
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @ApiOperation({ summary: 'Create address' })
  @ApiResponse({ 
    status: 201, 
    description: 'The address has been successfully created.',
    type: AddressDto
  })
  create(@Body() createAddressDto: CreateAddressDto): Promise<AddressDto> {
    return this.addressService.create(createAddressDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an address by id' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns an address by id',
    type: AddressDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Address not found'
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AddressDto> {
    return this.addressService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an address' })
  @ApiResponse({ 
    status: 200, 
    description: 'The address has been successfully updated.',
    type: AddressDto
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<AddressDto> {
    return this.addressService.update(id, updateAddressDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ 
    status: 204, 
    description: 'The address has been successfully deleted.'
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.addressService.remove(id);
  }
}
