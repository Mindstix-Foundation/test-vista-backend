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
  UseGuards,
} from '@nestjs/common';
import { PatternService } from './pattern.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('patterns')
@Controller('patterns')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PatternController {
  constructor(private readonly patternService: PatternService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new pattern' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Pattern created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createPatternDto: CreatePatternDto) {
    return await this.patternService.create(createPatternDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
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
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a pattern by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pattern found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pattern not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.patternService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
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
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a pattern' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pattern deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pattern not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.patternService.remove(id);
  }
} 