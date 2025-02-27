import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto, CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all users',
    type: [UserDto]
  })
  async findAll(@Query('schoolId') schoolId?: string) {
    return await this.userService.findAll(schoolId ? +schoolId : undefined);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User found' })
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