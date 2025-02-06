import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { MediumStandardSubjectService } from './medium-standard-subject.service';
import { CreateMediumStandardSubjectDto } from './dto/medium-standard-subject.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

class GetMssQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  standardId?: number;
}

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
  @ApiQuery({ name: 'standardId', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all associations' })
  async findAll(@Query() query: GetMssQueryDto) {
    return await this.mssService.findAll(query.standardId);
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