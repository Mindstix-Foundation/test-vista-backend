import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Query, BadRequestException, ArgumentMetadata, Injectable, PipeTransform, ParseBoolPipe, UseGuards } from '@nestjs/common';
import { SchoolStandardService } from './school_standard.service';
import { CreateSchoolStandardDto, SchoolStandardDto, SchoolStandardSimplifiedDto } from './dto/school-standard.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Injectable()
class OptionalParseIntPipe implements PipeTransform<string | undefined, number | undefined> {
  transform(value: string | undefined, metadata: ArgumentMetadata): number | undefined {
    if (!value) return undefined;
    
    // Handle case when value is already a number
    if (typeof value === 'number') return value;
    
    // Handle string case
    if (typeof value === 'string' && value.trim() === '') return undefined;
    
    const val = parseInt(value);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed (numeric string is expected)');
    }
    return val;
  }
}

@ApiTags('school-standards')
@Controller('school-standards')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchoolStandardController {
  constructor(private readonly service: SchoolStandardService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new school standard mapping' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully created', type: SchoolStandardDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School or Standard not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Mapping already exists' })
  async create(@Body() createDto: CreateSchoolStandardDto) {
    return await this.service.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all school standard mappings' })
  @ApiQuery({ name: 'standardId', required: false, type: Number })
  @ApiQuery({ name: 'hasSyllabus', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of all school standard mappings', type: [SchoolStandardDto] })
  async findAll(
    @Query('standardId', new OptionalParseIntPipe()) standardId?: number,
    @Query('hasSyllabus', new ParseBoolPipe({ optional: true })) hasSyllabus?: boolean
  ) {
    return await this.service.findAll(standardId, hasSyllabus);
  }

  @Get('school/:schoolId')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get standards for a specific school' })
  @ApiQuery({ name: 'hasSyllabus', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of standards for the school', type: [SchoolStandardSimplifiedDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  async findBySchool(
    @Param('schoolId', ParseIntPipe) schoolId: number,
    @Query('hasSyllabus', new ParseBoolPipe({ optional: true })) hasSyllabus?: boolean
  ) {
    return await this.service.findBySchool(schoolId, hasSyllabus);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a school standard mapping' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Successfully deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mapping not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}
