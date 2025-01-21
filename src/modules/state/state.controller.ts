import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { StateService } from './state.service';
import { StateDto } from './dto/state.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('states')
@Controller('states')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  @ApiOperation({ summary: 'Get all states' })
  @ApiQuery({ name: 'countryId', required: false, type: Number })
  findAll(@Query('countryId') countryId?: string): Promise<StateDto[]> {
    return this.stateService.findAll(countryId ? +countryId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a state by id' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a state by id',
    type: StateDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'State not found'
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<StateDto> {
    return this.stateService.findOne(id);
  }
}
