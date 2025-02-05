import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { MediumStandardSubjectService } from './medium-standard-subject.service';
import { CreateMediumStandardSubjectDto } from './dto/medium-standard-subject.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all associations' })
  async findAll() {
    return await this.mssService.findAll();
  }

  @Get('medium/:mediumId/standard/:standardId')
  @ApiOperation({ summary: 'Get subjects for medium and standard' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns subjects for the medium and standard' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Medium or Standard not found' })
  async findByMediumAndStandard(
    @Param('mediumId', ParseIntPipe) mediumId: number,
    @Param('standardId', ParseIntPipe) standardId: number
  ) {
    return await this.mssService.findByMediumAndStandard(mediumId, standardId);
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
} 