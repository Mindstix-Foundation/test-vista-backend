import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestPaperService } from '../create_test_paper/create-test-paper.service';
import { ChapterMarksDistributionService } from '../chapter-marks-distribution/chapter-marks-distribution.service';
import { ChapterMarksRangeService } from '../chapter-marks-range/chapter-marks-range.service';
import { PaperTemplateService } from '../paper-template/paper-template.service';
import {
  CreateAspirantSmartTestDto,
  CreateBoardSmartTestDto,
  QuestionOrigin,
  SmartTestChapterMarksDto,
} from './dto/smart-test.dto';
import { randomHexToken } from '../../common/utils/secure-random.util';

const SMART_TEST_POLICY = 'balanced_v1';
const MCQ_QUESTION_TYPE_NAME = 'Multiple Choice Question (MCQ)';
const NAT_QUESTION_TYPE_NAME = 'Numerical Answer Type (NAT)';

@Injectable()
export class SmartTestService {
  private readonly logger = new Logger(SmartTestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly createTestPaperService: CreateTestPaperService,
    private readonly chapterMarksDistributionService: ChapterMarksDistributionService,
    private readonly chapterMarksRangeService: ChapterMarksRangeService,
    private readonly paperTemplateService: PaperTemplateService,
  ) {}

  async getContext(userId: number) {
    const student = await this.resolveStudent(userId);
    const isAspirant = !!student.participant && student.participant.participant_type === 'ASPIRANT';

    const enrolledPrograms =
      student.participant?.participant_programs.map((pp) => ({
        id: pp.exam_program_id,
        name: pp.exam_program.name,
        category: pp.exam_program.exam_body?.exam_category?.code ?? null,
        abbreviation: pp.exam_program.exam_body?.abbreviation ?? null,
      })) ?? [];

    return {
      student_id: student.id,
      is_aspirant: isAspirant,
      school: {
        id: student.school_standard.school.id,
        name: student.school_standard.school.name,
        board_id: student.school_standard.school.board_id,
        board_name: student.school_standard.school.board?.name ?? null,
      },
      standard: {
        id: student.school_standard.standard.id,
        name: student.school_standard.standard.name,
      },
      enrolled_programs: enrolledPrograms,
    };
  }

  async getEnrolledProgramTemplates(
    userId: number,
    examProgramId: number,
    examStageId?: number,
    syllabusNodeIds: number[] = [],
  ) {
    const student = await this.resolveStudent(userId);
    const enrolled = student.participant?.participant_programs.some(
      (pp) => pp.exam_program_id === examProgramId,
    );
    if (!enrolled) {
      throw new BadRequestException('You are not enrolled in this exam program');
    }

    const templates = await this.paperTemplateService.filter({
      exam_program_id: examProgramId,
      exam_stage_id: examStageId,
      delivery_mode: undefined,
    } as any);

    if (!syllabusNodeIds.length) return templates;

    const selectedRootIds = [...new Set(syllabusNodeIds)];
    const selectedNodes = await this.prisma.syllabus_Node.findMany({
      where: {
        id: { in: selectedRootIds },
        exam_program_id: examProgramId,
        ...(examStageId ? { exam_stage_id: examStageId } : {}),
      },
      select: { id: true },
    });
    if (selectedNodes.length !== selectedRootIds.length) {
      throw new BadRequestException(
        'One or more selected syllabus sections do not belong to this exam program or stage',
      );
    }

    const compatibility = await Promise.all(
      templates.map(async (template) => ({
        template,
        compatible: await this.templateSupportsSyllabus(template, selectedRootIds),
      })),
    );
    return compatibility.filter((result) => result.compatible).map((result) => result.template);
  }

  async getBoardMediums(userId: number) {
    const student = await this.resolveStudent(userId);
    this.assertBoardSmartTestEligible(student);
    const rows = await this.prisma.school_Instruction_Medium.findMany({
      where: { school_id: student.school_standard.school_id },
      include: { instruction_medium: true },
    });
    return rows.map((r) => ({
      id: r.instruction_medium_id,
      name: r.instruction_medium.instruction_medium,
    }));
  }

  async getBoardSubjects(userId: number, mediumIds: number[]) {
    const student = await this.resolveStudent(userId);
    if (!mediumIds?.length) return [];

    const mediumStandardSubjects = await this.prisma.medium_Standard_Subject.findMany({
      where: {
        standard_id: student.school_standard.standard_id,
        instruction_medium_id: { in: mediumIds },
      },
      include: { subject: true },
    });

    // Subjects common to all selected mediums
    const counts = new Map<number, { id: number; name: string; count: number }>();
    for (const row of mediumStandardSubjects) {
      const existing = counts.get(row.subject_id);
      if (existing) existing.count += 1;
      else counts.set(row.subject_id, { id: row.subject_id, name: row.subject.name, count: 1 });
    }

    return [...counts.values()]
      .filter((s) => s.count >= mediumIds.length)
      .map(({ id, name }) => ({ id, name }));
  }

  async getBoardChapters(userId: number, subjectId: number, _mediumIds: number[]) {
    const student = await this.resolveStudent(userId);
    const chapters = await this.prisma.chapter.findMany({
      where: {
        subject_id: subjectId,
        standard_id: student.school_standard.standard_id,
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return chapters;
  }

  async getBoardPatterns(
    userId: number,
    chapterIds: number[],
    _mediumIds: number[],
    _questionOrigin: QuestionOrigin = 'both',
  ) {
    const student = await this.resolveStudent(userId);
    if (!chapterIds?.length) return { validPatterns: [] };

    const chapters = await this.prisma.chapter.findMany({
      where: {
        id: { in: chapterIds },
        standard_id: student.school_standard.standard_id,
      },
      select: { id: true, subject_id: true, standard_id: true },
    });
    if (chapters.length !== chapterIds.length) {
      throw new BadRequestException('One or more chapters do not belong to your standard');
    }

    const subjectIds = [...new Set(chapters.map((c) => c.subject_id))];
    const patterns = await this.prisma.pattern.findMany({
      where: {
        standard_id: student.school_standard.standard_id,
        subject_id: { in: subjectIds },
      },
      select: {
        id: true,
        pattern_name: true,
        total_marks: true,
      },
      orderBy: { pattern_name: 'asc' },
    });

    // Soft filter: return patterns; availability is enforced during generation
    return {
      validPatterns: patterns.map((p) => ({
        id: p.id,
        pattern_name: p.pattern_name,
        total_marks: p.total_marks,
      })),
    };
  }

  async getBoardChapterMarksRanges(
    userId: number,
    patternId: number,
    chapterIds: number[],
    mediumIds: number[],
    questionOrigin: QuestionOrigin = 'both',
  ) {
    await this.validateStudentChapters(userId, chapterIds);
    return this.chapterMarksRangeService.getChapterMarksRanges({
      patternId,
      chapterIds,
      mediumIds,
      questionOrigin,
    });
  }

  async getBoardAllocation(
    userId: number,
    patternId: number,
    chapterIds: number[],
    mediumIds: number[],
    questionOrigin: QuestionOrigin = 'both',
  ) {
    await this.validateStudentChapters(userId, chapterIds);
    const allocation = await this.createTestPaperService.getTestPaperAllocation({
      patternId,
      chapterIds,
      mediumIds,
      questionOrigin,
    });
    return {
      patternId: allocation.patternId,
      patternName: allocation.patternName,
      totalMarks: allocation.totalMarks,
      chapterMarks: (allocation.chapterMarks as any[])?.map((c) => ({
        chapterId: c.chapterId,
        chapterName: c.chapterName,
        absoluteMarks: c.absoluteMarks,
      })),
    };
  }

  private async validateStudentChapters(userId: number, chapterIds: number[]) {
    const student = await this.resolveStudent(userId);
    if (!chapterIds?.length) {
      throw new BadRequestException('At least one chapter is required');
    }
    const chapters = await this.prisma.chapter.findMany({
      where: {
        id: { in: chapterIds },
        standard_id: student.school_standard.standard_id,
      },
      select: { id: true },
    });
    if (chapters.length !== chapterIds.length) {
      throw new BadRequestException('One or more chapters do not belong to your standard');
    }
    return student;
  }

  async listMySmartTests(userId: number) {
    const student = await this.resolveStudent(userId);

    const assignments = await this.prisma.test_Assignment.findMany({
      where: {
        student_id: student.id,
        assignment_source: 'SELF_SMART',
        test_paper: { creation_mode: 'STUDENT_SMART' },
      },
      orderBy: { created_at: 'desc' },
      include: {
        test_paper: {
          include: {
            pattern: {
              include: {
                subject: { select: { id: true, name: true } },
                standard: { select: { id: true, name: true } },
              },
            },
            exam_program: {
              select: {
                id: true,
                name: true,
                exam_body: { select: { abbreviation: true } },
              },
            },
            exam_stage: { select: { name: true } },
            paper_template: { select: { total_marks: true } },
            _count: { select: { test_paper_questions: true } },
          },
        },
        test_attempts: {
          select: { id: true, status: true, attempt_number: true },
          orderBy: { attempt_number: 'desc' },
        },
      },
    });

    return assignments.map((a) => {
      const completed = a.test_attempts.filter((t) => t.status === 'completed');
      const completedCount = completed.length;
      const inProgress = a.test_attempts.find((t) => t.status === 'in_progress');
      const latestCompleted = completed[0] ?? null;
      return {
        assignment_id: a.id,
        test_paper_id: a.test_paper_id,
        title: a.test_paper.name,
        duration_minutes: a.test_paper.duration_minutes,
        total_questions: a.test_paper._count.test_paper_questions,
        total_marks:
          a.test_paper.paper_template?.total_marks ??
          a.test_paper.pattern?.total_marks ??
          0,
        subject: a.test_paper.pattern?.subject?.name ?? null,
        standard: a.test_paper.pattern?.standard?.name ?? null,
        exam_program: a.test_paper.exam_program?.name ?? null,
        exam_body: a.test_paper.exam_program?.exam_body?.abbreviation ?? null,
        exam_stage: a.test_paper.exam_stage?.name ?? null,
        status: a.status,
        available_from: a.available_from,
        due_date: a.due_date,
        max_attempts: a.max_attempts,
        attempts_used: completedCount,
        in_progress_attempt_id: inProgress?.id ?? null,
        latest_completed_attempt_id: latestCompleted?.id ?? null,
        can_start: completedCount < a.max_attempts,
        created_at: a.created_at,
      };
    });
  }

  private assertBoardSmartTestEligible(student: any) {
    if (student.participant?.participant_type === 'ASPIRANT') {
      const schoolName = student.school_standard.school.name?.toLowerCase() ?? '';
      if (schoolName.includes('open learning')) {
        throw new BadRequestException(
          'Board Smart Tests are for school students. Use an exam-program Smart Test instead.',
        );
      }
    }
  }

  private assertBoardSmartTestDtoBasics(dto: CreateBoardSmartTestDto) {
    if (!dto.medium_ids?.length) {
      throw new BadRequestException('At least one instruction medium is required');
    }
    if (!dto.chapter_ids?.length) {
      throw new BadRequestException('At least one chapter is required');
    }
  }

  private async loadValidatedBoardPattern(dto: CreateBoardSmartTestDto, standardId: number) {
    const pattern = await this.prisma.pattern.findUnique({
      where: { id: dto.pattern_id },
      include: {
        sections: {
          include: {
            subsection_question_types: { include: { question_type: true } },
          },
        },
        subject: true,
        standard: true,
      },
    });
    if (!pattern) throw new BadRequestException('Pattern not found');
    if (pattern.standard_id !== standardId) {
      throw new BadRequestException('Pattern does not match your standard');
    }
    if (pattern.subject_id !== dto.subject_id) {
      throw new BadRequestException('Pattern does not match the selected subject');
    }
    return pattern;
  }

  private async assertBoardSmartTestChapters(dto: CreateBoardSmartTestDto) {
    const chapters = await this.prisma.chapter.findMany({
      where: { id: { in: dto.chapter_ids }, subject_id: dto.subject_id },
      select: { id: true, name: true },
    });
    if (chapters.length !== dto.chapter_ids.length) {
      throw new BadRequestException('One or more chapters are invalid for the selected subject');
    }
  }

  private assertBoardChapterMarks(
    chapterMarks: SmartTestChapterMarksDto[],
    chapterIds: number[],
    pattern: any,
  ) {
    const markedIds = chapterMarks.map((c) => c.chapter_id).sort((a, b) => a - b);
    const requestedIds = [...chapterIds].sort((a, b) => a - b);
    if (
      markedIds.length !== requestedIds.length ||
      markedIds.some((id, i) => id !== requestedIds[i])
    ) {
      throw new BadRequestException('Chapter marks must cover exactly the selected chapters');
    }
    const requestedTotal = chapterMarks.reduce((sum, c) => sum + c.marks, 0);
    if (pattern.total_marks && requestedTotal !== pattern.total_marks) {
      throw new BadRequestException(
        `Chapter marks must add up to the pattern total (${pattern.total_marks})`,
      );
    }
  }

  private assertAllocationResult(allocation: any) {
    if (allocation.error || allocation.hasError) {
      throw new BadRequestException(
        allocation.message ||
          allocation.error ||
          'Could not distribute marks across the selected chapters. Adjust the weightage and try again.',
      );
    }
  }

  private async resolveBoardSmartTestAllocation(dto: CreateBoardSmartTestDto, pattern: any) {
    if (dto.chapter_marks?.length) {
      this.assertBoardChapterMarks(dto.chapter_marks, dto.chapter_ids, pattern);
      const chapterMarks = dto.chapter_marks;
      const allocation = await this.chapterMarksDistributionService.distributeChapterMarks({
        patternId: dto.pattern_id,
        chapterIds: dto.chapter_ids,
        mediumIds: dto.medium_ids,
        requestedMarks: dto.chapter_ids.map((id) => {
          const match = chapterMarks.find((c) => c.chapter_id === id);
          if (!match) {
            throw new BadRequestException('Chapter marks must cover exactly the selected chapters');
          }
          return match.marks;
        }),
        questionOrigin: dto.question_source,
      });
      this.assertAllocationResult(allocation);
      return allocation;
    }

    return this.createTestPaperService.getTestPaperAllocation({
      patternId: dto.pattern_id,
      chapterIds: dto.chapter_ids,
      mediumIds: dto.medium_ids,
      questionOrigin: dto.question_source,
    });
  }

  private async processBoardSmartTestDistribution(dto: CreateBoardSmartTestDto, allocation: any) {
    const distribution = await this.chapterMarksDistributionService.processFinalQuestionsDistribution({
      patternId: allocation.patternId,
      patternName: allocation.patternName,
      totalMarks: allocation.totalMarks,
      absoluteMarks: allocation.absoluteMarks,
      mediumIds: dto.medium_ids,
      questionOrigin: dto.question_source,
      mediums: allocation.mediums,
      sectionAllocations: allocation.sectionAllocations,
      chapterMarks: allocation.chapterMarks,
    });

    if ((distribution as any).error || (distribution as any).hasError) {
      throw new BadRequestException(
        (distribution as any).message ||
          (distribution as any).error ||
          'Could not generate a balanced question set. Try different chapters or question source.',
      );
    }
    return distribution;
  }

  private async persistBoardSmartTest(
    tx: any,
    ctx: {
      userId: number;
      student: any;
      dto: CreateBoardSmartTestDto;
      schoolId: number;
      seed: string;
      allocation: any;
      questionsData: any[];
      recentlySeen: Set<number>;
    },
  ) {
    const { userId, student, dto, schoolId, seed, allocation, questionsData, recentlySeen } = ctx;
    const questionSourceMapping = {
      board: 'board' as const,
      other: 'other' as const,
      both: 'both' as const,
    };

    const testPaper = await tx.test_Paper.create({
      data: {
        name: dto.name.trim(),
        exam_time: new Date('1970-01-01T00:00:00Z'),
        user_id: userId,
        school_id: schoolId,
        pattern_id: dto.pattern_id,
        test_paper_origin_type: questionSourceMapping[dto.question_source],
        duration_minutes: dto.duration_minutes,
        instructions: dto.instructions,
        negative_marking: dto.negative_marking ?? false,
        negative_marks_per_question: dto.negative_marks_per_question,
        randomize_questions: dto.randomize_questions ?? true,
        randomize_options: dto.randomize_options ?? true,
        is_online: true,
        is_open_practice: false,
        creation_mode: 'STUDENT_SMART',
        generation_policy: SMART_TEST_POLICY,
        generation_seed: seed,
        generation_request: {
          type: 'BOARD',
          medium_ids: dto.medium_ids,
          subject_id: dto.subject_id,
          chapter_ids: dto.chapter_ids,
          chapter_marks:
            dto.chapter_marks?.map((c) => ({ chapter_id: c.chapter_id, marks: c.marks })) ??
            null,
          question_source: dto.question_source,
          pattern_id: dto.pattern_id,
          recently_seen_excluded_count: recentlySeen.size,
        },
      },
    });

    let order = 1;
    const chapterIdsUsed = new Set<number>();
    for (const section of questionsData) {
      for (const subsection of section.subsections) {
        for (const q of subsection.questions) {
          chapterIdsUsed.add(q.chapter_id);
          await tx.test_Paper_Question.create({
            data: {
              test_paper_id: testPaper.id,
              question_id: q.question_id,
              question_text_id: q.question_text_id,
              section_id: section.section_id,
              subsection_id: subsection.subsection_question_type_id,
              question_order: order++,
              marks: q.marks,
            },
          });
        }
      }
    }

    const allocatedMarksByChapter = new Map<number, number>(
      ((allocation.chapterMarks as any[]) || []).map((c) => [c.chapterId, c.absoluteMarks]),
    );
    for (const chapterId of chapterIdsUsed) {
      await tx.test_Paper_Chapter.create({
        data: {
          test_paper_id: testPaper.id,
          chapter_id: chapterId,
          weightage: allocatedMarksByChapter.get(chapterId) ?? 1,
        },
      });
    }

    const now = new Date();
    const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const assignment = await tx.test_Assignment.create({
      data: {
        student_id: student.id,
        test_paper_id: testPaper.id,
        assigned_by_user_id: userId,
        available_from: now,
        due_date: due,
        max_attempts: 1,
        status: 'assigned',
        assignment_source: 'SELF_SMART',
      },
    });

    return {
      message: 'Smart Test created successfully',
      assignment_id: assignment.id,
      test_paper_id: testPaper.id,
      question_count: order - 1,
    };
  }

  async createBoardSmartTest(userId: number, dto: CreateBoardSmartTestDto) {
    const student = await this.resolveStudent(userId);
    this.assertBoardSmartTestEligible(student);

    const schoolId = student.school_standard.school_id;
    const standardId = student.school_standard.standard_id;

    this.assertBoardSmartTestDtoBasics(dto);
    const pattern = await this.loadValidatedBoardPattern(dto, standardId);
    await this.assertBoardSmartTestChapters(dto);

    const seed = `${userId}-${Date.now()}-${randomHexToken(8)}`;
    const allocation = await this.resolveBoardSmartTestAllocation(dto, pattern);
    const distribution = await this.processBoardSmartTestDistribution(dto, allocation);
    const questionsData = this.prepareQuestionsData(distribution);
    if (!questionsData.length) {
      throw new BadRequestException(
        'Not enough verified questions to build this Smart Test. Try different chapters or source.',
      );
    }

    const recentlySeen = await this.getRecentlySeenQuestionIds(student.id);

    return this.prisma.$transaction(async (tx) =>
      this.persistBoardSmartTest(tx, {
        userId,
        student,
        dto,
        schoolId,
        seed,
        allocation,
        questionsData,
        recentlySeen,
      }),
    );
  }

  private assertAspirantSmartTestEligible(student: any) {
    if (!student.participant) {
      throw new BadRequestException(
        'Exam-program Smart Tests are for aspirants. Enroll in a program or use a Board Smart Test.',
      );
    }
  }

  private assertAspirantEnrolledInProgram(student: any, template: any) {
    const enrolled = student.participant.participant_programs.some(
      (pp) => pp.exam_program_id === template.exam_program_id,
    );
    if (!enrolled) {
      throw new BadRequestException('You are not enrolled in this exam program');
    }
  }

  private async resolveAspirantRootNodeIds(
    dto: CreateAspirantSmartTestDto,
    template: any,
  ): Promise<number[]> {
    if (dto.syllabus_node_ids?.length) {
      return dto.syllabus_node_ids;
    }
    const nodes = await this.prisma.syllabus_Node.findMany({
      where: {
        exam_program_id: template.exam_program_id,
        parent_id: null,
        ...(template.exam_stage_id ? { exam_stage_id: template.exam_stage_id } : {}),
      },
      select: { id: true },
    });
    return nodes.map((n) => n.id);
  }

  private async validateAspirantRootNodeIds(uniqueRootNodeIds: number[], template: any) {
    const validRootNodes = await this.prisma.syllabus_Node.findMany({
      where: {
        id: { in: uniqueRootNodeIds },
        exam_program_id: template.exam_program_id,
        ...(template.exam_stage_id ? { exam_stage_id: template.exam_stage_id } : {}),
      },
      select: { id: true },
    });
    if (validRootNodes.length !== uniqueRootNodeIds.length) {
      throw new BadRequestException(
        'One or more selected syllabus sections do not belong to this paper pattern',
      );
    }
  }

  private async buildAspirantNodeQuotas(
    dto: CreateAspirantSmartTestDto,
    template: any,
    uniqueRootNodeIds: number[],
  ): Promise<{ nodeQuotas: Map<number, number> | null; nodeSubtrees: Map<number, Set<number>> }> {
    const nodeSubtrees = new Map<number, Set<number>>();
    if (!dto.syllabus_weightage?.length) {
      return { nodeQuotas: null, nodeSubtrees };
    }

    const totalTemplateQuestions = template.sections.reduce(
      (sum, s) => sum + s.total_questions,
      0,
    );
    const weightageIds = dto.syllabus_weightage
      .map((w) => w.syllabus_node_id)
      .sort((a, b) => a - b);
    const selectedIds = [...uniqueRootNodeIds].sort((a, b) => a - b);
    if (
      weightageIds.length !== selectedIds.length ||
      weightageIds.some((id, i) => id !== selectedIds[i])
    ) {
      throw new BadRequestException(
        'Weightage must cover exactly the selected syllabus sections',
      );
    }
    const totalWeightage = dto.syllabus_weightage.reduce((sum, w) => sum + w.questions, 0);
    if (totalWeightage !== totalTemplateQuestions) {
      throw new BadRequestException(
        `Section weightage must add up to ${totalTemplateQuestions} questions`,
      );
    }

    const nodeQuotas = new Map(
      dto.syllabus_weightage.map((w) => [w.syllabus_node_id, w.questions]),
    );
    for (const nodeId of uniqueRootNodeIds) {
      nodeSubtrees.set(nodeId, new Set(await this.expandSyllabusSubtree([nodeId])));
    }
    return { nodeQuotas, nodeSubtrees };
  }

  private collectPickedQuestionsFromUnits(
    taken: Array<{
      question_group_id: number | null;
      questions: Array<{ id: number; question_text_id: number; group_order: number | null }>;
    }>,
    usedAcrossSections: Set<number>,
  ) {
    const picked: Array<{
      question_id: number;
      question_text_id: number;
      question_group_id: number | null;
      group_order: number | null;
    }> = [];
    for (const unit of taken) {
      for (const q of unit.questions) {
        picked.push({
          question_id: q.id,
          question_text_id: q.question_text_id,
          question_group_id: unit.question_group_id,
          group_order: q.group_order,
        });
        usedAcrossSections.add(q.id);
      }
    }
    return picked;
  }

  private async pickAspirantSectionWithWeightage(
    section: any,
    units: any[],
    seed: string,
    uniqueRootNodeIds: number[],
    nodeQuotas: Map<number, number>,
    nodeSubtrees: Map<number, Set<number>>,
    usedAcrossSections: Set<number>,
  ) {
    const picked: Array<{
      question_id: number;
      question_text_id: number;
      question_group_id: number | null;
      group_order: number | null;
    }> = [];
    let remaining = section.total_questions;
    const shuffledUnits = this.seededShuffle(units, `${seed}-s${section.id}`);

    for (const nodeId of uniqueRootNodeIds) {
      if (remaining <= 0) break;
      const quota = nodeQuotas.get(nodeId) ?? 0;
      if (quota <= 0) continue;
      const subtree = nodeSubtrees.get(nodeId);
      if (!subtree) continue;
      const nodeUnits = shuffledUnits.filter(
        (unit) =>
          unit.questions.every((q) => !usedAcrossSections.has(q.id)) &&
          unit.node_ids.some((id) => subtree.has(id)),
      );
      const taken = this.pickUnitsFittingSlots(nodeUnits, Math.min(quota, remaining));
      const takenCount = taken.reduce((sum, u) => sum + u.size, 0);
      if (takenCount < Math.min(quota, remaining)) {
        const nodeName =
          (
            await this.prisma.syllabus_Node.findUnique({
              where: { id: nodeId },
              select: { name: true },
            })
          )?.name ?? `section #${nodeId}`;
        throw new BadRequestException(
          `Not enough questions in "${nodeName}" for the requested weightage: ` +
            `need ${Math.min(quota, remaining)}, found ${takenCount} (passage groups must stay together). Reduce its share.`,
        );
      }
      picked.push(...this.collectPickedQuestionsFromUnits(taken, usedAcrossSections));
      nodeQuotas.set(nodeId, quota - takenCount);
      remaining -= takenCount;
    }

    if (remaining > 0) {
      throw new BadRequestException(
        `Could not fill section "${section.name}": ${remaining} question(s) short. ` +
          'Adjust the section weightage.',
      );
    }
    return picked;
  }

  private pickAspirantSectionBalanced(
    section: any,
    template: any,
    units: any[],
    seed: string,
    usedAcrossSections: Set<number>,
  ) {
    const shuffledUnits = this.seededShuffle(units, `${seed}-s${section.id}`);
    const taken = this.pickUnitsFittingSlots(shuffledUnits, section.total_questions);
    const takenCount = taken.reduce((sum, u) => sum + u.size, 0);
    if (takenCount < section.total_questions) {
      const programName = template.exam_program?.name ?? `program #${template.exam_program_id}`;
      throw new BadRequestException(
        `Not enough questions for section "${section.name}" (${programName}): ` +
          `need ${section.total_questions}, found ${takenCount} (passage groups must stay together).`,
      );
    }
    return this.collectPickedQuestionsFromUnits(taken, usedAcrossSections);
  }

  private async buildAspirantSectionPlans(
    template: any,
    allNodeIds: number[],
    uniqueRootNodeIds: number[],
    nodeQuotas: Map<number, number> | null,
    nodeSubtrees: Map<number, Set<number>>,
    recentlySeen: Set<number>,
    seed: string,
  ) {
    const sectionPlans: Array<{
      sectionId: number;
      marksPerQuestion: number;
      picked: Array<{
        question_id: number;
        question_text_id: number;
        question_group_id: number | null;
        group_order: number | null;
      }>;
    }> = [];
    const usedAcrossSections = new Set<number>();

    for (const section of template.sections) {
      const typeId = await this.questionTypeIdFor(section.answer_format);
      if (!typeId) {
        throw new BadRequestException(`Question type for format ${section.answer_format} not found`);
      }

      const sectionNodeIds = section.syllabus_node_id
        ? (
            await this.expandSyllabusSubtree([section.syllabus_node_id])
          ).filter((id) => allNodeIds.includes(id))
        : allNodeIds;

      const usable = await this.usableQuestionPool(
        typeId,
        sectionNodeIds,
        usedAcrossSections,
        recentlySeen,
        section.total_questions,
      );
      const units = await this.buildSelectionUnits(usable, usedAcrossSections);

      const picked = nodeQuotas
        ? await this.pickAspirantSectionWithWeightage(
            section,
            units,
            seed,
            uniqueRootNodeIds,
            nodeQuotas,
            nodeSubtrees,
            usedAcrossSections,
          )
        : this.pickAspirantSectionBalanced(section, template, units, seed, usedAcrossSections);

      sectionPlans.push({
        sectionId: section.id,
        marksPerQuestion: section.marks_per_question,
        picked,
      });
    }

    return sectionPlans;
  }

  private async persistAspirantSmartTest(
    tx: any,
    ctx: {
      userId: number;
      student: any;
      dto: CreateAspirantSmartTestDto;
      template: any;
      seed: string;
      recentlySeen: Set<number>;
      sectionPlans: Array<{
        sectionId: number;
        marksPerQuestion: number;
        picked: Array<{
          question_id: number;
          question_text_id: number;
          question_group_id: number | null;
          group_order: number | null;
        }>;
      }>;
    },
  ) {
    const { userId, student, dto, template, seed, recentlySeen, sectionPlans } = ctx;

    const testPaper = await tx.test_Paper.create({
      data: {
        name: dto.name.trim(),
        user_id: userId,
        exam_program_id: template.exam_program_id,
        exam_stage_id: template.exam_stage_id,
        paper_template_id: template.id,
        delivery_mode: template.delivery_mode,
        is_online: true,
        duration_minutes: template.duration_minutes,
        instructions: dto.instructions,
        negative_marking: template.negative_marking,
        negative_marks_per_question: null,
        randomize_questions: dto.randomize_questions ?? true,
        randomize_options: dto.randomize_options ?? true,
        is_open_practice: false,
        creation_mode: 'STUDENT_SMART',
        generation_policy: SMART_TEST_POLICY,
        generation_seed: seed,
        generation_request: {
          type: 'ASPIRANT',
          paper_template_id: dto.paper_template_id,
          syllabus_node_ids: dto.syllabus_node_ids ?? null,
          syllabus_weightage:
            dto.syllabus_weightage?.map((w) => ({
              syllabus_node_id: w.syllabus_node_id,
              questions: w.questions,
            })) ?? null,
          recently_seen_excluded_count: recentlySeen.size,
        },
      },
    });

    let order = 1;
    for (const plan of sectionPlans) {
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

      if (sectionNegative !== null) {
        await tx.test_Paper.update({
          where: { id: testPaper.id },
          data: { negative_marks_per_question: sectionNegative },
        });
      }
    }

    const now = new Date();
    const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const assignment = await tx.test_Assignment.create({
      data: {
        student_id: student.id,
        test_paper_id: testPaper.id,
        assigned_by_user_id: userId,
        available_from: now,
        due_date: due,
        max_attempts: 1,
        status: 'assigned',
        assignment_source: 'SELF_SMART',
      },
    });

    return {
      message: 'Smart Test created successfully',
      assignment_id: assignment.id,
      test_paper_id: testPaper.id,
      question_count: order - 1,
    };
  }

  async createAspirantSmartTest(userId: number, dto: CreateAspirantSmartTestDto) {
    const student = await this.resolveStudent(userId);
    this.assertAspirantSmartTestEligible(student);

    const template = await this.paperTemplateService.findOne(dto.paper_template_id);
    this.assertAspirantEnrolledInProgram(student, template);

    const seed = `${userId}-${Date.now()}-${randomHexToken(8)}`;
    const recentlySeen = await this.getRecentlySeenQuestionIds(student.id);

    const rootNodeIds = await this.resolveAspirantRootNodeIds(dto, template);
    const uniqueRootNodeIds = [...new Set(rootNodeIds)];
    await this.validateAspirantRootNodeIds(uniqueRootNodeIds, template);

    const allNodeIds = await this.expandSyllabusSubtree(uniqueRootNodeIds);
    const { nodeQuotas, nodeSubtrees } = await this.buildAspirantNodeQuotas(
      dto,
      template,
      uniqueRootNodeIds,
    );

    const sectionPlans = await this.buildAspirantSectionPlans(
      template,
      allNodeIds,
      uniqueRootNodeIds,
      nodeQuotas,
      nodeSubtrees,
      recentlySeen,
      seed,
    );

    return this.prisma.$transaction(async (tx) =>
      this.persistAspirantSmartTest(tx, {
        userId,
        student,
        dto,
        template,
        seed,
        recentlySeen,
        sectionPlans,
      }),
    );
  }

  private async resolveStudent(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { user_id: userId },
      include: {
        school_standard: {
          include: {
            school: { include: { board: true } },
            standard: true,
          },
        },
        participant: {
          include: {
            participant_programs: {
              include: {
                exam_program: {
                  include: {
                    exam_body: { include: { exam_category: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }

  private async getRecentlySeenQuestionIds(studentId: number): Promise<Set<number>> {
    const recent = await this.prisma.student_Answer.findMany({
      where: {
        test_attempt: { student_id: studentId },
      },
      select: { question_id: true },
      distinct: ['question_id'],
      take: 500,
      orderBy: { answered_at: 'desc' },
    });
    return new Set(recent.map((r) => r.question_id));
  }

  private prepareQuestionsData(distribution: any) {
    if (!distribution?.sectionAllocations) return [];

    return distribution.sectionAllocations
      .map((section: any) => this.buildSectionQuestionsData(section))
      .filter(Boolean);
  }

  private buildSectionQuestionsData(section: any) {
    const subsections = (section.subsectionAllocations || [])
      .map((subsection: any) => this.buildSubsectionQuestionsData(subsection, section))
      .filter((subsection: any) => subsection.questions.length > 0);

    if (!subsections.length) return null;

    return {
      section_id: section.sectionId,
      subsections,
    };
  }

  private buildSubsectionQuestionsData(subsection: any, section: any) {
    const subsectionData = {
      subsection_question_type_id: subsection.subsectionQuestionTypeId,
      questions: [] as any[],
    };

    let questionOrder = 1;
    for (const chapter of subsection.allocatedChapters || []) {
      const entry = this.mapAllocatedChapterQuestion(chapter, section, questionOrder);
      if (entry) {
        subsectionData.questions.push(entry);
        questionOrder++;
      }
    }

    return subsectionData;
  }

  private mapAllocatedChapterQuestion(chapter: any, section: any, questionOrder: number) {
    if (!chapter.question) return null;
    const questionTextId =
      chapter.question.question_texts?.[0]?.id ?? chapter.question.question_text_id;
    if (!questionTextId) return null;
    return {
      question_id: chapter.question.id,
      question_text_id: questionTextId,
      chapter_id: chapter.chapterId,
      marks: section.marks_per_question || chapter.marks || 1,
      question_order: questionOrder,
    };
  }

  private async expandSyllabusSubtree(rootIds: number[]): Promise<number[]> {
    const ids = [...rootIds];
    let frontier = [...rootIds];
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

  /**
   * Usable question pool for a template section: verified texts preferred,
   * not-recently-seen preferred when enough remain, unverified fallback.
   * Includes syllabus node links so weightage quotas can be applied.
   */
  private async usableQuestionPool(
    typeId: number,
    sectionNodeIds: number[],
    used: Set<number>,
    recentlySeen: Set<number>,
    needed: number,
  ): Promise<
    {
      id: number;
      question_texts: { id: number }[];
      node_ids: number[];
      question_group_id: number | null;
      group_order: number | null;
    }[]
  > {
    const mapPool = (
      pool: {
        id: number;
        question_group_id: number | null;
        group_order: number | null;
        question_texts: { id: number }[];
        syllabus_node_links: { syllabus_node_id: number }[];
      }[],
    ) =>
      pool
        .filter((q) => q.question_texts.length > 0 && !used.has(q.id))
        .map((q) => ({
          id: q.id,
          question_texts: q.question_texts,
          node_ids: q.syllabus_node_links.map((l) => l.syllabus_node_id),
          question_group_id: q.question_group_id,
          group_order: q.group_order,
        }));

    const verifiedPool = await this.prisma.question.findMany({
      where: {
        question_type_id: typeId,
        syllabus_node_links: { some: { syllabus_node_id: { in: sectionNodeIds } } },
        question_texts: {
          some: { question_text_topics: { some: { is_verified: true } } },
        },
      },
      select: {
        id: true,
        question_group_id: true,
        group_order: true,
        question_texts: {
          where: { question_text_topics: { some: { is_verified: true } } },
          select: { id: true },
          take: 1,
        },
        syllabus_node_links: { select: { syllabus_node_id: true } },
      },
    });

    let usable = mapPool(verifiedPool);

    const fresh = usable.filter((q) => !recentlySeen.has(q.id));
    if (fresh.length >= needed) {
      usable = fresh;
    }

    if (usable.length < needed) {
      const fallbackPool = await this.prisma.question.findMany({
        where: {
          question_type_id: typeId,
          syllabus_node_links: { some: { syllabus_node_id: { in: sectionNodeIds } } },
        },
        select: {
          id: true,
          question_group_id: true,
          group_order: true,
          question_texts: { select: { id: true }, take: 1 },
          syllabus_node_links: { select: { syllabus_node_id: true } },
        },
      });
      usable = mapPool(fallbackPool);
    }

    return usable;
  }

  private async buildSelectionUnits(
    usable: {
      id: number;
      question_texts: { id: number }[];
      node_ids: number[];
      question_group_id: number | null;
      group_order: number | null;
    }[],
    used: Set<number>,
  ): Promise<
    {
      question_group_id: number | null;
      size: number;
      node_ids: number[];
      questions: { id: number; question_text_id: number; group_order: number | null }[];
    }[]
  > {
    const units: {
      question_group_id: number | null;
      size: number;
      node_ids: number[];
      questions: { id: number; question_text_id: number; group_order: number | null }[];
    }[] = [];
    const seenGroups = new Set<number>();

    for (const q of usable) {
      if (used.has(q.id)) continue;
      if (!q.question_group_id) {
        units.push({
          question_group_id: null,
          size: 1,
          node_ids: q.node_ids,
          questions: [
            {
              id: q.id,
              question_text_id: q.question_texts[0].id,
              group_order: null,
            },
          ],
        });
        continue;
      }
      if (seenGroups.has(q.question_group_id)) continue;
      seenGroups.add(q.question_group_id);

      const siblings = await this.prisma.question.findMany({
        where: { question_group_id: q.question_group_id },
        orderBy: { group_order: 'asc' },
        select: {
          id: true,
          group_order: true,
          question_texts: { select: { id: true }, take: 1 },
          syllabus_node_links: { select: { syllabus_node_id: true } },
        },
      });
      if (
        siblings.length < 2 ||
        siblings.some((s) => used.has(s.id) || !s.question_texts.length)
      ) {
        continue;
      }
      units.push({
        question_group_id: q.question_group_id,
        size: siblings.length,
        node_ids: [
          ...new Set(siblings.flatMap((s) => s.syllabus_node_links.map((l) => l.syllabus_node_id))),
        ],
        questions: siblings.map((s) => ({
          id: s.id,
          question_text_id: s.question_texts[0].id,
          group_order: s.group_order,
        })),
      });
    }

    return units;
  }

  private pickUnitsFittingSlots<
    T extends { size: number; questions: { id: number }[] },
  >(units: T[], slots: number): T[] {
    const picked: T[] = [];
    let remaining = slots;
    const used = new Set<number>();
    for (const unit of units) {
      if (unit.size > remaining) continue;
      if (unit.questions.some((q) => used.has(q.id))) continue;
      picked.push(unit);
      for (const q of unit.questions) {
        used.add(q.id);
      }
      remaining -= unit.size;
      if (remaining <= 0) break;
    }
    return picked;
  }

  /**
   * Per-syllabus-section availability for a paper template: how many usable
   * questions each selected section can contribute. Drives the weightage UI
   * so students cannot request more questions than exist.
   */
  async getAspirantSectionAvailability(
    userId: number,
    paperTemplateId: number,
    syllabusNodeIds: number[],
  ) {
    const student = await this.resolveStudent(userId);
    const template = await this.paperTemplateService.findOne(paperTemplateId);
    const enrolled = student.participant?.participant_programs.some(
      (pp) => pp.exam_program_id === template.exam_program_id,
    );
    if (!enrolled) {
      throw new BadRequestException('You are not enrolled in this exam program');
    }

    // Keep only sections applicable to this pattern (program + stage). Sections
    // from another stage are silently excluded so the UI can drop them.
    const uniqueIds = [...new Set(syllabusNodeIds)];
    const nodes = await this.prisma.syllabus_Node.findMany({
      where: {
        id: { in: uniqueIds },
        exam_program_id: template.exam_program_id,
        ...(template.exam_stage_id ? { exam_stage_id: template.exam_stage_id } : {}),
      },
      select: { id: true, name: true },
    });
    if (!nodes.length) {
      throw new BadRequestException(
        'None of the selected syllabus sections belong to this paper pattern',
      );
    }

    const typeIds = new Set<number>();
    for (const section of template.sections) {
      const typeId = await this.questionTypeIdFor(section.answer_format);
      if (typeId) typeIds.add(typeId);
    }

    const totalQuestions = template.sections.reduce((sum, s) => sum + s.total_questions, 0);

    const sections = await Promise.all(
      nodes.map(async (node) => {
        const subtreeIds = await this.expandSyllabusSubtree([node.id]);
        const available = await this.prisma.question.count({
          where: {
            question_type_id: { in: [...typeIds] },
            syllabus_node_links: { some: { syllabus_node_id: { in: subtreeIds } } },
            question_texts: { some: {} },
          },
        });
        return {
          syllabus_node_id: node.id,
          name: node.name,
          available_questions: available,
        };
      }),
    );

    return {
      paper_template_id: template.id,
      total_questions: totalQuestions,
      total_marks: template.total_marks,
      sections,
    };
  }

  private async templateSupportsSyllabus(template: any, selectedRootIds: number[]) {
    const selectedNodeIds = await this.expandSyllabusSubtree(selectedRootIds);
    const selectedNodeIdSet = new Set(selectedNodeIds);
    const reservedQuestionIds = new Set<number>();

    for (const section of template.sections || []) {
      const typeId = await this.questionTypeIdFor(section.answer_format);
      if (!typeId) return false;

      const sectionNodeIds = section.syllabus_node_id
        ? (await this.expandSyllabusSubtree([section.syllabus_node_id])).filter((id) =>
            selectedNodeIdSet.has(id),
          )
        : selectedNodeIds;
      if (!sectionNodeIds.length) return false;

      const pool = await this.prisma.question.findMany({
        where: {
          question_type_id: typeId,
          syllabus_node_links: { some: { syllabus_node_id: { in: sectionNodeIds } } },
          question_texts: { some: {} },
        },
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      const usable = pool.filter((question) => !reservedQuestionIds.has(question.id));
      if (usable.length < section.total_questions) return false;
      for (const question of usable.slice(0, section.total_questions)) {
        reservedQuestionIds.add(question.id);
      }
    }

    return true;
  }

  private async questionTypeIdFor(format: string): Promise<number | undefined> {
    const typeName = format === 'NUMERIC' ? NAT_QUESTION_TYPE_NAME : MCQ_QUESTION_TYPE_NAME;
    const qt = await this.prisma.question_Type.findFirst({ where: { type_name: typeName } });
    return qt?.id;
  }

  private seededShuffle<T>(items: T[], seed: string): T[] {
    const arr = [...items];
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.codePointAt(i) ?? 0;
      h = Math.imul(h, 16777619);
    }
    const rand = () => {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
