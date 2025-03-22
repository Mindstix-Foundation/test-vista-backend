import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Query, UseGuards } from '@nestjs/common';
import { MediumStandardSubjectService } from './medium-standard-subject.service';
import { CreateMediumStandardSubjectDto, GetMssQueryDto } from './dto/medium-standard-subject.dto';
import { GetMediumsQueryDto, MediumsResponse } from './dto/get-mediums.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('medium-standard-subjects')
@Controller('medium-standard-subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MediumStandardSubjectController {
  constructor(private readonly mssService: MediumStandardSubjectService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create medium-standard-subject association' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Association created successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Medium, Standard or Subject not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Association already exists' })
  async create(@Body() createDto: CreateMediumStandardSubjectDto) {
    return await this.mssService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all medium standard subjects' })
  @ApiQuery({ name: 'boardId', required: false, type: Number })
  @ApiQuery({ name: 'instruction_medium_id', required: false, type: Number })
  @ApiQuery({ name: 'standard_id', required: false, type: Number })
  @ApiQuery({ name: 'subject_id', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all associations' })
  async findAll(
    @Query('boardId', new ParseIntPipe({ optional: true })) boardId?: string,
    @Query('instruction_medium_id', new ParseIntPipe({ optional: true })) instruction_medium_id?: string,
    @Query('standard_id', new ParseIntPipe({ optional: true })) standard_id?: string,
    @Query('subject_id', new ParseIntPipe({ optional: true })) subject_id?: string,
  ) {
    return this.mssService.findAll(
      boardId,
      instruction_medium_id,
      standard_id,
      subject_id
    );
  }

  @Get('check-mediums')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Check if a standard and subject have multiple instruction mediums' })
  @ApiQuery({ name: 'standard_id', required: true, type: Number, description: 'Standard ID' })
  @ApiQuery({ name: 'subject_id', required: true, type: Number, description: 'Subject ID' })
  @ApiQuery({ name: 'board_id', required: true, type: Number, description: 'Board ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns whether multiple instruction mediums exist and their details',
    type: MediumsResponse
  })
  @ApiResponse({ status: 404, description: 'Standard or subject not found' })
  async getMediumsForStandardSubject(@Query() query: GetMediumsQueryDto) {
    return await this.mssService.getMediumsForStandardSubject(
      query.standard_id, 
      query.subject_id, 
      query.board_id
    );
  }

  @Get('medium/:mediumId/standard/:standardId')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get subjects for medium and standard' })
  @ApiQuery({ name: 'board_id', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns subjects for the medium and standard' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Medium or Standard not found' })
  async findByMediumAndStandard(
    @Param('mediumId', ParseIntPipe) mediumId: number,
    @Param('standardId', ParseIntPipe) standardId: number,
    @Query('board_id', new ParseIntPipe({ optional: true })) boardId?: number
  ) {
    return await this.mssService.findByMediumAndStandard(mediumId, standardId, boardId);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get medium standard subject by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the medium standard subject' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Medium standard subject not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.mssService.findOne(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete medium-standard-subject association' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Association deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Association not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot delete due to existing relationships' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.mssService.remove(id);
  }
} 