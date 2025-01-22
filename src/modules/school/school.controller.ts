import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolDto, CreateSchoolDto, UpdateSchoolDto } from './dto/school.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('schools')
@Controller('schools')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new school' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'School created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'School already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Address not found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Board not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Address already in use' })
  async create(@Body() createSchoolDto: CreateSchoolDto) {
    return await this.schoolService.create(createSchoolDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schools' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all schools',
    type: SchoolDto,
    isArray: true
  })
  async findAll() {
    return await this.schoolService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a school by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'School found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.schoolService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a school' })
  @ApiResponse({ status: HttpStatus.OK, description: 'School updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSchoolDto: UpdateSchoolDto,
  ) {
    return await this.schoolService.update(id, updateSchoolDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a school' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'School deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.schoolService.remove(id);
  }
}
