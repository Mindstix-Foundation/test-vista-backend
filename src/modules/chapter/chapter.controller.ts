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
} from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('chapters')
@Controller('chapters')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chapter' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Chapter created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Chapter already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createChapterDto: CreateChapterDto) {
    return await this.chapterService.create(createChapterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chapters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all chapters' })
  findAll() {
    return this.chapterService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chapter by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chapter found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chapter not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.chapterService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a chapter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The chapter has been successfully updated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chapter not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateChapterDto: UpdateChapterDto) {
    return this.chapterService.update(id, updateChapterDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a chapter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chapter deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chapter not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.chapterService.remove(id);
  }
} 