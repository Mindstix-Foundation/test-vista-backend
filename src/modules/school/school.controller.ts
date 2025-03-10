import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Query, UseGuards } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolDto, CreateSchoolDto, UpdateSchoolDto, SchoolListDto } from './dto/school.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto, SortField, SortOrder } from '../../common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

class GetSchoolsQueryDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'boardId must be a number' })
  boardId?: number;

  @ApiProperty({ required: false, description: 'Search term to filter schools by board name or abbreviation' })
  @IsOptional()
  @IsString()
  boardSearch?: string;
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
  @ApiOperation({ summary: 'Get all schools with optional pagination, sorting and search' })
  @ApiQuery({ name: 'boardId', required: false, type: Number, description: 'Filter schools by board ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1). If not provided, returns all schools.' })
  @ApiQuery({ name: 'page_size', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sort_by', required: false, enum: SortField, description: 'Field to sort by (name, created_at, updated_at)' })
  @ApiQuery({ name: 'sort_order', required: false, enum: SortOrder, description: 'Sort order (asc, desc)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter schools by name' })
  @ApiQuery({ name: 'boardSearch', required: false, type: String, description: 'Search term to filter schools by board name or abbreviation' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns schools with minimal data, paginated if requested',
    type: SchoolListDto,
    isArray: true
  })
  async findAll(@Query() query: GetSchoolsQueryDto) {
    const { boardId, page, page_size, sort_by = SortField.NAME, sort_order = SortOrder.ASC, search, boardSearch } = query;
    
    // If page and page_size are provided, use pagination
    if (page !== undefined && page_size !== undefined) {
      return this.schoolService.findAll(boardId, page, page_size, sort_by, sort_order, search, boardSearch);
    }
    
    // Otherwise, get all schools without pagination
    return this.schoolService.findAllWithoutPagination(boardId, sort_by, sort_order, search, boardSearch);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get a school by id',
    description: 'Returns school details with address, board, instruction mediums (alphabetical), and standards (by sequence)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'School found with properly sorted related data'
  })
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
