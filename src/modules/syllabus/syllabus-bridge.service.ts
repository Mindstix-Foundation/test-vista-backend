import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type TxClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class SyllabusBridgeService {
  private readonly logger = new Logger(SyllabusBridgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: TxClient): TxClient {
    return tx ?? this.prisma;
  }

  private programCodeForBoard(abbreviation: string): string {
    return `BOARD_${abbreviation.replaceAll(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;
  }

  /** Resolve BOARD exam program for a legacy board (creates body/program if missing). */
  async ensureBoardProgram(boardId: number, tx?: TxClient) {
    const db = this.client(tx);
    const board = await db.board.findUnique({
      where: { id: boardId },
      include: { exam_body: true },
    });
    if (!board) return null;

    let body = board.exam_body;
    if (!body) {
      body = await db.exam_Body.findFirst({
        where: {
          OR: [{ board_id: board.id }, { abbreviation: board.abbreviation }],
        },
      });
      if (body && !body.board_id) {
        body = await db.exam_Body.update({
          where: { id: body.id },
          data: { board_id: board.id },
        });
      }
    }
    if (!body) {
      const boardCategory = await db.exam_Category.findFirst({
        where: { code: 'BOARD' },
      });
      if (!boardCategory) {
        this.logger.warn(`BOARD category not seeded; cannot bridge board ${boardId}`);
        return null;
      }
      body = await db.exam_Body.upsert({
        where: { board_id: board.id },
        update: {},
        create: {
          name: board.name,
          abbreviation: board.abbreviation,
          exam_category_id: boardCategory.id,
          board_id: board.id,
        },
      });
    }

    const programCode = this.programCodeForBoard(board.abbreviation);
    const program = await db.exam_Program.upsert({
      where: { code: programCode },
      update: { exam_body_id: body.id },
      create: {
        exam_body_id: body.id,
        name: `${board.abbreviation} Board Curriculum`,
        code: programCode,
        description: `School board curriculum for ${board.name}`,
      },
    });

    return { board, body, program };
  }

  async syncSubject(subjectId: number, tx?: TxClient) {
    const db = this.client(tx);
    const subject = await db.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return null;

    const ctx = await this.ensureBoardProgram(subject.board_id, tx);
    if (!ctx) return null;

    const siblings = await db.subject.findMany({
      where: { board_id: subject.board_id },
      orderBy: { id: 'asc' },
    });
    const sequence = siblings.findIndex((s) => s.id === subject.id) + 1;

    const existing = await db.syllabus_Node.findFirst({
      where: {
        exam_program_id: ctx.program.id,
        legacy_subject_id: subject.id,
        node_type: 'SUBJECT',
      },
    });

    if (existing) {
      return db.syllabus_Node.update({
        where: { id: existing.id },
        data: { name: subject.name, sequence_number: sequence || existing.sequence_number },
      });
    }

    return db.syllabus_Node.create({
      data: {
        exam_program_id: ctx.program.id,
        node_type: 'SUBJECT',
        name: subject.name,
        sequence_number: sequence || 1,
        legacy_subject_id: subject.id,
      },
    });
  }

  async syncChapter(chapterId: number, tx?: TxClient) {
    const db = this.client(tx);
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: { subject: true },
    });
    if (!chapter) return null;

    const ctx = await this.ensureBoardProgram(chapter.subject.board_id, tx);
    if (!ctx) return null;

    const subjectNode = await this.syncSubject(chapter.subject_id, tx);
    if (!subjectNode) return null;

    let stage = await db.exam_Stage.findUnique({
      where: { standard_id: chapter.standard_id },
    });
    if (!stage) {
      const standard = await db.standard.findUnique({ where: { id: chapter.standard_id } });
      if (standard) {
        stage = await db.exam_Stage.upsert({
          where: {
            exam_program_id_name: {
              exam_program_id: ctx.program.id,
              name: standard.name,
            },
          },
          update: { standard_id: standard.id },
          create: {
            exam_program_id: ctx.program.id,
            name: standard.name,
            sequence_number: standard.sequence_number,
            standard_id: standard.id,
          },
        });
      }
    }

    const existing = await db.syllabus_Node.findFirst({
      where: {
        exam_program_id: ctx.program.id,
        legacy_chapter_id: chapter.id,
        node_type: 'CHAPTER',
      },
    });

    if (existing) {
      return db.syllabus_Node.update({
        where: { id: existing.id },
        data: {
          name: chapter.name,
          sequence_number: chapter.sequential_chapter_number,
          parent_id: subjectNode.id,
          exam_stage_id: stage?.id ?? null,
        },
      });
    }

    const node = await db.syllabus_Node.create({
      data: {
        exam_program_id: ctx.program.id,
        exam_stage_id: stage?.id ?? null,
        parent_id: subjectNode.id,
        node_type: 'CHAPTER',
        name: chapter.name,
        sequence_number: chapter.sequential_chapter_number,
        legacy_chapter_id: chapter.id,
      },
    });

    await this.autoTagQuestionsForChapter(chapter.id, node.id, tx);
    return node;
  }

  async syncTopic(topicId: number, tx?: TxClient) {
    const db = this.client(tx);
    const topic = await db.topic.findUnique({
      where: { id: topicId },
      include: { chapter: { include: { subject: true } } },
    });
    if (!topic) return null;

    const chapterNode = await this.syncChapter(topic.chapter_id, tx);
    if (!chapterNode) return null;

    const existing = await db.syllabus_Node.findFirst({
      where: {
        exam_program_id: chapterNode.exam_program_id,
        legacy_topic_id: topic.id,
        node_type: 'TOPIC',
      },
    });

    if (existing) {
      return db.syllabus_Node.update({
        where: { id: existing.id },
        data: {
          name: topic.name,
          sequence_number: topic.sequential_topic_number,
          parent_id: chapterNode.id,
          exam_stage_id: chapterNode.exam_stage_id,
        },
      });
    }

    const node = await db.syllabus_Node.create({
      data: {
        exam_program_id: chapterNode.exam_program_id,
        exam_stage_id: chapterNode.exam_stage_id,
        parent_id: chapterNode.id,
        node_type: 'TOPIC',
        name: topic.name,
        sequence_number: topic.sequential_topic_number,
        legacy_topic_id: topic.id,
      },
    });

    await this.autoTagQuestionsForTopic(topic.id, node.id, chapterNode.id, tx);
    return node;
  }

  async removeSyncedSubject(subjectId: number, tx?: TxClient) {
    const db = this.client(tx);
    const nodes = await db.syllabus_Node.findMany({
      where: { legacy_subject_id: subjectId, node_type: 'SUBJECT' },
    });
    for (const node of nodes) {
      await db.syllabus_Node.delete({ where: { id: node.id } });
    }
  }

  async removeSyncedChapter(chapterId: number, tx?: TxClient) {
    const db = this.client(tx);
    const nodes = await db.syllabus_Node.findMany({
      where: { legacy_chapter_id: chapterId, node_type: 'CHAPTER' },
    });
    for (const node of nodes) {
      await db.syllabus_Node.delete({ where: { id: node.id } });
    }
  }

  async removeSyncedTopic(topicId: number, tx?: TxClient) {
    const db = this.client(tx);
    const nodes = await db.syllabus_Node.findMany({
      where: { legacy_topic_id: topicId, node_type: 'TOPIC' },
    });
    for (const node of nodes) {
      await db.syllabus_Node.delete({ where: { id: node.id } });
    }
  }

  async findNodesByChapter(chapterId: number) {
    return this.prisma.syllabus_Node.findMany({
      where: { legacy_chapter_id: chapterId, node_type: 'CHAPTER' },
      include: {
        exam_program: { include: { exam_body: { include: { exam_category: true } } } },
        exam_stage: true,
        parent: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async findNodesByTopic(topicId: number) {
    return this.prisma.syllabus_Node.findMany({
      where: { legacy_topic_id: topicId, node_type: 'TOPIC' },
      include: {
        exam_program: { include: { exam_body: true } },
        parent: true,
      },
    });
  }

  /** Tag a board question to mapped syllabus nodes (topic + chapter). */
  async autoTagQuestionFromBoardTopic(
    questionId: number,
    topicId: number,
    tx?: TxClient,
  ): Promise<number> {
    const db = this.client(tx);
    let tagged = 0;

    const topicNode = await db.syllabus_Node.findFirst({
      where: { legacy_topic_id: topicId, node_type: 'TOPIC' },
    });
    if (topicNode) {
      await this.ensureTag(db, questionId, topicNode.id);
      tagged++;
    }

    const topic = await db.topic.findUnique({ where: { id: topicId } });
    if (topic) {
      const chapterNode = await db.syllabus_Node.findFirst({
        where: { legacy_chapter_id: topic.chapter_id, node_type: 'CHAPTER' },
      });
      if (chapterNode) {
        await this.ensureTag(db, questionId, chapterNode.id);
        tagged++;
      }
    }

    return tagged;
  }

  private async autoTagQuestionsForTopic(
    topicId: number,
    topicNodeId: number,
    chapterNodeId: number,
    tx?: TxClient,
  ) {
    const db = this.client(tx);
    const links = await db.question_Topic.findMany({
      where: { topic_id: topicId },
      select: { question_id: true },
    });
    for (const { question_id } of links) {
      await this.ensureTag(db, question_id, topicNodeId);
      await this.ensureTag(db, question_id, chapterNodeId);
    }
  }

  private async autoTagQuestionsForChapter(
    chapterId: number,
    chapterNodeId: number,
    tx?: TxClient,
  ) {
    const db = this.client(tx);
    const topicIds = (
      await db.topic.findMany({
        where: { chapter_id: chapterId },
        select: { id: true },
      })
    ).map((t) => t.id);

    if (!topicIds.length) return;

    const links = await db.question_Topic.findMany({
      where: { topic_id: { in: topicIds } },
      select: { question_id: true },
    });

    for (const { question_id } of links) {
      await this.ensureTag(db, question_id, chapterNodeId);
    }
  }

  private async ensureTag(db: TxClient, questionId: number, syllabusNodeId: number) {
    const existing = await db.question_Syllabus_Node.findUnique({
      where: {
        question_id_syllabus_node_id: {
          question_id: questionId,
          syllabus_node_id: syllabusNodeId,
        },
      },
    });
    if (!existing) {
      await db.question_Syllabus_Node.create({
        data: { question_id: questionId, syllabus_node_id: syllabusNodeId },
      });
    }
  }
}
