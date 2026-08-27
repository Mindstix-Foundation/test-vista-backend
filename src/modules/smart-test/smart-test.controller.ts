import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SmartTestService } from './smart-test.service';
import {
  CreateAspirantSmartTestDto,
  CreateBoardSmartTestDto,
  QuestionOrigin,
} from './dto/smart-test.dto';

@ApiTags('Smart Test')
@ApiBearerAuth()
@Controller('smart-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmartTestController {
  constructor(private readonly smartTestService: SmartTestService) {}

  @Get('context')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get authenticated student Smart Test context' })
  getContext(@Request() req: any) {
    return this.smartTestService.getContext(req.user.id);
  }

  @Get('mine')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'List Smart Tests created by the authenticated student' })
  listMine(@Request() req: any) {
    return this.smartTestService.listMySmartTests(req.user.id);
  }

  @Get('templates')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'List paper templates for an enrolled exam program',
  })
  getTemplates(
    @Request() req: any,
    @Query('exam_program_id') examProgramId: string,
    @Query('exam_stage_id') examStageId?: string,
    @Query('syllabus_node_ids') syllabusNodeIds?: string,
  ) {
    return this.smartTestService.getEnrolledProgramTemplates(
      req.user.id,
      Number.parseInt(examProgramId, 10),
      examStageId ? Number.parseInt(examStageId, 10) : undefined,
      this.parseIdList(syllabusNodeIds || ''),
    );
  }

  @Get('aspirant/availability')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Per-syllabus-section question availability for a paper template',
  })
  getAspirantAvailability(
    @Request() req: any,
    @Query('paper_template_id') paperTemplateId: string,
    @Query('syllabus_node_ids') syllabusNodeIds: string,
  ) {
    return this.smartTestService.getAspirantSectionAvailability(
      req.user.id,
      Number.parseInt(paperTemplateId, 10),
      this.parseIdList(syllabusNodeIds),
    );
  }

  @Get('board/mediums')
  @Roles('STUDENT')
  getBoardMediums(@Request() req: any) {
    return this.smartTestService.getBoardMediums(req.user.id);
  }

  @Get('board/subjects')
  @Roles('STUDENT')
  getBoardSubjects(
    @Request() req: any,
    @Query('medium_ids') mediumIds: string,
  ) {
    const ids = (mediumIds || '')
      .split(',')
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));
    return this.smartTestService.getBoardSubjects(req.user.id, ids);
  }

  @Get('board/chapters')
  @Roles('STUDENT')
  getBoardChapters(
    @Request() req: any,
    @Query('subject_id') subjectId: string,
    @Query('medium_ids') mediumIds?: string,
  ) {
    const ids = (mediumIds || '')
      .split(',')
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));
    return this.smartTestService.getBoardChapters(
      req.user.id,
      Number.parseInt(subjectId, 10),
      ids,
    );
  }

  @Get('board/patterns')
  @Roles('STUDENT')
  getBoardPatterns(
    @Request() req: any,
    @Query('chapter_ids') chapterIds: string,
    @Query('medium_ids') mediumIds: string,
    @Query('question_origin') questionOrigin?: QuestionOrigin,
  ) {
    const chapterIdList = (chapterIds || '')
      .split(',')
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));
    const mediumIdList = (mediumIds || '')
      .split(',')
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));
    return this.smartTestService.getBoardPatterns(
      req.user.id,
      chapterIdList,
      mediumIdList,
      questionOrigin || 'both',
    );
  }

  @Get('board/chapter-marks-range')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Get possible per-chapter mark ranges for a pattern (student-scoped)',
  })
  getBoardChapterMarksRange(
    @Request() req: any,
    @Query('pattern_id') patternId: string,
    @Query('chapter_ids') chapterIds: string,
    @Query('medium_ids') mediumIds: string,
    @Query('question_origin') questionOrigin?: QuestionOrigin,
  ) {
    return this.smartTestService.getBoardChapterMarksRanges(
      req.user.id,
      Number.parseInt(patternId, 10),
      this.parseIdList(chapterIds),
      this.parseIdList(mediumIds),
      questionOrigin || 'both',
    );
  }

  @Get('board/allocation')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Get default equal chapter marks allocation for a pattern (student-scoped)',
  })
  getBoardAllocation(
    @Request() req: any,
    @Query('pattern_id') patternId: string,
    @Query('chapter_ids') chapterIds: string,
    @Query('medium_ids') mediumIds: string,
    @Query('question_origin') questionOrigin?: QuestionOrigin,
  ) {
    return this.smartTestService.getBoardAllocation(
      req.user.id,
      Number.parseInt(patternId, 10),
      this.parseIdList(chapterIds),
      this.parseIdList(mediumIds),
      questionOrigin || 'both',
    );
  }

  @Post('board')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Create a balanced board Smart Test and self-assign it',
  })
  createBoard(@Request() req: any, @Body() dto: CreateBoardSmartTestDto) {
    return this.smartTestService.createBoardSmartTest(req.user.id, dto);
  }

  @Post('aspirant')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Create a balanced exam-program Smart Test and self-assign it',
  })
  createAspirant(@Request() req: any, @Body() dto: CreateAspirantSmartTestDto) {
    return this.smartTestService.createAspirantSmartTest(req.user.id, dto);
  }

  private parseIdList(value: string): number[] {
    return (value || '')
      .split(',')
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));
  }
}
