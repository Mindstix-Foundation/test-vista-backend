import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto, CreateUserDto, UpdateUserDto, UserListDto } from './dto/user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto, SortField, SortOrder } from '../../common/dto/pagination.dto';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddTeacherDto } from './dto/add-teacher.dto';

class GetUsersQueryDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'schoolId must be a number' })
  schoolId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'roleId must be a number' })
  roleId?: number;

  @ApiProperty({ required: false, description: 'Search term to filter users by school name' })
  @IsOptional()
  @IsString()
  schoolSearch?: string;
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires ADMIN role' })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users with optional pagination, sorting and search' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter users by school ID' })
  @ApiQuery({ name: 'roleId', required: false, type: Number, description: 'Filter users by role ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1). If not provided, returns all users.' })
  @ApiQuery({ name: 'page_size', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sort_by', required: false, enum: SortField, description: 'Field to sort by (name, created_at, updated_at)' })
  @ApiQuery({ name: 'sort_order', required: false, enum: SortOrder, description: 'Sort order (asc, desc)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter users by name' })
  @ApiQuery({ name: 'schoolSearch', required: false, type: String, description: 'Search term to filter users by school name' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns users with minimal data, paginated if requested',
    type: UserListDto,
    isArray: true
  })
  async findAll(@Query() query: GetUsersQueryDto) {
    const { schoolId, roleId, page, page_size, sort_by = SortField.NAME, sort_order = SortOrder.ASC, search, schoolSearch } = query;
    
    // If page and page_size are provided, use pagination
    if (page !== undefined && page_size !== undefined) {
      return await this.userService.findAll(schoolId, roleId, page, page_size, sort_by, sort_order, search, schoolSearch);
    }
    
    // Otherwise, get all users without pagination
    return await this.userService.findAllWithoutPagination(schoolId, roleId, sort_by, sort_order, search, schoolSearch);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Get a user by id',
    description: 'Returns user details with roles, schools, and teaching assignments (standards in sequence order, subjects in alphabetical order)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User found with properly sorted related data'
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.userService.remove(id);
  }

  @Get('check-email/:email')
  @ApiOperation({ summary: 'Check if an email is available (not already registered)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns availability status of the email' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid email format' })
  async checkEmailAvailability(@Param('email') email: string) {
    return await this.userService.checkEmailAvailability(email);
  }

  @Post('teacher')
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Add a new teacher with school and subject assignments',
    description: `Creates a new teacher account with appropriate role, school, and subject assignments in a single transaction.
    
    ## Workflow and Logic:
    1. The API creates a new user entry with the TEACHER role
    2. Assigns the teacher to the specified school
    3. For each standard and subject combination provided:
       - Finds all available instruction mediums for the school
       - For each standard-subject combination, creates entries in the teacher_subject table
         for all valid medium-standard-subject combinations
       - This automatically handles multiple instruction mediums (e.g., English, Hindi)
    
    ## Important Notes:
    - The school must have at least one instruction medium defined
    - All school-standard IDs must belong to the specified school
    - For each standard-subject combination, there must exist valid medium_standard_subject entries
    - The API will validate all inputs and return appropriate error messages if validation fails
    - All operations are performed in a single transaction for data integrity`
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Teacher created successfully with role, school, and subject assignments',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'John Teacher' },
        email_id: { type: 'string', example: 'john.teacher@example.com' },
        contact_number: { type: 'string', example: '+911234567890' },
        alternate_contact_number: { type: 'string', example: '+919876543210', nullable: true },
        highest_qualification: { type: 'string', example: 'M.Tech', nullable: true },
        status: { type: 'boolean', example: true },
        role: { type: 'string', example: 'TEACHER' },
        school: { type: 'string', example: 'Delhi Public School' },
        assigned_standards: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['Class 1', 'Class 2'] 
        },
        message: { type: 'string', example: 'Teacher added successfully' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already exists' })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data (email format, no valid instruction mediums, invalid standard-subject combinations)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'string', 
          example: 'Invalid school-standard IDs: 3, 4 | No valid medium-standard-subject combinations found'
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'School not found, Teacher role not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'School with ID 999 not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires ADMIN role' })
  async addTeacher(@Body() addTeacherDto: AddTeacherDto) {
    return await this.userService.addTeacher(addTeacherDto);
  }
} 