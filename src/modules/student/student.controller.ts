import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe, 
  HttpStatus, 
  HttpCode, 
  UseGuards, 
  ValidationPipe,
  ConflictException
} from '@nestjs/common';
import { StudentService, StudentSearchParams } from './student.service';
import { 
  CreateStudentDto, 
  UpdateStudentDto, 
  StudentListDto, 
  StudentDetailDto 
} from './dto/student.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiProperty, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto, SortField, SortOrder } from '../../common/dto/pagination.dto';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString } from 'class-validator';

class GetStudentsQueryDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'schoolId must be a number' })
  schoolId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)  
  @IsNumber({}, { message: 'standardId must be a number' })
  standardId?: number;

  @ApiProperty({ required: false, description: 'Filter students by status' })
  @IsOptional()
  @IsString()
  status?: string;
}

@ApiTags('students')
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new student (Registration)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Student created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email or Student ID already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School Standard not found' })
  async create(@Body() createStudentDto: CreateStudentDto) {
    return await this.studentService.create(createStudentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all students with optional filtering, pagination, and search' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID' })
  @ApiQuery({ name: 'standardId', required: false, type: Number, description: 'Filter by standard ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by student status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'page_size', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sort_by', required: false, enum: SortField, description: 'Field to sort by' })
  @ApiQuery({ name: 'sort_order', required: false, enum: SortOrder, description: 'Sort order' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by student name or student ID' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Teacher role required' })
  async findAll(@Query() query: GetStudentsQueryDto) {
    const params: StudentSearchParams = {
      schoolId: query.schoolId,
      standardId: query.standardId,
      status: query.status,
      page: query.page,
      page_size: query.page_size,
      sort_by: query.sort_by,
      sort_order: query.sort_order,
      search: query.search
    };

    // If pagination parameters are provided, use paginated response
    if (query.page || query.page_size) {
      return this.studentService.findAll(params);
    }
    
    // Otherwise return all students without pagination
    return this.studentService.findAllWithoutPagination(params);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get a student by id',
    description: 'Returns detailed student information including school, standard, recent assignments, and analytics'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Student found with detailed information'
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Student not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires ADMIN or TEACHER role' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.studentService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a student' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Student updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Student not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email or Student ID already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires ADMIN role' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return await this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a student' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Student deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Student not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires ADMIN role' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.studentService.remove(id);
  }

  @Get('check-student-id/:studentId/:schoolStandardId')
  @ApiOperation({ summary: 'Check if a student ID is available in a specific school-standard' })
  @ApiParam({ name: 'studentId', type: String, description: 'Student ID to check' })
  @ApiParam({ name: 'schoolStandardId', type: Number, description: 'School Standard ID' })
  @ApiResponse({ status: 200, description: 'Student ID availability checked successfully' })
  async checkStudentIdAvailability(
    @Param('studentId') studentId: string,
    @Param('schoolStandardId', ParseIntPipe) schoolStandardId: number
  ) {
    return this.studentService.checkStudentIdAvailability(studentId, schoolStandardId);
  }

  @Get('by-school/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all students in a specific school' })
  @ApiParam({ name: 'schoolId', type: Number, description: 'School ID' })
  @ApiQuery({ name: 'standardId', required: false, type: Number, description: 'Filter by standard ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by student status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by student name or student ID' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Teacher role required' })
  async findBySchool(
    @Param('schoolId', ParseIntPipe) schoolId: number,
    @Query() query: { standardId?: number; status?: string; search?: string }
  ) {
    const params: StudentSearchParams = {
      schoolId,
      standardId: query.standardId,
      status: query.status,
      search: query.search
    };
    return this.studentService.findAllWithoutPagination(params);
  }

  @Get('by-standard/:standardId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all students in a specific standard' })
  @ApiParam({ name: 'standardId', type: Number, description: 'Standard ID' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by student status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by student name or student ID' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Teacher role required' })
  async findByStandard(
    @Param('standardId', ParseIntPipe) standardId: number,
    @Query() query: { schoolId?: number; status?: string; search?: string }
  ) {
    const params: StudentSearchParams = {
      standardId,
      schoolId: query.schoolId,
      status: query.status,
      search: query.search
    };
    return this.studentService.findAllWithoutPagination(params);
  }
} 