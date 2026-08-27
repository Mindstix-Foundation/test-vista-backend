import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateExamBodyDto,
  UpdateExamBodyDto,
  CreateExamProgramDto,
  UpdateExamProgramDto,
  CreateExamStageDto,
  UpdateExamStageDto,
  ExamCategoryCode,
} from './dto/exam-catalog.dto';

@Injectable()
export class ExamCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Categories ----------
  async findAllCategories() {
    return this.prisma.exam_Category.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { exam_bodies: true } } },
    });
  }

  // ---------- Exam bodies ----------
  async findAllBodies(category?: ExamCategoryCode) {
    const excludeSchoolBoardMirrors =
      category === ExamCategoryCode.ENTRANCE || category === ExamCategoryCode.COMPETITIVE;

    return this.prisma.exam_Body.findMany({
      where: {
        ...(category ? { exam_category: { code: category } } : {}),
        ...(excludeSchoolBoardMirrors ? { board_id: null } : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        exam_category: true,
        board: { select: { id: true, name: true, abbreviation: true } },
        _count: { select: { exam_programs: true } },
      },
    });
  }

  async findBody(id: number) {
    const body = await this.prisma.exam_Body.findUnique({
      where: { id },
      include: {
        exam_category: true,
        board: { select: { id: true, name: true, abbreviation: true } },
        exam_programs: {
          where: { is_active: true },
          orderBy: { name: 'asc' },
          include: { exam_stages: { orderBy: { sequence_number: 'asc' } } },
        },
      },
    });
    if (!body) throw new NotFoundException(`Exam body ${id} not found`);
    return body;
  }

  async createBody(dto: CreateExamBodyDto) {
    const existing = await this.prisma.exam_Body.findFirst({
      where: { OR: [{ name: dto.name }, { abbreviation: dto.abbreviation }] },
    });
    if (existing) throw new ConflictException('Exam body with this name or abbreviation already exists');
    return this.prisma.exam_Body.create({ data: dto, include: { exam_category: true } });
  }

  async updateBody(id: number, dto: UpdateExamBodyDto) {
    await this.findBody(id);
    return this.prisma.exam_Body.update({ where: { id }, data: dto, include: { exam_category: true } });
  }

  async removeBody(id: number) {
    await this.findBody(id);
    return this.prisma.exam_Body.delete({ where: { id } });
  }

  // ---------- Exam programs ----------
  async findAllPrograms(examBodyId?: number, category?: ExamCategoryCode) {
    return this.prisma.exam_Program.findMany({
      where: {
        ...(examBodyId ? { exam_body_id: examBodyId } : {}),
        ...(category ? { exam_body: { exam_category: { code: category } } } : {}),
        is_active: true,
      },
      orderBy: { name: 'asc' },
      include: {
        exam_body: { include: { exam_category: true } },
        exam_stages: { orderBy: { sequence_number: 'asc' } },
        _count: { select: { paper_templates: true, syllabus_nodes: true } },
      },
    });
  }

  async findProgram(id: number) {
    const program = await this.prisma.exam_Program.findUnique({
      where: { id },
      include: {
        exam_body: { include: { exam_category: true } },
        exam_stages: { orderBy: { sequence_number: 'asc' } },
        paper_templates: {
          where: { is_active: true },
          include: { sections: { orderBy: { sequence_number: 'asc' } } },
        },
      },
    });
    if (!program) throw new NotFoundException(`Exam program ${id} not found`);
    return program;
  }

  async createProgram(dto: CreateExamProgramDto) {
    const existing = await this.prisma.exam_Program.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Exam program with code ${dto.code} already exists`);
    return this.prisma.exam_Program.create({ data: dto, include: { exam_body: true } });
  }

  async updateProgram(id: number, dto: UpdateExamProgramDto) {
    await this.findProgram(id);
    return this.prisma.exam_Program.update({ where: { id }, data: dto, include: { exam_body: true } });
  }

  async removeProgram(id: number) {
    await this.findProgram(id);
    return this.prisma.exam_Program.delete({ where: { id } });
  }

  // ---------- Exam stages ----------
  async findStages(examProgramId: number) {
    return this.prisma.exam_Stage.findMany({
      where: { exam_program_id: examProgramId },
      orderBy: { sequence_number: 'asc' },
      include: { standard: { select: { id: true, name: true } } },
    });
  }

  async createStage(dto: CreateExamStageDto) {
    return this.prisma.exam_Stage.create({ data: dto });
  }

  async updateStage(id: number, dto: UpdateExamStageDto) {
    const stage = await this.prisma.exam_Stage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException(`Exam stage ${id} not found`);
    return this.prisma.exam_Stage.update({ where: { id }, data: dto });
  }

  async removeStage(id: number) {
    const stage = await this.prisma.exam_Stage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException(`Exam stage ${id} not found`);
    return this.prisma.exam_Stage.delete({ where: { id } });
  }
}
