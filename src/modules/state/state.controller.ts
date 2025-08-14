import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { StateService } from './state.service';
import { StateDto } from './dto/state.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('states')
@Controller('states')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
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
