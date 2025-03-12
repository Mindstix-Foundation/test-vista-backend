import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { McqOptionService } from './mcq-option.service';
import { CreateMcqOptionDto } from './dto/create-mcq-option.dto';
import { UpdateMcqOptionDto } from './dto/update-mcq-option.dto';
import { FilterMcqOptionDto } from './dto/filter-mcq-option.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('MCQ Options')
@Controller('mcq-options')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class McqOptionController {
  constructor(private readonly mcqOptionService: McqOptionService) {}

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create a new MCQ option' })
  @ApiBody({
    description: 'MCQ option data',
    type: CreateMcqOptionDto,
    examples: {
      example1: {
        value: {
          question_text_id: 1,
          option_text: "Paris",
          image_id: null,
          is_correct: true
        },
        summary: 'Basic MCQ option'
      },
      example2: {
        value: {
          question_text_id: 2,
          option_text: "Mercury",
          image_id: 5,
          is_correct: false
        },
        summary: 'MCQ option with image'
      }
    }
  })
  @ApiResponse({ status: 201, description: 'The MCQ option has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN or TEACHER role.' })
  create(@Body() createMcqOptionDto: CreateMcqOptionDto) {
    return this.mcqOptionService.create(createMcqOptionDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all MCQ options with optional filtering' })
  @ApiQuery({
    name: 'question_text_id',
    required: false,
    type: Number,
    description: 'Filter options by question text ID'
  })
  @ApiResponse({ status: 200, description: 'Return all MCQ options matching the criteria.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN, TEACHER  role.' })
  findAll(@Query() filters: FilterMcqOptionDto) {
    return this.mcqOptionService.findAll(filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a specific MCQ option by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'MCQ option ID' })
  @ApiResponse({ status: 200, description: 'Return the MCQ option.' })
  @ApiResponse({ status: 404, description: 'MCQ option not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN, TEACHER  role.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mcqOptionService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Update an MCQ option' })
  @ApiParam({ name: 'id', type: 'number', description: 'MCQ option ID' })
  @ApiBody({
    description: 'Updated MCQ option data',
    type: UpdateMcqOptionDto,
    examples: {
      example1: {
        value: {
          option_text: "London",
          is_correct: false
        },
        summary: 'Update text and correctness'
      },
      example2: {
        value: {
          image_id: 10,
          option_text: "Jupiter"
        },
        summary: 'Update image and text'
      }
    }
  })
  @ApiResponse({ status: 200, description: 'The MCQ option has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'MCQ option not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN or TEACHER role.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMcqOptionDto: UpdateMcqOptionDto,
  ) {
    return this.mcqOptionService.update(id, updateMcqOptionDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Delete an MCQ option' })
  @ApiParam({ name: 'id', type: 'number', description: 'MCQ option ID' })
  @ApiResponse({ status: 200, description: 'The MCQ option has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'MCQ option not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN or TEACHER role.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mcqOptionService.remove(id);
  }
} 