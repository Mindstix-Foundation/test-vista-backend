import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { QuestionTypeService } from './question-type.service';
import { CreateQuestionTypeDto } from './dto/create-question-type.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('question-types')
@Controller('question-types')
export class QuestionTypeController {
  constructor(private readonly questionTypeService: QuestionTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new question type' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Question type created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createDto: CreateQuestionTypeDto) {
    return await this.questionTypeService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all question types' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all question types' })
  async findAll() {
    return await this.questionTypeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question type by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the question type' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Question type not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.questionTypeService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a question type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Question type deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Question type not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.questionTypeService.remove(id);
  }
} 