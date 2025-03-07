import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { QuestionTextService } from './question-text.service';
import { CreateQuestionTextDto, UpdateQuestionTextDto, QuestionTextFilterDto } from './dto/question-text.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('question-texts')
@Controller('question-texts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuestionTextController {
  constructor(private readonly questionTextService: QuestionTextService) {}

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create a new question text' })
  @ApiResponse({ status: 201, description: 'Question text created successfully' })
  async create(@Body() createDto: CreateQuestionTextDto) {
    return await this.questionTextService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all question texts' })
  @ApiQuery({ name: 'topic_id', required: false, type: Number })
  async findAll(@Query() filters: QuestionTextFilterDto) {
    return await this.questionTextService.findAll(filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get question text by ID' })
  @ApiResponse({ status: 200, description: 'Returns the question text' })
  @ApiResponse({ status: 404, description: 'Question text not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.questionTextService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Update a question text' })
  @ApiResponse({ status: 200, description: 'Question text updated successfully' })
  @ApiResponse({ status: 404, description: 'Question text not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuestionTextDto,
  ) {
    return await this.questionTextService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a question text' })
  @ApiResponse({ status: 200, description: 'Question text deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question text not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.questionTextService.remove(id);
  }
} 