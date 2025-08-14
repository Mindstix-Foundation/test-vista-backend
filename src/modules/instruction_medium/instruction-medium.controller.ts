import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InstructionMediumService } from './instruction-medium.service';
import { InstructionMediumDto, CreateInstructionMediumDto, UpdateInstructionMediumDto } from './dto/instruction-medium.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('instruction-mediums')
@Controller('instruction-mediums')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InstructionMediumController {
  constructor(private readonly instructionMediumService: InstructionMediumService) {}

  @Post()
  @Roles('ADMIN')
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
  @Roles('ADMIN', 'TEACHER')
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
  @Roles('ADMIN', 'TEACHER')
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
  @Roles('ADMIN')
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
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete an instruction medium' })
  @ApiResponse({ 
    status: 204, 
    description: 'The instruction medium has been successfully deleted.'
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.instructionMediumService.remove(id);
  }

  @Get('board/:boardId')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get instruction mediums by board id' })
  @ApiResponse({ status: 200, description: 'List of instruction mediums for the specified board' })
  async findByBoard(@Param('boardId', ParseIntPipe) boardId: number) {
    return await this.instructionMediumService.findByBoard(boardId);
  }
} 