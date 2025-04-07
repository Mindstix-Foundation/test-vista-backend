import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ReorderChapterDto } from './dto/reorder-chapter.dto';
import { CheckQuestionTypeDto } from './dto/check-question-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('chapters')
@Controller('chapters')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Create a new chapter',
    description: 'Creates a new chapter with the provided details. The sequential_chapter_number is automatically assigned by the system as the next available number for the given subject and standard.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Chapter created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Chapter already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createChapterDto: CreateChapterDto) {
    return await this.chapterService.create(createChapterDto);
  }

  @Get('checkQuestionType')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Check available question type for specific chapters',
    description: 'Checks for an available question type in the provided chapter IDs and returns counts for each chapter. When multiple instruction mediums are provided, only questions that exist in ALL of the specified mediums are counted (common questions).'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns counts of available question type for each chapter' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'One or more chapters or question type not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input' 
  })
  @ApiQuery({
    name: 'chapterIds',
    required: true,
    type: String,
    description: 'Comma-separated array of chapter IDs',
    example: '1,2,3'
  })
  @ApiQuery({
    name: 'questionTypeId',
    required: true,
    type: Number,
    description: 'Question type ID',
    example: '1'
  })
  @ApiQuery({
    name: 'mediumIds',
    required: true,
    type: String,
    description: 'Comma-separated array of medium IDs. If multiple mediums are provided, only questions available in ALL specified mediums will be counted.',
    example: '1,2,3'
  })
  async checkQuestionType(@Query() checkQuestionTypeDto: CheckQuestionTypeDto) {
    return await this.chapterService.checkQuestionType(checkQuestionTypeDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get all chapters',
    description: 'Retrieves all chapters, optionally filtered by subject ID, standard ID, and instruction medium ID. When using medium ID filter, both subject ID and standard ID must also be provided.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all chapters that match the specified filters'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request, such as providing medium ID without subject ID or standard ID'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'The specified combination of medium, standard, and subject does not exist'
  })
  @ApiQuery({
    name: 'subjectId',
    required: false,
    type: Number,
    description: 'Filter chapters by subject ID'
  })
  @ApiQuery({
    name: 'standardId',
    required: false,
    type: Number,
    description: 'Filter chapters by standard ID'
  })
  @ApiQuery({
    name: 'mediumId',
    required: false,
    type: Number,
    description: 'Filter chapters by instruction medium ID. Requires both subject and standard IDs.'
  })
  findAll(
    @Query('subjectId') subjectId?: string,
    @Query('standardId') standardId?: string,
    @Query('mediumId') mediumId?: string
  ) {
    return this.chapterService.findAll(
      subjectId ? +subjectId : undefined,
      standardId ? +standardId : undefined,
      mediumId ? +mediumId : undefined
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a chapter by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chapter found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chapter not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.chapterService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a chapter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The chapter has been successfully updated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chapter not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateChapterDto: UpdateChapterDto) {
    return this.chapterService.update(id, updateChapterDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a chapter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chapter deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chapter not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.chapterService.remove(id);
  }

  @Put('reorder/:chapterId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reorder a chapter within a subject and standard' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chapter reordered successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chapter not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid sequence number' })
  async reorder(
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() reorderChapterDto: ReorderChapterDto
  ) {
    return await this.chapterService.reorderChapter(
      chapterId,
      reorderChapterDto.sequential_chapter_number
    );
  }
} 