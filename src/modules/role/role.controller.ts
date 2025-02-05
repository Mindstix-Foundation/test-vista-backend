import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoleDto } from './dto/role.dto';

@ApiTags('roles')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all roles',
    type: [RoleDto]
  })
  async findAll() {
    return await this.roleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by id' })
  @ApiResponse({ status: 200, description: 'Returns the role with users' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.roleService.findOne(id);
  }
} 