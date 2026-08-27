import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePaperTemplateDto,
  UpdatePaperTemplateDto,
  PaperTemplateFilterDto,
  CreateMockTestDto,
} from './dto/paper-template.dto';
import { shuffledCopy } from '../../common/utils/secure-random.util';

const MCQ_QUESTION_TYPE_NAME = 'Multiple Choice Question (MCQ)';
const NAT_QUESTION_TYPE_NAME = 'Numerical Answer Type (NAT)';

type MockTestPickedQuestion = {
  question_id: number;
  question_text_id: number;
  question_group_id: number | null;
  group_order: number | null;
};

type MockTestQuestionUnit = {
  size: number;
  questions: MockTestPickedQuestion[];
};

type MockTestSectionPlan = {
  sectionId: number;
  marksPerQuestion: number;
  picked: MockTestPickedQuestion[];
};

@Injectable()
export class PaperTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async filter(filter: PaperTemplateFilterDto) {
    return this.prisma.paper_Template.findMany({
      where: {
        is_active: true,
        ...(filter.exam_program_id ? { exam_program_id: filter.exam_program_id } : {}),
        ...(filter.exam_stage_id ? { exam_stage_id: filter.exam_stage_id } : {}),
        ...(filter.delivery_mode ? { delivery_mode: filter.delivery_mode as any } : {}),
        ...(filter.total_marks ? { total_marks: filter.total_marks } : {}),
        ...(filter.category
          ? { exam_program: { exam_body: { exam_category: { code: filter.category as any } } } }
          : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        exam_program: { include: { exam_body: { include: { exam_category: true } } } },
        exam_stage: true,
        sections: {
          orderBy: { sequence_number: 'asc' },
          include: {
            question_types: { include: { question_type: true } },
            syllabus_node: { select: { id: true, name: true, node_type: true } },
          },
        },
      },
    });
  }

  async uniqueMarks(filter: PaperTemplateFilterDto) {
    const templates = await this.prisma.paper_Template.findMany({
      where: {
        is_active: true,
        ...(filter.exam_program_id ? { exam_program_id: filter.exam_program_id } : {}),
        ...(filter.exam_stage_id ? { exam_stage_id: filter.exam_stage_id } : {}),
        ...(filter.delivery_mode ? { delivery_mode: filter.delivery_mode as any } : {}),
      },
      select: { total_marks: true },
      distinct: ['total_marks'],
      orderBy: { total_marks: 'asc' },
    });
    return templates.map((t) => t.total_marks);
  }

  async findOne(id: number) {
    const template = await this.prisma.paper_Template.findUnique({
      where: { id },
      include: {
        exam_program: { include: { exam_body: { include: { exam_category: true } } } },
        exam_stage: true,
        legacy_pattern: true,
        sections: {
          orderBy: { sequence_number: 'asc' },
          include: {
            question_types: { include: { question_type: true } },
            syllabus_node: { select: { id: true, name: true, node_type: true } },
          },
        },
      },
    });
    if (!template) throw new NotFoundException(`Paper template ${id} not found`);
    return template;
  }

  async create(dto: CreatePaperTemplateDto) {
    const existing = await this.prisma.paper_Template.findUnique({
      where: {
        exam_program_id_name: { exam_program_id: dto.exam_program_id, name: dto.name },
      },
    });
    if (existing) throw new ConflictException('A template with this name already exists for this program');

    const { sections, ...templateData } = dto;
    return this.prisma.$transaction(async (tx) => {
      const template = await tx.paper_Template.create({
        data: {
          ...templateData,
          delivery_mode: (templateData.delivery_mode as any) ?? 'ONLINE_MCQ',
        },
      });
      for (const section of sections) {
        const { question_type_ids, ...sectionData } = section;
        const created = await tx.template_Section.create({
          data: {
            ...sectionData,
            answer_format: (sectionData.answer_format as any) ?? 'MCQ',
            paper_template_id: template.id,
          },
        });
        if (question_type_ids?.length) {
          await tx.template_Section_Question_Type.createMany({
            data: question_type_ids.map((qtId, i) => ({
              template_section_id: created.id,
              question_type_id: qtId,
              sequence_number: i + 1,
            })),
          });
        }
      }
      return tx.paper_Template.findUnique({
        where: { id: template.id },
        include: { sections: { include: { question_types: true } } },
      });
    });
  }

  async update(id: number, dto: UpdatePaperTemplateDto) {
    await this.findOne(id);
    const { sections, ...templateData } = dto;

    if (!sections?.length) {
      return this.prisma.paper_Template.update({
        where: { id },
        data: templateData,
        include: {
          sections: {
            orderBy: { sequence_number: 'asc' },
            include: { question_types: { include: { question_type: true } } },
          },
        },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.template_Section.deleteMany({ where: { paper_template_id: id } });
      await tx.paper_Template.update({ where: { id }, data: templateData });

      for (const section of sections) {
        const { question_type_ids, ...sectionData } = section;
        const created = await tx.template_Section.create({
          data: {
            ...sectionData,
            answer_format: (sectionData.answer_format as any) ?? 'MCQ',
            paper_template_id: id,
          },
        });
        if (question_type_ids?.length) {
          await tx.template_Section_Question_Type.createMany({
            data: question_type_ids.map((qtId, i) => ({
              template_section_id: created.id,
              question_type_id: qtId,
              sequence_number: i + 1,
            })),
          });
        }
      }

      return tx.paper_Template.findUnique({
        where: { id },
        include: {
          sections: {
            orderBy: { sequence_number: 'asc' },
            include: { question_types: { include: { question_type: true } } },
          },
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.paper_Template.delete({ where: { id } });
  }

  /**
   * Creates an online mock Test_Paper from a paper template (Option C flow).
   * Draws MCQ/NAT questions tagged to the program's syllabus nodes,
   * freezes them into Test_Paper_Question rows section by section.
   * No school is required — competitive/entrance mocks are program-scoped.
   */
  async createMockTest(userId: number, dto: CreateMockTestDto) {
    const template = await this.findOne(dto.paper_template_id);
    const allNodeIds = await this.resolveMockTestNodeIds(template, dto);
    const usedAcrossSections = new Set<number>();
    const sectionPlans = await this.buildMockTestSectionPlans(
      template,
      allNodeIds,
      usedAcrossSections,
    );

    const negativePerQuestion = null;

    return this.persistMockTestPaper(userId, dto, template, sectionPlans, negativePerQuestion);
  }

  private async resolveMockTestNodeIds(
    template: Awaited<ReturnType<PaperTemplateService['findOne']>>,
    dto: CreateMockTestDto,
  ): Promise<number[]> {
    const rootNodeIds = dto.syllabus_node_ids?.length
      ? dto.syllabus_node_ids
      : (
          await this.prisma.syllabus_Node.findMany({
            where: {
              exam_program_id: template.exam_program_id,
              parent_id: null,
              ...(template.exam_stage_id ? { exam_stage_id: template.exam_stage_id } : {}),
            },
            select: { id: true },
          })
        ).map((n) => n.id);

    const allNodeIds = [...rootNodeIds];
    let frontier = [...rootNodeIds];
    while (frontier.length) {
      const children = await this.prisma.syllabus_Node.findMany({
        where: { parent_id: { in: frontier } },
        select: { id: true },
      });
      frontier = children.map((c) => c.id);
      allNodeIds.push(...frontier);
    }
    return allNodeIds;
  }

  private async questionTypeIdForFormat(format: string): Promise<number | undefined> {
    const typeName = format === 'NUMERIC' ? NAT_QUESTION_TYPE_NAME : MCQ_QUESTION_TYPE_NAME;
    const qt = await this.prisma.question_Type.findFirst({ where: { type_name: typeName } });
    return qt?.id;
  }

  private async buildMockTestSectionPlans(
    template: Awaited<ReturnType<PaperTemplateService['findOne']>>,
    allNodeIds: number[],
    usedAcrossSections: Set<number>,
  ): Promise<MockTestSectionPlan[]> {
    const sectionPlans: MockTestSectionPlan[] = [];
    for (const section of template.sections) {
      sectionPlans.push(
        await this.planMockTestSection(section, template, allNodeIds, usedAcrossSections),
      );
    }
    return sectionPlans;
  }

  private async planMockTestSection(
    section: Awaited<ReturnType<PaperTemplateService['findOne']>>['sections'][number],
    template: Awaited<ReturnType<PaperTemplateService['findOne']>>,
    allNodeIds: number[],
    usedAcrossSections: Set<number>,
  ): Promise<MockTestSectionPlan> {
    const typeId = await this.questionTypeIdForFormat(section.answer_format);
    if (!typeId) {
      throw new BadRequestException(`Question type for format ${section.answer_format} not found`);
    }

    const sectionNodeIds = section.syllabus_node_id
      ? await this.collectSubtree(section.syllabus_node_id)
      : allNodeIds;

    const pool = await this.prisma.question.findMany({
      where: {
        question_type_id: typeId,
        syllabus_node_links: { some: { syllabus_node_id: { in: sectionNodeIds } } },
      },
      select: {
        id: true,
        question_group_id: true,
        group_order: true,
        question_texts: { select: { id: true }, take: 1 },
      },
    });

    const usable = pool.filter(
      (q) => q.question_texts.length > 0 && !usedAcrossSections.has(q.id),
    );
    const units = await this.buildQuestionUnitsFromPool(usable, usedAcrossSections);
    const shuffledUnits = shuffledCopy(units);
    const { picked, remaining } = this.pickQuestionsForSection(
      shuffledUnits,
      section.total_questions,
      usedAcrossSections,
    );

    if (remaining > 0) {
      this.throwInsufficientSectionQuestions(section, template, remaining);
    }

    return {
      sectionId: section.id,
      marksPerQuestion: section.marks_per_question,
      picked,
    };
  }

  private async buildQuestionUnitsFromPool(
    usable: {
      id: number;
      question_group_id: number | null;
      question_texts: { id: number }[];
    }[],
    usedAcrossSections: Set<number>,
  ): Promise<MockTestQuestionUnit[]> {
    const units: MockTestQuestionUnit[] = [];
    const seenGroups = new Set<number>();

    for (const q of usable) {
      if (!q.question_group_id) {
        units.push({
          size: 1,
          questions: [
            {
              question_id: q.id,
              question_text_id: q.question_texts[0].id,
              question_group_id: null,
              group_order: null,
            },
          ],
        });
        continue;
      }
      if (seenGroups.has(q.question_group_id)) continue;
      seenGroups.add(q.question_group_id);

      const groupUnit = await this.buildPassageGroupUnit(q.question_group_id, usedAcrossSections);
      if (groupUnit) {
        units.push(groupUnit);
      }
    }
    return units;
  }

  private async buildPassageGroupUnit(
    questionGroupId: number,
    usedAcrossSections: Set<number>,
  ): Promise<MockTestQuestionUnit | null> {
    const siblings = await this.prisma.question.findMany({
      where: { question_group_id: questionGroupId },
      orderBy: { group_order: 'asc' },
      select: {
        id: true,
        group_order: true,
        question_texts: { select: { id: true }, take: 1 },
      },
    });
    if (
      siblings.length < 2 ||
      siblings.some((s) => usedAcrossSections.has(s.id) || !s.question_texts.length)
    ) {
      return null;
    }
    return {
      size: siblings.length,
      questions: siblings.map((s) => ({
        question_id: s.id,
        question_text_id: s.question_texts[0].id,
        question_group_id: questionGroupId,
        group_order: s.group_order,
      })),
    };
  }

  private pickQuestionsForSection(
    shuffledUnits: MockTestQuestionUnit[],
    totalQuestions: number,
    usedAcrossSections: Set<number>,
  ): { picked: MockTestPickedQuestion[]; remaining: number } {
    const picked: MockTestPickedQuestion[] = [];
    let remaining = totalQuestions;
    for (const unit of shuffledUnits) {
      if (unit.size > remaining) continue;
      if (unit.questions.some((q) => usedAcrossSections.has(q.question_id))) continue;
      picked.push(...unit.questions);
      for (const q of unit.questions) {
        usedAcrossSections.add(q.question_id);
      }
      remaining -= unit.size;
      if (remaining <= 0) break;
    }
    return { picked, remaining };
  }

  private throwInsufficientSectionQuestions(
    section: Awaited<ReturnType<PaperTemplateService['findOne']>>['sections'][number],
    template: Awaited<ReturnType<PaperTemplateService['findOne']>>,
    remaining: number,
  ): never {
    const programName = template.exam_program?.name ?? `program #${template.exam_program_id}`;
    const stageName = template.exam_stage?.name ? ` / ${template.exam_stage.name}` : '';
    throw new BadRequestException(
      `Not enough ${section.answer_format} questions for section "${section.name}" ` +
        `(${programName}${stageName}): need ${section.total_questions}, ` +
        `could only fill ${section.total_questions - remaining} while keeping ` +
        `passage-linked MCQs together. Tag more questions or adjust section size.`,
    );
  }

  private persistMockTestPaper(
    userId: number,
    dto: CreateMockTestDto,
    template: Awaited<ReturnType<PaperTemplateService['findOne']>>,
    sectionPlans: MockTestSectionPlan[],
    negativePerQuestion: number | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const testPaper = await tx.test_Paper.create({
        data: {
          name: dto.name,
          user_id: userId,
          exam_program_id: template.exam_program_id,
          exam_stage_id: template.exam_stage_id,
          paper_template_id: template.id,
          delivery_mode: template.delivery_mode,
          is_online: true,
          duration_minutes: template.duration_minutes,
          instructions: dto.instructions,
          negative_marking: template.negative_marking,
          negative_marks_per_question: negativePerQuestion,
          randomize_questions: dto.randomize_questions ?? true,
          randomize_options: dto.randomize_options ?? true,
          is_open_practice: false,
          creation_mode: 'TEACHER_CREATED',
        },
      });

      let order = 1;
      for (const plan of sectionPlans) {
        order = await this.persistMockTestSectionQuestions(
          tx,
          testPaper,
          plan,
          template,
          order,
        );
      }

      return tx.test_Paper.findUnique({
        where: { id: testPaper.id },
        include: {
          exam_program: { include: { exam_body: true } },
          exam_stage: true,
          paper_template: { include: { sections: true } },
          _count: { select: { test_paper_questions: true } },
        },
      });
    });
  }

  private async persistMockTestSectionQuestions(
    tx: any,
    testPaper: { id: number; negative_marks_per_question: number | null },
    plan: MockTestSectionPlan,
    template: Awaited<ReturnType<PaperTemplateService['findOne']>>,
    order: number,
  ): Promise<number> {
    const section = template.sections.find((s) => s.id === plan.sectionId);
    const sectionNegative =
      section?.negative_marks_per_question ??
      (template.negative_marking && template.negative_marks_ratio
        ? Math.round(plan.marksPerQuestion * template.negative_marks_ratio * 100) / 100
        : null);

    for (const q of plan.picked) {
      await tx.test_Paper_Question.create({
        data: {
          test_paper_id: testPaper.id,
          question_id: q.question_id,
          question_text_id: q.question_text_id,
          section_id: plan.sectionId,
          subsection_id: plan.sectionId,
          question_order: order++,
          marks: plan.marksPerQuestion,
          question_group_id: q.question_group_id,
          group_order: q.group_order,
        },
      });
    }

    if (sectionNegative !== null && testPaper.negative_marks_per_question === null) {
      await tx.test_Paper.update({
        where: { id: testPaper.id },
        data: { negative_marks_per_question: sectionNegative },
      });
    }
    return order;
  }

  private async collectSubtree(rootId: number): Promise<number[]> {
    const ids = [rootId];
    let frontier = [rootId];
    while (frontier.length) {
      const children = await this.prisma.syllabus_Node.findMany({
        where: { parent_id: { in: frontier } },
        select: { id: true },
      });
      frontier = children.map((c) => c.id);
      ids.push(...frontier);
    }
    return ids;
  }
}
