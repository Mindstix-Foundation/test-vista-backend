import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { SchoolInstructionMediumService } from './school_instruction_medium.service';
import { CreateSchoolInstructionMediumDto } from './dto/school-instruction-medium.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('school-instruction-mediums')
@Controller('school-instruction-mediums')
export class SchoolInstructionMediumController {
  constructor(private readonly service: SchoolInstructionMediumService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new school instruction medium mapping' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully created' })
  async create(@Body() createDto: CreateSchoolInstructionMediumDto) {
    return await this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all school instruction medium mappings' })
  async findAll() {
    return await this.service.findAll();
  }

  @Get('school/:schoolId')
  @ApiOperation({ summary: 'Get instruction mediums for a specific school' })
  async findBySchool(@Param('schoolId', ParseIntPipe) schoolId: number) {
    return await this.service.findBySchool(schoolId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a school instruction medium mapping' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}
