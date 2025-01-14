import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CityService } from './city.service';
import { CityDto } from './dto/city.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('cities')
@Controller('cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cities' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all cities',
    type: CityDto,
    isArray: true
  })
  findAll(@Query('state_id', new ParseIntPipe({ optional: true })) stateId?: number): Promise<CityDto[]> {
    return this.cityService.findAll(stateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a city by id' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a city by id',
    type: CityDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'City not found'
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CityDto> {
    return this.cityService.findOne(id);
  }
}
