import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { MediumStandardSubjectService } from './medium-standard-subject.service';
import { CreateMediumStandardSubjectDto, GetMssQueryDto } from './dto/medium-standard-subject.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('medium-standard-subjects')
@Controller('medium-standard-subjects')
export class MediumStandardSubjectController {
  constructor(private readonly mssService: MediumStandardSubjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create medium-standard-subject association' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Association created successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Medium, Standard or Subject not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Association already exists' })
  async create(@Body() createDto: CreateMediumStandardSubjectDto) {
    return await this.mssService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all medium-standard-subject associations' })
  @ApiQuery({ name: 'board_id', required: false, type: Number })
  @ApiQuery({ name: 'instruction_medium_id', required: false, type: Number })
  @ApiQuery({ name: 'standard_id', required: false, type: Number })
  @ApiQuery({ name: 'subject_id', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all associations' })
  async findAll(@Query() query: GetMssQueryDto) {
    return await this.mssService.findAll(query);
  }

  @Get('medium/:mediumId/standard/:standardId')
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete medium-standard-subject association' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Association deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Association not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot delete due to existing relationships' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.mssService.remove(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medium standard subject by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the medium standard subject' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Medium standard subject not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.mssService.findOne(id);
  }
} 