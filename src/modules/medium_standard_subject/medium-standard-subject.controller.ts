import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Query, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { MediumStandardSubjectService } from './medium-standard-subject.service';
import { CreateMediumStandardSubjectDto, GetMssQueryDto } from './dto/medium-standard-subject.dto';
import { GetMediumsQueryDto, MediumsResponse } from './dto/get-mediums.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Logger } from '@nestjs/common';

@ApiTags('medium-standard-subjects')
@Controller('medium-standard-subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MediumStandardSubjectController {
  private readonly logger = new Logger(MediumStandardSubjectController.name);

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
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all associations sorted alphabetically by subject name, with a flag indicating if chapters exist for each standard-subject pair. Unnecessary fields like created_at and updated_at are excluded.' 
  })
  async findAll(
    @Query('boardId', new ParseIntPipe({ optional: true, errorHttpStatusCode: HttpStatus.BAD_REQUEST })) boardId?: string,
    @Query('instruction_medium_id', new ParseIntPipe({ optional: true, errorHttpStatusCode: HttpStatus.BAD_REQUEST })) instruction_medium_id?: string,
    @Query('standard_id', new ParseIntPipe({ optional: true, errorHttpStatusCode: HttpStatus.BAD_REQUEST })) standard_id?: string,
    @Query('subject_id', new ParseIntPipe({ optional: true, errorHttpStatusCode: HttpStatus.BAD_REQUEST })) subject_id?: string,
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
  @ApiOperation({ 
    summary: 'Get subjects for a specific medium and standard',
    description: 'Returns a list of subjects available for the given medium and standard combination. Optional board ID filter can be provided as a query parameter.'
  })
  @ApiParam({ name: 'mediumId', description: 'Instruction Medium ID' })
  @ApiParam({ name: 'standardId', description: 'Standard ID' })
  @ApiQuery({ name: 'board_id', required: false, description: 'Optional Board ID to filter by' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns an array of subjects with their IDs and names',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subject_id: { type: 'number', example: 1 },
          subject_name: { type: 'string', example: 'Mathematics' }
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid parameters (non-numeric IDs or resource not found)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Standard with ID 2 not found' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async findByMediumAndStandard(
    @Param('mediumId') mediumId: string,
    @Param('standardId') standardId: string,
    @Query('board_id') boardId?: string
  ) {
    try {
      const mediumIdNum = parseInt(mediumId, 10);
      const standardIdNum = parseInt(standardId, 10);
      const boardIdNum = boardId ? parseInt(boardId, 10) : undefined;
      
      if (isNaN(mediumIdNum)) {
        throw new BadRequestException('Invalid medium ID: must be a number');
      }
      
      if (isNaN(standardIdNum)) {
        throw new BadRequestException('Invalid standard ID: must be a number');
      }
      
      if (boardId && isNaN(boardIdNum)) {
        throw new BadRequestException('Invalid board ID: must be a number');
      }
      
      const result = await this.mssService.findByMediumAndStandard(mediumIdNum, standardIdNum, boardIdNum);
      
      // Transform the response to use explicit field names
      return result.map(item => ({
        subject_id: item.subject.id,
        subject_name: item.subject.name,
        has_chapters: item.has_chapters
      }));
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        // Preserve the specific error message from the service
        throw new BadRequestException(error.message);
      }
      this.logger.error(`Error in findByMediumAndStandard: ${error.message}`, error.stack);
      throw new BadRequestException('Invalid parameters provided');
    }
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get medium standard subject by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the medium standard subject' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Medium standard subject not found' })
  async findOne(@Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number) {
    return await this.mssService.findOne(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete medium-standard-subject association' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Association deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Association not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot delete due to existing relationships' })
  async remove(@Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number) {
    await this.mssService.remove(id);
  }
} 