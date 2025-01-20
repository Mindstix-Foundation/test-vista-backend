import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { InstructionMediumService } from './instruction-medium.service';
import { InstructionMediumDto, CreateInstructionMediumDto, UpdateInstructionMediumDto } from './dto/instruction-medium.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('instruction-mediums')
@Controller('instruction-mediums')
export class InstructionMediumController {
  constructor(private readonly instructionMediumService: InstructionMediumService) {}

  @Post()
  @ApiOperation({ summary: 'Create instruction medium' })
  @ApiResponse({ 
    status: 201, 
    description: 'The instruction medium has been successfully created.',
    type: InstructionMediumDto
  })
  create(@Body() createInstructionMediumDto: CreateInstructionMediumDto): Promise<InstructionMediumDto> {
    return this.instructionMediumService.create(createInstructionMediumDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all instruction mediums' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all instruction mediums',
    type: InstructionMediumDto,
    isArray: true
  })
  findAll(): Promise<InstructionMediumDto[]> {
    return this.instructionMediumService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an instruction medium by id' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns an instruction medium by id',
    type: InstructionMediumDto
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<InstructionMediumDto> {
    return this.instructionMediumService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an instruction medium' })
  @ApiResponse({ 
    status: 200, 
    description: 'The instruction medium has been successfully updated.',
    type: InstructionMediumDto
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstructionMediumDto: UpdateInstructionMediumDto,
  ): Promise<InstructionMediumDto> {
    return this.instructionMediumService.update(id, updateInstructionMediumDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an instruction medium' })
  @ApiResponse({ 
    status: 204, 
    description: 'The instruction medium has been successfully deleted.'
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.instructionMediumService.remove(id);
  }
} 