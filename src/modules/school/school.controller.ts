import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Query, UseGuards } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolDto, CreateSchoolDto, UpdateSchoolDto } from './dto/school.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

class GetSchoolsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  boardId?: number;
}

@ApiTags('schools')
@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  @Roles('ADMIN')
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
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all schools' })
  @ApiQuery({ name: 'boardId', required: false, type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all schools',
    type: SchoolDto,
    isArray: true
  })
  async findAll(@Query() query: GetSchoolsQueryDto) {
    return await this.schoolService.findAll(query.boardId);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a school by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'School found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.schoolService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
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
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a school' })
  @ApiResponse({ status: HttpStatus.OK, description: 'School deleted successfully or error message' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'School has assigned teachers' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.schoolService.remove(id);
  }
}
