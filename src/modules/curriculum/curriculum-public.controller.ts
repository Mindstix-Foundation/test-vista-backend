import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BoardService } from '../board/board.service';
import { StandardService } from '../standard/standard.service';
import { SubjectService } from '../subject/subject.service';
import { InstructionMediumService } from '../instruction_medium/instruction-medium.service';

/**
 * Public read-only curriculum catalog for teacher self-registration
 * (board → standards → subjects; mediums optional for create-paper later).
 */
@ApiTags('curriculum')
@Controller('curriculum')
export class CurriculumPublicController {
  constructor(
    private readonly boardService: BoardService,
    private readonly standardService: StandardService,
    private readonly subjectService: SubjectService,
    private readonly instructionMediumService: InstructionMediumService,
  ) {}

  @Get('boards')
  @ApiOperation({
    summary: 'List boards with mapped curriculum (public — teacher registration)',
  })
  @ApiResponse({ status: 200, description: 'Boards that have medium/standard/subject mappings' })
  async boards() {
    return this.boardService.findWithMappedCurriculum();
  }

  @Get('boards/:boardId/standards')
  @ApiOperation({ summary: 'List standards for a board (public)' })
  async standards(@Param('boardId', ParseIntPipe) boardId: number) {
    return this.standardService.findByBoard(boardId);
  }

  @Get('boards/:boardId/standards/:standardId/subjects')
  @ApiOperation({ summary: 'List subjects for a board standard (via medium mappings)' })
  async subjectsForStandard(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('standardId', ParseIntPipe) standardId: number,
  ) {
    return this.subjectService.findByBoardAndStandard(boardId, standardId);
  }

  @Get('boards/:boardId/subjects')
  @ApiOperation({ summary: 'List subjects for a board (public)' })
  async subjects(@Param('boardId', ParseIntPipe) boardId: number) {
    return this.subjectService.findByBoard(boardId);
  }

  @Get('boards/:boardId/mediums')
  @ApiOperation({ summary: 'List instruction mediums for a board (public)' })
  async mediums(@Param('boardId', ParseIntPipe) boardId: number) {
    return this.instructionMediumService.findByBoard(boardId);
  }
}
