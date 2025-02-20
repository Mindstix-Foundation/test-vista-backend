import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { PatternService } from './pattern.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('patterns')
@Controller('patterns')
export class PatternController {
  constructor(private readonly patternService: PatternService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pattern' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Pattern created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createPatternDto: CreatePatternDto) {
    return await this.patternService.create(createPatternDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patterns with optional filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all patterns' })
  @ApiQuery({ name: 'boardId', required: false, type: Number })
  @ApiQuery({ name: 'standardId', required: false, type: Number })
  @ApiQuery({ name: 'subjectId', required: false, type: Number })
  @ApiQuery({ name: 'totalMarks', required: false, type: Number })
  findAll(
    @Query('boardId') boardId?: string,
    @Query('standardId') standardId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('totalMarks') totalMarks?: string,
  ) {
    return this.patternService.findAll({
      boardId: boardId ? +boardId : undefined,
      standardId: standardId ? +standardId : undefined,
      subjectId: subjectId ? +subjectId : undefined,
      totalMarks: totalMarks ? +totalMarks : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a pattern by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pattern found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pattern not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.patternService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a pattern' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pattern updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pattern not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatternDto: UpdatePatternDto,
  ) {
    return await this.patternService.update(id, updatePatternDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pattern' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pattern deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pattern not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.patternService.remove(id);
  }
} 