import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, UseGuards } from '@nestjs/common';
import { QuestionTypeService } from './question-type.service';
import { CreateQuestionTypeDto } from './dto/create-question-type.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('question-types')
@Controller('question-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuestionTypeController {
  constructor(private readonly questionTypeService: QuestionTypeService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new question type' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Question type created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createDto: CreateQuestionTypeDto) {
    return await this.questionTypeService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all question types' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all question types' })
  async findAll() {
    return await this.questionTypeService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a question type by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the question type' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Question type not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.questionTypeService.findOne(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a question type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Question type deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Question type not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.questionTypeService.remove(id);
  }
} 