import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { CreateUserRoleDto } from './dto/user-role.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('user-roles')
@Controller('user-roles')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post()
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Role assigned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User or Role not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User already has this role' })
  async create(@Body() createUserRoleDto: CreateUserRoleDto) {
    return await this.userRoleService.create(createUserRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user role assignments' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all user role assignments' })
  async findAll() {
    return await this.userRoleService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get roles for a specific user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns user roles' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return await this.userRoleService.findByUserId(userId);
  }

  @Delete('user/:userId/role/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Role removed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Association not found' })
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number
  ) {
    // Find the user role ID first
    const userRole = await this.userRoleService.findByUserAndRole(userId, roleId);
    await this.userRoleService.remove(userRole.id);
  }
} 