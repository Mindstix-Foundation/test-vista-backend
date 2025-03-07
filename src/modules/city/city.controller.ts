import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CityService } from './city.service';
import { CityDto } from './dto/city.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cities')
@Controller('cities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cities' })
  @ApiQuery({ name: 'stateId', required: false, type: Number })
  findAll(@Query('stateId') stateId?: string) {
    return this.cityService.findAll(stateId ? +stateId : undefined);
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
