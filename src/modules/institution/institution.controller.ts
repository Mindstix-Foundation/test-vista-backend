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
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InstitutionService } from './institution.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  UpdateOrgVisibilityDto,
  CreateCohortDto,
  MapTeacherCohortDto,
  InstitutionFilterDto,
} from './dto/institution.dto';
import {
  CreateTeacherOrgDto,
} from './dto/create-teacher-org.dto';
import {
  JoinInstitutionDto,
  JoinByCodeDto,
  JoinCoachingDto,
  JoinCoachingByCodeDto,
  RespondMembershipDto,
} from './dto/membership.dto';
import { CsvInviteDto } from './dto/csv-invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionController {
  constructor(private readonly service: InstitutionService) {}

  @Post('self')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Teacher creates School or Coaching Center (becomes ADMIN)' })
  createSelf(@Request() req, @Body() dto: CreateTeacherOrgDto) {
    return this.service.createForTeacher(req.user.id, dto);
  }

  @Get('discover')
  @ApiOperation({
    summary: 'Browse PUBLIC active schools / coaching centers',
    description:
      'Optionally filter by city_id (preferred at registration to keep payloads small), search, and institution_type.',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'institution_type', required: false, enum: ['SCHOOL', 'COACHING_CENTER'] })
  @ApiQuery({ name: 'city_id', required: false, type: Number })
  discover(
    @Query('search') search?: string,
    @Query('institution_type') institutionType?: string,
    @Query('city_id') cityId?: string,
  ) {
    return this.service.discoverPublic(
      search,
      institutionType,
      cityId ? +cityId : undefined,
    );
  }

  @Get('me/membership')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Get my pending or active org membership' })
  myMembership(@Request() req) {
    return this.service.getMyMembership(req.user.id);
  }

  @Get('me/pending-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'List pending teacher join requests for orgs I admin' })
  pendingRequests(@Request() req) {
    return this.service.listPendingJoinRequestsForAdmin(req.user.id);
  }

  @Get('me/pending-learner-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'List pending student join requests for orgs I admin' })
  pendingLearnerRequests(@Request() req) {
    return this.service.listPendingLearnerRequestsForAdmin(req.user.id);
  }

  @Post('me/invites/csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Org admin CSV invite (teachers + learners as pending memberships)',
  })
  inviteCsv(@Request() req, @Body() dto: CsvInviteDto) {
    return this.service.inviteMembersFromCsv(req.user.id, dto);
  }

  @Get('me/learner-membership')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get my pending or active learner (school/coaching) membership' })
  myLearnerMembership(@Request() req) {
    return this.service.getMyLearnerMembership(req.user.id);
  }

  @Delete('me/pending-learner-request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Cancel my pending coaching join request' })
  cancelPendingLearner(@Request() req) {
    return this.service.cancelMyPendingLearnerRequest(req.user.id);
  }

  @Delete('me/membership')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Leave my organization (sole admin must promote or soft-close first)' })
  leaveMembership(@Request() req) {
    return this.service.leaveMyMembership(req.user.id);
  }

  @Delete('me/learner-membership')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Leave my school/coaching membership' })
  leaveLearnerMembership(@Request() req) {
    return this.service.leaveMyLearnerMembership(req.user.id);
  }

  @Get('me/org-members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'List active teachers in orgs I admin (for promote)' })
  orgMembers(@Request() req) {
    return this.service.listOrgMembersForAdmin(req.user.id);
  }

  @Put('memberships/:membershipId/promote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Promote an active teacher to organization ADMIN' })
  promote(@Request() req, @Param('membershipId', ParseIntPipe) membershipId: number) {
    return this.service.promoteMemberToAdmin(req.user.id, membershipId);
  }

  @Post(':id/soft-close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Org admin soft-closes organization (notifies members)' })
  softClose(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const roles: string[] = req.user?.roles || [];
    if (roles.includes('ADMIN') && !roles.includes('TEACHER')) {
      return this.service.softClose(id, req.user.id);
    }
    return this.service.softCloseForOrgAdmin(req.user.id, id);
  }

  @Put(':id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Org admin sets organization PUBLIC or PRIVATE',
    description:
      'PUBLIC orgs appear in browse/discover. PRIVATE orgs require the org code to join.',
  })
  updateVisibility(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrgVisibilityDto,
  ) {
    return this.service.updateVisibilityForOrgAdmin(req.user.id, id, dto);
  }

  @Get('coaching/by-code/:orgCode/standards')
  @ApiOperation({ summary: 'List standards for a coaching center by org_code' })
  coachingStandardsByCode(@Param('orgCode') orgCode: string) {
    return this.service.getCoachingStandardsByCode(orgCode);
  }

  @Get('coaching/:id/standards')
  @ApiOperation({ summary: 'List standards offered by a coaching center (for aspirant join)' })
  coachingStandards(@Param('id', ParseIntPipe) id: number) {
    return this.service.getCoachingStandards(id);
  }

  @Get('by-code/:orgCode/join-standards')
  @ApiOperation({
    summary: 'List standards for School or Coaching by org_code (public — registration)',
  })
  joinStandardsByCode(@Param('orgCode') orgCode: string) {
    return this.service.getJoinStandardsByCode(orgCode);
  }

  @Get(':id/join-standards')
  @ApiOperation({
    summary: 'List standards for School or Coaching by id (public — registration)',
  })
  joinStandards(@Param('id', ParseIntPipe) id: number) {
    return this.service.getJoinStandards(id);
  }

  @Post('coaching/join-by-code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Aspirant requests to join coaching by org_code' })
  joinCoachingByCode(@Request() req, @Body() dto: JoinCoachingByCodeDto) {
    return this.service.requestCoachingJoinByCode(
      req.user.id,
      dto.org_code,
      dto.school_standard_id,
      dto.request_message,
    );
  }

  @Post('coaching/:id/join')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Aspirant requests to join a PUBLIC coaching center' })
  joinCoaching(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: JoinCoachingDto,
  ) {
    return this.service.requestCoachingJoin(
      req.user.id,
      id,
      dto.school_standard_id,
      dto.request_message,
    );
  }

  @Put('learner-memberships/:membershipId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Org admin accepts or rejects a student join request' })
  respondLearnerMembership(
    @Request() req,
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @Body() dto: RespondMembershipDto,
  ) {
    return this.service.respondToLearnerJoinRequest(req.user.id, membershipId, dto.status);
  }

  @Delete('me/pending-request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Cancel my pending join request' })
  cancelPending(@Request() req) {
    return this.service.cancelMyPendingRequest(req.user.id);
  }

  @Post('join-by-code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Request to join org by org_code (PUBLIC or PRIVATE)' })
  joinByCode(@Request() req, @Body() dto: JoinByCodeDto) {
    return this.service.requestJoinByCode(req.user.id, dto.org_code, dto.request_message);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Request to join a PUBLIC organization by id' })
  join(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: JoinInstitutionDto) {
    return this.service.requestJoin(req.user.id, id, dto.request_message);
  }

  @Put('memberships/:membershipId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Org admin accepts or rejects a teacher join request' })
  respondMembership(
    @Request() req,
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @Body() dto: RespondMembershipDto,
  ) {
    return this.service.respondToJoinRequest(req.user.id, membershipId, dto.status);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'List institutions (schools, coaching centers, virtual)' })
  findAll(@Query() filter: InstitutionFilterDto) {
    return this.service.findAll(filter);
  }

  @Get('cohorts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'List exam cohorts (batches)' })
  @ApiQuery({ name: 'exam_program_id', required: false, type: Number })
  @ApiQuery({ name: 'institution_id', required: false, type: Number })
  findCohorts(
    @Query('exam_program_id') examProgramId?: string,
    @Query('institution_id') institutionId?: string,
  ) {
    return this.service.findCohorts(
      examProgramId ? Number.parseInt(examProgramId, 10) : undefined,
      institutionId ? Number.parseInt(institutionId, 10) : undefined,
    );
  }

  @Get('me/teacher-cohorts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'List cohorts I am mapped to teach' })
  myTeacherCohorts(@Request() req) {
    return this.service.listMyTeacherCohorts(req.user.id);
  }

  @Post('cohorts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create exam cohort for my org (auto-maps creator as teacher)' })
  createCohort(@Request() req, @Body() dto: CreateCohortDto) {
    const roles: string[] = req.user?.roles || [];
    if (roles.includes('TEACHER')) {
      return this.service.createCohortForTeacher(req.user.id, dto);
    }
    return this.service.createCohort(dto);
  }

  @Post('teacher-cohorts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Map a teacher to an exam cohort (self or org-admin for others)' })
  mapTeacherCohort(@Request() req, @Body() dto: MapTeacherCohortDto) {
    return this.service.mapTeacherToCohort(req.user.id, dto);
  }

  @Delete('teacher-cohorts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Unmap teacher from exam cohort' })
  unmapTeacherCohort(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.unmapTeacherFromCohort(req.user.id, id);
  }

  @Delete('cohorts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Delete exam cohort (org admin or platform admin)' })
  removeCohort(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const roles: string[] = req.user?.roles || [];
    const isPlatformAdmin = roles.includes('ADMIN');
    return this.service.removeCohortForActor(req.user.id, id, isPlatformAdmin);
  }

  @Get('by-code/:orgCode')
  @ApiOperation({ summary: 'Lookup institution by org_code (public join helper)' })
  findByOrgCode(@Param('orgCode') orgCode: string) {
    return this.service.findByOrgCode(orgCode);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get institution with programs and cohorts' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create institution (coaching center / virtual)' })
  create(@Body() dto: CreateInstitutionDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update institution' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInstitutionDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/programs/:programId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Link exam program to institution' })
  addProgram(
    @Param('id', ParseIntPipe) id: number,
    @Param('programId', ParseIntPipe) programId: number,
  ) {
    return this.service.addProgram(id, programId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Soft-close institution (platform admin)' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.softClose(id, req.user.id);
  }
}
