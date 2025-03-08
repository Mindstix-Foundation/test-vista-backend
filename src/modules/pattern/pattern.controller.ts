import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PatternService } from './pattern.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto, SortField, SortOrder } from '../../common/dto/pagination.dto';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class GetPatternsQueryDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'boardId must be a number' })
  boardId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'standardId must be a number' })
  standardId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'subjectId must be a number' })
  subjectId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'totalMarks must be a number' })
  totalMarks?: number;
}

@ApiTags('patterns')
@Controller('patterns')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PatternController {
  constructor(private readonly patternService: PatternService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new pattern' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Pattern created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createPatternDto: CreatePatternDto) {
    return await this.patternService.create(createPatternDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all patterns with pagination, sorting and optional filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns paginated patterns' })
  @ApiQuery({ name: 'boardId', required: false, type: Number, description: 'Filter by board ID' })
  @ApiQuery({ name: 'standardId', required: false, type: Number, description: 'Filter by standard ID' })
  @ApiQuery({ name: 'subjectId', required: false, type: Number, description: 'Filter by subject ID' })
  @ApiQuery({ name: 'totalMarks', required: false, type: Number, description: 'Filter by total marks' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'page_size', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sort_by', required: false, enum: SortField, description: 'Field to sort by (name, created_at, updated_at)' })
  @ApiQuery({ name: 'sort_order', required: false, enum: SortOrder, description: 'Sort order (asc, desc)' })
  findAll(@Query() query: GetPatternsQueryDto) {
    const { 
      boardId, 
      standardId, 
      subjectId, 
      totalMarks, 
      page = 1, 
      page_size = 10, 
      sort_by = SortField.CREATED_AT, 
      sort_order = SortOrder.DESC 
    } = query;
    
    return this.patternService.findAll({
      boardId,
      standardId,
      subjectId,
      totalMarks,
      page,
      page_size,
      sort_by,
      sort_order
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a pattern by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pattern found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pattern not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.patternService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a pattern' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pattern updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pattern not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatternDto: UpdatePatternDto,
  ) {
    return await this.patternService.update(id, updatePatternDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a pattern' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pattern deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pattern not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.patternService.remove(id);
  }
} 