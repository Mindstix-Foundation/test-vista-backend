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
} from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ReorderChapterDto } from './dto/reorder-chapter.dto';
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
  @ApiOperation({ summary: 'Create a new chapter' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Chapter created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Chapter already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createChapterDto: CreateChapterDto) {
    return await this.chapterService.create(createChapterDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all chapters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all chapters' })
  @ApiQuery({
    name: 'mediumStandardSubjectId',
    required: false,
    type: Number,
    description: 'Filter chapters by medium standard subject ID'
  })
  findAll(@Query('mediumStandardSubjectId') mediumStandardSubjectId?: string) {
    return this.chapterService.findAll(mediumStandardSubjectId ? +mediumStandardSubjectId : undefined);
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

  @Put('reorder/:chapterId/:mediumStandardSubjectId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reorder a chapter within a medium standard subject' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chapter reordered successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chapter not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid sequence number' })
  async reorder(
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Param('mediumStandardSubjectId', ParseIntPipe) mediumStandardSubjectId: number,
    @Body() reorderChapterDto: ReorderChapterDto
  ) {
    return await this.chapterService.reorderChapter(
      chapterId,
      reorderChapterDto.sequential_chapter_number,
      mediumStandardSubjectId
    );
  }
} 