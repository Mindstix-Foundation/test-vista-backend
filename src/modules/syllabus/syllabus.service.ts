import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSyllabusNodeDto,
  UpdateSyllabusNodeDto,
  SyllabusFilterDto,
  TagQuestionDto,
  BulkTagQuestionsDto,
  CreateSyllabusQuestionDto,
  CreateSyllabusPassageGroupDto,
} from './dto/syllabus.dto';

@Injectable()
export class SyllabusService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the syllabus of a program as a nested tree
   * (root nodes with children populated recursively).
   */
  async getTree(examProgramId: number, examStageId?: number) {
    const nodes = await this.prisma.syllabus_Node.findMany({
      where: {
        exam_program_id: examProgramId,
        ...(examStageId ? { exam_stage_id: examStageId } : {}),
      },
      orderBy: [{ node_type: 'asc' }, { sequence_number: 'asc' }],
      include: {
        _count: { select: { question_links: true, children: true } },
        legacy_subject: { select: { id: true, name: true } },
        legacy_chapter: { select: { id: true, name: true } },
        legacy_topic: { select: { id: true, name: true } },
      },
    });

    const byId = new Map<number, any>();
    const roots: any[] = [];
    for (const node of nodes) {
      byId.set(node.id, { ...node, children: [] });
    }
    for (const node of nodes) {
      const wrapped = byId.get(node.id);
      if (node.parent_id && byId.has(node.parent_id)) {
        byId.get(node.parent_id).children.push(wrapped);
      } else {
        roots.push(wrapped);
      }
    }
    return roots;
  }

  async findNodes(filter: SyllabusFilterDto) {
    return this.prisma.syllabus_Node.findMany({
      where: {
        ...(filter.exam_program_id ? { exam_program_id: filter.exam_program_id } : {}),
        ...(filter.exam_stage_id ? { exam_stage_id: filter.exam_stage_id } : {}),
        ...(filter.node_type ? { node_type: filter.node_type } : {}),
        ...(filter.parent_id === undefined ? {} : { parent_id: filter.parent_id }),
      },
      orderBy: { sequence_number: 'asc' },
      include: { _count: { select: { question_links: true, children: true } } },
    });
  }

  async findNode(id: number) {
    const node = await this.prisma.syllabus_Node.findUnique({
      where: { id },
      include: {
        exam_program: { include: { exam_body: { include: { exam_category: true } } } },
        children: { orderBy: { sequence_number: 'asc' } },
        _count: { select: { question_links: true, children: true } },
      },
    });
    if (!node) throw new NotFoundException(`Syllabus node ${id} not found`);
    return node;
  }

  async createNode(dto: CreateSyllabusNodeDto) {
    if (dto.parent_id) {
      const parent = await this.prisma.syllabus_Node.findUnique({ where: { id: dto.parent_id } });
      if (!parent) throw new NotFoundException(`Parent node ${dto.parent_id} not found`);
      if (parent.exam_program_id !== dto.exam_program_id) {
        throw new BadRequestException('Parent node belongs to a different exam program');
      }
    }
    const siblingCount = await this.prisma.syllabus_Node.count({
      where: {
        exam_program_id: dto.exam_program_id,
        parent_id: dto.parent_id ?? null,
        ...(dto.exam_stage_id ? { exam_stage_id: dto.exam_stage_id } : {}),
      },
    });

    return this.prisma.syllabus_Node.create({
      data: {
        exam_program_id: dto.exam_program_id,
        exam_stage_id: dto.exam_stage_id,
        parent_id: dto.parent_id,
        node_type: dto.node_type,
        name: dto.name,
        sequence_number: dto.sequence_number ?? siblingCount + 1,
      },
    });
  }

  async updateNode(id: number, dto: UpdateSyllabusNodeDto) {
    const node = await this.prisma.syllabus_Node.findUnique({ where: { id } });
    if (!node) throw new NotFoundException(`Syllabus node ${id} not found`);
    if (dto.parent_id === id) throw new BadRequestException('Node cannot be its own parent');
    return this.prisma.syllabus_Node.update({ where: { id }, data: dto });
  }

  async removeNode(id: number) {
    const node = await this.prisma.syllabus_Node.findUnique({ where: { id } });
    if (!node) throw new NotFoundException(`Syllabus node ${id} not found`);
    return this.prisma.syllabus_Node.delete({ where: { id } });
  }

  // ---------- Question tagging ----------
  async tagQuestion(dto: TagQuestionDto) {
    const [question, node] = await Promise.all([
      this.prisma.question.findUnique({ where: { id: dto.question_id } }),
      this.prisma.syllabus_Node.findUnique({ where: { id: dto.syllabus_node_id } }),
    ]);
    if (!question) throw new NotFoundException(`Question ${dto.question_id} not found`);
    if (!node) throw new NotFoundException(`Syllabus node ${dto.syllabus_node_id} not found`);

    const existing = await this.prisma.question_Syllabus_Node.findUnique({
      where: {
        question_id_syllabus_node_id: {
          question_id: dto.question_id,
          syllabus_node_id: dto.syllabus_node_id,
        },
      },
    });
    if (existing) throw new ConflictException('Question is already tagged to this syllabus node');

    return this.prisma.question_Syllabus_Node.create({ data: dto });
  }

  async untagQuestion(questionId: number, syllabusNodeId: number) {
    return this.prisma.question_Syllabus_Node.deleteMany({
      where: { question_id: questionId, syllabus_node_id: syllabusNodeId },
    });
  }

  /** Tags many existing questions to a syllabus node in one call (skips duplicates). */
  async bulkTagQuestions(dto: BulkTagQuestionsDto) {
    const node = await this.prisma.syllabus_Node.findUnique({ where: { id: dto.syllabus_node_id } });
    if (!node) throw new NotFoundException(`Syllabus node ${dto.syllabus_node_id} not found`);

    const result = await this.prisma.question_Syllabus_Node.createMany({
      data: dto.question_ids.map((qid) => ({
        question_id: qid,
        syllabus_node_id: dto.syllabus_node_id,
      })),
      skipDuplicates: true,
    });
    return { tagged: result.count, requested: dto.question_ids.length };
  }

  /**
   * Creates a competitive/entrance question directly under a syllabus node —
   * no board chapter/topic needed. MCQ questions carry options; NAT (NUMERIC)
   * questions store the correct value as a single hidden correct option, which
   * is how the scoring engine reads it.
   */
  async createQuestion(dto: CreateSyllabusQuestionDto) {
    const node = await this.prisma.syllabus_Node.findUnique({ where: { id: dto.syllabus_node_id } });
    if (!node) throw new NotFoundException(`Syllabus node ${dto.syllabus_node_id} not found`);

    const isNat = dto.question_format === 'NUMERIC';
    if (isNat && (dto.numeric_answer === null || dto.numeric_answer === undefined)) {
      throw new BadRequestException('numeric_answer is required for NUMERIC questions');
    }
    if (!isNat) {
      const correct = (dto.options ?? []).filter((o) => o.is_correct);
      if ((dto.options ?? []).length < 2 || correct.length !== 1) {
        throw new BadRequestException('MCQ questions need at least 2 options with exactly one correct');
      }
    }

    const typeName = isNat ? 'Numerical Answer Type (NAT)' : 'Multiple Choice Question (MCQ)';
    const questionType = await this.prisma.question_Type.findFirst({ where: { type_name: typeName } });
    if (!questionType) throw new BadRequestException(`Question type "${typeName}" not seeded`);

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          question_type_id: questionType.id,
          board_question: dto.is_pyq ?? false,
        },
      });

      const questionText = await tx.question_Text.create({
        data: { question_id: question.id, question_text: dto.question_text },
      });

      const options = isNat
        ? [{ text: String(dto.numeric_answer), is_correct: true }]
        : dto.options;
      for (const option of options) {
        await tx.mcq_Option.create({
          data: {
            question_text_id: questionText.id,
            option_text: option.text,
            is_correct: option.is_correct,
          },
        });
      }

      await tx.question_Syllabus_Node.create({
        data: { question_id: question.id, syllabus_node_id: dto.syllabus_node_id },
      });

      return tx.question.findUnique({
        where: { id: question.id },
        include: {
          question_type: true,
          question_texts: { include: { mcq_options: true } },
          syllabus_node_links: { include: { syllabus_node: { select: { id: true, name: true } } } },
        },
      });
    });
  }

  async getNodeQuestions(nodeId: number, includeDescendants = true) {
    const nodeIds = [nodeId];
    if (includeDescendants) {
      // Collect the whole subtree breadth-first
      let frontier = [nodeId];
      while (frontier.length) {
        const children = await this.prisma.syllabus_Node.findMany({
          where: { parent_id: { in: frontier } },
          select: { id: true },
        });
        frontier = children.map((c) => c.id);
        nodeIds.push(...frontier);
      }
    }
    return this.prisma.question.findMany({
      where: { syllabus_node_links: { some: { syllabus_node_id: { in: nodeIds } } } },
      include: {
        question_type: true,
        question_group: {
          select: {
            id: true,
            passage_text: true,
            group_kind: true,
            external_key: true,
          },
        },
        question_texts: { include: { mcq_options: true, image: true } },
        syllabus_node_links: { include: { syllabus_node: { select: { id: true, name: true, node_type: true } } } },
      },
      orderBy: [{ question_group_id: 'asc' }, { group_order: 'asc' }, { id: 'asc' }],
    });
  }

  async createPassageGroup(dto: CreateSyllabusPassageGroupDto) {
    const node = await this.prisma.syllabus_Node.findUnique({ where: { id: dto.syllabus_node_id } });
    if (!node) throw new NotFoundException(`Syllabus node ${dto.syllabus_node_id} not found`);

    if (!dto.children || dto.children.length < 2) {
      throw new BadRequestException('A passage group requires at least 2 linked MCQ children');
    }
    for (const [index, child] of dto.children.entries()) {
      const correct = (child.options ?? []).filter((o) => o.is_correct);
      if ((child.options ?? []).length < 2 || correct.length !== 1) {
        throw new BadRequestException(
          `Child ${index + 1} must be an MCQ with at least 2 options and exactly one correct answer`,
        );
      }
    }

    if (dto.external_key) {
      const existing = await this.prisma.question_Group.findUnique({
        where: { external_key: dto.external_key },
        include: {
          questions: {
            orderBy: { group_order: 'asc' },
            include: {
              question_type: true,
              question_texts: { include: { mcq_options: true } },
              syllabus_node_links: {
                include: { syllabus_node: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });
      if (existing) return existing;
    }

    const questionType = await this.prisma.question_Type.findFirst({
      where: { type_name: 'Multiple Choice Question (MCQ)' },
    });
    if (!questionType) {
      throw new BadRequestException('Question type "Multiple Choice Question (MCQ)" not seeded');
    }

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.question_Group.create({
        data: {
          group_kind: 'PASSAGE_MCQ',
          passage_text: dto.passage_text,
          external_key: dto.external_key,
        },
      });

      for (let i = 0; i < dto.children.length; i++) {
        const child = dto.children[i];
        const question = await tx.question.create({
          data: {
            question_type_id: questionType.id,
            board_question: dto.is_pyq ?? false,
            question_group_id: group.id,
            group_order: child.group_order ?? i + 1,
          },
        });

        const questionText = await tx.question_Text.create({
          data: { question_id: question.id, question_text: child.question_text },
        });

        for (const option of child.options) {
          await tx.mcq_Option.create({
            data: {
              question_text_id: questionText.id,
              option_text: option.text,
              is_correct: option.is_correct,
            },
          });
        }

        await tx.question_Syllabus_Node.create({
          data: { question_id: question.id, syllabus_node_id: dto.syllabus_node_id },
        });
      }

      return tx.question_Group.findUnique({
        where: { id: group.id },
        include: {
          questions: {
            orderBy: { group_order: 'asc' },
            include: {
              question_type: true,
              question_texts: { include: { mcq_options: true } },
              syllabus_node_links: {
                include: { syllabus_node: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });
    });
  }
}
