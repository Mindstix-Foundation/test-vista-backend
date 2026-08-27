import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExamCatalogService } from './exam-catalog.service';
import {
  CreateExamBodyDto,
  UpdateExamBodyDto,
  CreateExamProgramDto,
  UpdateExamProgramDto,
  CreateExamStageDto,
  UpdateExamStageDto,
  ExamCategoryCode,
} from './dto/exam-catalog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('exam-catalog')
@Controller('exam-catalog')
export class ExamCatalogController {
  constructor(private readonly service: ExamCatalogService) {}

  // ---------- Categories ----------
  @Get('categories')
  @ApiOperation({ summary: 'Get all exam categories (BOARD / ENTRANCE / COMPETITIVE)' })
  @ApiResponse({ status: HttpStatus.OK })
  findAllCategories() {
    return this.service.findAllCategories();
  }

  // ---------- Exam bodies ----------
  @Get('bodies')
  @ApiOperation({ summary: 'Get exam bodies, optionally filtered by category' })
  @ApiQuery({ name: 'category', required: false, enum: ExamCategoryCode })
  findAllBodies(@Query('category') category?: ExamCategoryCode) {
    return this.service.findAllBodies(category);
  }

  @Get('bodies/:id')
  @ApiOperation({ summary: 'Get exam body with programs and stages' })
  findBody(@Param('id', ParseIntPipe) id: number) {
    return this.service.findBody(id);
  }

  @Post('bodies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create exam body (UPSC, MPSC, NTA, IBPS...)' })
  createBody(@Body() dto: CreateExamBodyDto) {
    return this.service.createBody(dto);
  }

  @Put('bodies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update exam body' })
  updateBody(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExamBodyDto) {
    return this.service.updateBody(id, dto);
  }

  @Delete('bodies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete exam body' })
  removeBody(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeBody(id);
  }

  // ---------- Exam programs ----------
  @Get('programs')
  @ApiOperation({ summary: 'Get exam programs, filterable by body or category' })
  @ApiQuery({ name: 'exam_body_id', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: ExamCategoryCode })
  findAllPrograms(
    @Query('exam_body_id') examBodyId?: string,
    @Query('category') category?: ExamCategoryCode,
  ) {
    return this.service.findAllPrograms(examBodyId ? Number.parseInt(examBodyId, 10) : undefined, category);
  }

  @Get('programs/:id')
  @ApiOperation({ summary: 'Get exam program with stages and templates' })
  findProgram(@Param('id', ParseIntPipe) id: number) {
    return this.service.findProgram(id);
  }

  @Post('programs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create exam program (UPSC CSE, JEE Main...)' })
  createProgram(@Body() dto: CreateExamProgramDto) {
    return this.service.createProgram(dto);
  }

  @Put('programs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update exam program' })
  updateProgram(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExamProgramDto) {
    return this.service.updateProgram(id, dto);
  }

  @Delete('programs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete exam program' })
  removeProgram(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeProgram(id);
  }

  // ---------- Exam stages ----------
  @Get('programs/:programId/stages')
  @ApiOperation({ summary: 'Get stages of an exam program' })
  findStages(@Param('programId', ParseIntPipe) programId: number) {
    return this.service.findStages(programId);
  }

  @Post('stages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create exam stage (Prelims, Mains, Paper I...)' })
  createStage(@Body() dto: CreateExamStageDto) {
    return this.service.createStage(dto);
  }

  @Put('stages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update exam stage' })
  updateStage(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExamStageDto) {
    return this.service.updateStage(id, dto);
  }

  @Delete('stages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete exam stage' })
  removeStage(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeStage(id);
  }
}
