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
} 