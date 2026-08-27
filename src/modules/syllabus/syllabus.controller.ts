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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SyllabusService } from './syllabus.service';
import { SyllabusBridgeService } from './syllabus-bridge.service';
import {
  CreateSyllabusNodeDto,
  UpdateSyllabusNodeDto,
  SyllabusFilterDto,
  TagQuestionDto,
  BulkTagQuestionsDto,
  CreateSyllabusQuestionDto,
  CreateSyllabusPassageGroupDto,
} from './dto/syllabus.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('syllabus')
@Controller('syllabus')
export class SyllabusController {
  constructor(
    private readonly service: SyllabusService,
    private readonly bridge: SyllabusBridgeService,
  ) {}

  @Get('tree/:programId')
  @ApiOperation({ summary: 'Get syllabus of an exam program as a nested tree' })
  @ApiQuery({ name: 'exam_stage_id', required: false, type: Number })
  getTree(
    @Param('programId', ParseIntPipe) programId: number,
    @Query('exam_stage_id') examStageId?: string,
  ) {
    return this.service.getTree(programId, examStageId ? Number.parseInt(examStageId, 10) : undefined);
  }

  @Get('nodes')
  @ApiOperation({ summary: 'Get syllabus nodes (flat) with filters' })
  findNodes(@Query() filter: SyllabusFilterDto) {
    return this.service.findNodes(filter);
  }

  @Get('nodes/by-chapter/:chapterId')
  @ApiOperation({ summary: 'Get exam syllabus nodes mapped to a board chapter' })
  findNodesByChapter(@Param('chapterId', ParseIntPipe) chapterId: number) {
    return this.bridge.findNodesByChapter(chapterId);
  }

  @Get('nodes/by-topic/:topicId')
  @ApiOperation({ summary: 'Get exam syllabus nodes mapped to a board topic' })
  findNodesByTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.bridge.findNodesByTopic(topicId);
  }

  @Get('nodes/:id')
  @ApiOperation({ summary: 'Get a single syllabus node with children' })
  findNode(@Param('id', ParseIntPipe) id: number) {
    return this.service.findNode(id);
  }

  @Post('nodes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create syllabus node (section/subject/chapter/topic)' })
  createNode(@Body() dto: CreateSyllabusNodeDto) {
    return this.service.createNode(dto);
  }

  @Put('nodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Update syllabus node' })
  updateNode(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSyllabusNodeDto) {
    return this.service.updateNode(id, dto);
  }

  @Delete('nodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete syllabus node (cascades to children)' })
  removeNode(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeNode(id);
  }

  // ---------- Question tagging ----------
  @Post('tag-question')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Tag a question to a syllabus node (cross-exam reuse)' })
  tagQuestion(@Body() dto: TagQuestionDto) {
    return this.service.tagQuestion(dto);
  }

  @Delete('tag-question/:questionId/:nodeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Remove question tag from syllabus node' })
  untagQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Param('nodeId', ParseIntPipe) nodeId: number,
  ) {
    return this.service.untagQuestion(questionId, nodeId);
  }

  @Post('tag-questions/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Tag multiple questions to a syllabus node at once' })
  bulkTagQuestions(@Body() dto: BulkTagQuestionsDto) {
    return this.service.bulkTagQuestions(dto);
  }

  @Post('questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({
    summary: 'Create a competitive/entrance question (MCQ or NAT) under a syllabus node',
  })
  createQuestion(@Body() dto: CreateSyllabusQuestionDto) {
    return this.service.createQuestion(dto);
  }

  @Post('passage-groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({
    summary: 'Create a passage-linked MCQ group under a syllabus node (2+ child MCQs)',
  })
  createPassageGroup(@Body() dto: CreateSyllabusPassageGroupDto) {
    return this.service.createPassageGroup(dto);
  }

  @Get('nodes/:id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get questions tagged to a node (and its subtree)' })
  @ApiQuery({ name: 'include_descendants', required: false, type: Boolean })
  getNodeQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Query('include_descendants') includeDescendants?: string,
  ) {
    return this.service.getNodeQuestions(id, includeDescendants !== 'false');
  }
}
