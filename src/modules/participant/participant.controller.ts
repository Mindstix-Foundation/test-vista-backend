import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParticipantService } from './participant.service';
import { RegisterAspirantDto, EnrollProgramDto, ParticipantFilterDto } from './dto/participant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('participants')
@Controller('participants')
export class ParticipantController {
  constructor(private readonly service: ParticipantService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Open aspirant registration (no school required)',
    description: 'Creates account + ASPIRANT participant enrolled in an exam program (UPSC, JEE, NEET...)',
  })
  registerAspirant(@Body() dto: RegisterAspirantDto) {
    return this.service.registerAspirant(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my participant profiles and enrolled programs' })
  findMine(@Request() req) {
    return this.service.findByUserId(req.user.id);
  }

  @Post('me/enroll/:programId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll myself (aspirant) in an additional exam program' })
  enrollMine(@Request() req, @Param('programId', ParseIntPipe) programId: number) {
    return this.service.enrollMyProgram(req.user.id, programId);
  }

  @Get('assignable-students/:programId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({
    summary: 'Students assignable to a competitive/entrance mock (same-org + program-enrolled)',
  })
  assignableStudents(@Request() req, @Param('programId', ParseIntPipe) programId: number) {
    return this.service.getAssignableStudents(programId, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'List participants with filters' })
  findAll(@Query() filter: ParticipantFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get participant details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post('enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Enroll participant in an additional exam program' })
  enrollProgram(@Body() dto: EnrollProgramDto) {
    return this.service.enrollProgram(dto);
  }

  @Post(':id/cohort/:cohortId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Assign participant to a cohort/batch' })
  assignCohort(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('cohortId', ParseIntPipe) cohortId: number,
  ) {
    return this.service.assignCohort(id, cohortId, req.user.id);
  }
}
