import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { SchoolStandardService } from './school_standard.service';
import { CreateSchoolStandardDto, SchoolStandardDto } from './dto/school-standard.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('school-standards')
@Controller('school-standards')
export class SchoolStandardController {
  constructor(private readonly service: SchoolStandardService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new school standard mapping' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully created', type: SchoolStandardDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School or Standard not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Mapping already exists' })
  async create(@Body() createDto: CreateSchoolStandardDto) {
    return await this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all school standard mappings' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of all school standard mappings', type: [SchoolStandardDto] })
  async findAll() {
    return await this.service.findAll();
  }

  @Get('school/:schoolId')
  @ApiOperation({ summary: 'Get standards for a specific school' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of standards for the school', type: [SchoolStandardDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  async findBySchool(@Param('schoolId', ParseIntPipe) schoolId: number) {
    return await this.service.findBySchool(schoolId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a school standard mapping' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Successfully deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mapping not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}
