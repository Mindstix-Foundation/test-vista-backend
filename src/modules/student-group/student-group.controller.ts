import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StudentGroupService } from './student-group.service';
import {
  AddGroupMembersDto,
  CreateStudentGroupDto,
  UpdateStudentGroupDto,
} from './student-group.dto';

@ApiTags('student-groups')
@Controller('student-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('TEACHER', 'ADMIN')
export class StudentGroupController {
  constructor(private readonly service: StudentGroupService) {}

  @Get()
  @ApiOperation({ summary: 'List student/aspirant groups for my organization' })
  list(@Request() req) {
    return this.service.listGroups(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one group with members' })
  getOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.getGroup(req.user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a group (optional initial members)' })
  create(@Request() req, @Body() dto: CreateStudentGroupDto) {
    return this.service.createGroup(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Rename / update group' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentGroupDto,
  ) {
    return this.service.updateGroup(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a group' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteGroup(req.user.id, id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add participants to a group' })
  addMembers(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddGroupMembersDto,
  ) {
    return this.service.addMembers(req.user.id, id, dto);
  }

  @Delete(':id/members/:participantId')
  @ApiOperation({ summary: 'Remove a participant from a group' })
  removeMember(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('participantId', ParseIntPipe) participantId: number,
  ) {
    return this.service.removeMember(req.user.id, id, participantId);
  }
}
