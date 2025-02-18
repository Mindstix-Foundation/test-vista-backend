import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { UserSchoolService } from './user-school.service';
import { CreateUserSchoolDto, UpdateUserSchoolDto } from './dto/user-school.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('user-schools')
@Controller('user-schools')
export class UserSchoolController {
  constructor(private readonly userSchoolService: UserSchoolService) {}

  @Post()
  @ApiOperation({ summary: 'Assign school to user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'School assigned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User or School not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User is already associated with this school' })
  async create(@Body() createDto: CreateUserSchoolDto) {
    return await this.userSchoolService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user school assignments' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all user school assignments' })
  async findAll() {
    return await this.userSchoolService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get schools for a specific user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns user schools' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return await this.userSchoolService.findByUserId(userId);
  }

  @Put('user/:userId/school/:schoolId')
  @ApiOperation({ summary: 'Update user school association' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Association updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Association not found' })
  async update(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('schoolId', ParseIntPipe) schoolId: number,
    @Body() updateDto: UpdateUserSchoolDto
  ) {
    return await this.userSchoolService.update(userId, schoolId, updateDto);
  }

  @Delete('user/:userId/school/:schoolId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove school from user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'School removed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Association not found' })
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('schoolId', ParseIntPipe) schoolId: number
  ) {
    // Find the user school ID first
    const userSchool = await this.userSchoolService.findByUserAndSchool(userId, schoolId);
    await this.userSchoolService.remove(userSchool.id);
  }
} 