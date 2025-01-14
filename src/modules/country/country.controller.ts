import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CountryService } from './country.service';
import { CountryDto } from './dto/country.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('countries')
@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all countries' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all countries',
    type: CountryDto,
    isArray: true
  })
  findAll(): Promise<CountryDto[]> {
    return this.countryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a country by id' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a country by id',
    type: CountryDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Country not found'
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CountryDto> {
    return this.countryService.findOne(id);
  }
}
