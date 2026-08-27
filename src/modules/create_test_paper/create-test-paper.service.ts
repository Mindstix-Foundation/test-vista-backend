import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestPaperFilterDto, CreateTestPaperResponseDto, SectionAllocationDto, SubsectionAllocationDto, ChapterMarksDto, ChapterInfoDto } from './dto/create-test-paper.dto';
import { CreateOnlineTestPaperDto } from './dto/create-online-test-paper.dto';
import { FilterChaptersDto } from './dto/filter-chapters.dto';
import { ChapterMarksResponseDto } from './dto/chapter-marks-response.dto';
import { Prisma } from '../../prisma/client';
import { shuffledCopy } from '../../common/utils/secure-random.util';

// Define type alias for the question origin union type
type QuestionOriginType = 'board' | 'other' | 'both';

// Constants for allocation logic
const QUESTIONS_REQUIRED_PER_ALLOCATION = 1;
const MINIMUM_QUESTIONS_FOR_AVAILABILITY_CHECK = 2;
const SINGLE_QUESTION_ALLOCATION = 1;
const INITIAL_CHAPTER_MARKS = 0;
const SEPARATOR_LINE_LENGTH = 50;

// Define interface for pattern with sections
interface PatternWithSections {
  id: number;
  pattern_name: string;
  total_marks: number;
  sections: Array<{
    id: number;
    pattern_id: number;
    section_name: string;
    sequence_number: number;
    section_number: number;
    sub_section: string;
    total_questions: number;
    mandotory_questions: number;
    marks_per_question: number;
    subsection_question_types: Array<{
      id: number;
      question_type_id: number;
      seqencial_subquestion_number: number;
      question_type: {
        id: number;
        type_name: string;
      };
    }>;
  }>;
}

// Define interface for question availability
interface QuestionAvailabilityResult {
  chapter_id: number;
  question_type_id: number;
  question_count: number;
}

interface AllocateChaptersForSubsectionParams {
  sqt: PatternWithSections['sections'][number]['subsection_question_types'][number];
  section: PatternWithSections['sections'][number];
  chapterIds: number[];
  mediumIds: number[];
  randomChapters: number[];
  chapterMarksMap: Map<number, number>;
  chapterQuestionTypeMap: Map<number, Map<number, number>>;
  chapterNameMap: Map<number, string>;
}

@Injectable()
export class CreateTestPaperService {
  constructor(private readonly prisma: PrismaService) {}

  private generateRandomSequence<T>(items: T[]): T[] {
    return shuffledCopy(items);
  }

  private getRandomChaptersByMarks(chapterMarksMap: Map<number, number>): number[] {
    // Convert map to array of [chapterId, marks] pairs
    const chaptersWithMarks = Array.from(chapterMarksMap.entries());
    
    // Sort by marks in ascending order
    chaptersWithMarks.sort((a, b) => a[1] - b[1]);
    
    // Group chapters by marks
    const groupedChapters = new Map<number, number[]>();
    for (const [chapterId, marks] of chaptersWithMarks) {
      const chaptersInGroup = groupedChapters.get(marks);
      if (chaptersInGroup) {
        chaptersInGroup.push(chapterId);
      } else {
        groupedChapters.set(marks, [chapterId]);
      }
    }
    
    // Randomize within groups and flatten
    const result: number[] = [];
    for (const [, chapters] of Array.from(groupedChapters.entries())) {
      if (chapters.length > 1) {
        // Randomize chapters with same marks
        result.push(...this.generateRandomSequence(chapters));
      } else {
        // Single chapter in group, no need to randomize
        result.push(chapters[0]);
      }
    }
    
    return result;
  }

  private async getChapterQuestionTypeCounts(
    chapterIds: number[],
    mediumIds: number[],
    questionOrigin?: QuestionOriginType
  ): Promise<Map<number, Map<number, number>>> {
    // Ensure mediumIds array is not empty to avoid SQL errors
    if (mediumIds.length === 0) {
      return new Map();
    }

    const requiredMediumCount = mediumIds.length;

    // Build the board_question condition based on questionOrigin
    let boardQuestionCondition = '';
    if (questionOrigin === 'board') {
      boardQuestionCondition = 'AND q.board_question = true';
    } else if (questionOrigin === 'other') {
      boardQuestionCondition = 'AND q.board_question = false';
    }
    // For 'both', we don't add condition

    const boardQuestionSql = Prisma.sql([boardQuestionCondition]);

    await this.prisma.$queryRaw<{ chapter_id: bigint, question_type_id: bigint, count: bigint }[]>`
      SELECT 
        q.chapter_id,
        q.question_type_id,
        COUNT(DISTINCT q.question_id) as count
      FROM (
        SELECT 
          t.chapter_id,
          q.question_type_id,
          q.id as question_id,
          qttm.instruction_medium_id
        FROM "Question" q
        JOIN "Question_Type" qt ON qt.id = q.question_type_id
        JOIN "Question_Topic" qtopic ON qtopic.question_id = q.id
        JOIN "Topic" t ON t.id = qtopic.topic_id
        JOIN "Question_Text" qtext ON qtext.question_id = q.id
        JOIN "Question_Text_Topic_Medium" qttm ON qttm.question_text_id = qtext.id AND qttm.question_topic_id = qtopic.id
        WHERE t.chapter_id = ANY(${chapterIds})
          AND qttm.instruction_medium_id = ANY(${mediumIds})
          AND qttm.is_verified = true
          ${boardQuestionSql}
      ) AS q
      GROUP BY q.chapter_id, q.question_type_id, q.question_id
      HAVING COUNT(DISTINCT q.instruction_medium_id) = ${requiredMediumCount}
    `;
    
    // Since the above query counts questions that exist across all mediums, 
    // we need to re-aggregate the counts per chapter and question type.
    const aggregatedResult = await this.prisma.$queryRaw<{ chapter_id: bigint, question_type_id: bigint, count: bigint }[]>`
      SELECT 
        sub.chapter_id,
        sub.question_type_id,
        COUNT(sub.question_id) as count
      FROM (
          SELECT 
            t.chapter_id,
            q.question_type_id,
            q.id as question_id
          FROM "Question" q
          JOIN "Question_Topic" qtopic ON qtopic.question_id = q.id
          JOIN "Topic" t ON t.id = qtopic.topic_id
          WHERE t.chapter_id = ANY(${chapterIds})
          ${boardQuestionSql}
          AND EXISTS (
              SELECT 1
              FROM "Question_Text" qtext
              JOIN "Question_Text_Topic_Medium" qttm ON qttm.question_text_id = qtext.id AND qttm.question_topic_id = qtopic.id
              WHERE qtext.question_id = q.id
              AND qttm.instruction_medium_id = ANY(${mediumIds})
              AND qttm.is_verified = true
              GROUP BY qtext.question_id
              HAVING COUNT(DISTINCT qttm.instruction_medium_id) = ${requiredMediumCount}
          )
      ) AS sub
      GROUP BY sub.chapter_id, sub.question_type_id
    `;

    const chapterQuestionTypeMap = new Map<number, Map<number, number>>();
    
    for (const row of aggregatedResult) {
      const chapterId = Number(row.chapter_id);
      const questionTypeId = Number(row.question_type_id);
      const count = Number(row.count);
      
      if (!chapterQuestionTypeMap.has(chapterId)) {
        chapterQuestionTypeMap.set(chapterId, new Map());
      }
      const typeMap = chapterQuestionTypeMap.get(chapterId);
      if (typeMap) {
        typeMap.set(questionTypeId, count);
      }
    }

    return chapterQuestionTypeMap;
  }

  private async fetchInstructionMediumDetails(
    mediumIds?: number[],
  ): Promise<{ id: number; instruction_medium: string }[]> {
    if (!mediumIds || mediumIds.length === 0) {
      return [];
    }
    try {
      return await this.prisma.instruction_Medium.findMany({
        where: { id: { in: mediumIds } },
        select: { id: true, instruction_medium: true },
      });
    } catch {
      return [];
    }
  }

  private isAnyQuestionAvailableForType(
    chapterIds: number[],
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
    questionTypeId: number,
  ): boolean {
    return chapterIds.some(chapterId => {
      const types = chapterQuestionTypeMap.get(chapterId);
      return types && (types.get(questionTypeId) || INITIAL_CHAPTER_MARKS) > 0;
    });
  }

  private tryAllocateNextChapter(
    randomChapters: number[],
    sqt: PatternWithSections['sections'][number]['subsection_question_types'][number],
    section: PatternWithSections['sections'][number],
    chapterMarksMap: Map<number, number>,
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
    chapterNameMap: Map<number, string>,
  ): { allocated: boolean; randomChapters: number[]; chapterInfo?: ChapterInfoDto } {
    let currentIndex = 0;

    while (currentIndex < randomChapters.length) {
      const currentChapterId = randomChapters[currentIndex];
      const chapterQuestionTypes = chapterQuestionTypeMap.get(currentChapterId);

      if (!chapterQuestionTypes?.has(sqt.question_type_id)) {
        currentIndex++;
        continue;
      }

      const questionCount = chapterQuestionTypes.get(sqt.question_type_id);
      if (questionCount === undefined || questionCount <= INITIAL_CHAPTER_MARKS) {
        currentIndex++;
        continue;
      }

      const chapterInfo: ChapterInfoDto = {
        chapterId: currentChapterId,
        chapterName: chapterNameMap.get(currentChapterId) || `Chapter ${currentChapterId}`,
      };

      const currentMarks = chapterMarksMap.get(currentChapterId) || INITIAL_CHAPTER_MARKS;
      chapterMarksMap.set(currentChapterId, currentMarks + section.marks_per_question);
      chapterQuestionTypes.set(sqt.question_type_id, questionCount - QUESTIONS_REQUIRED_PER_ALLOCATION);

      const updatedChapters = [...randomChapters];
      updatedChapters.splice(currentIndex, 1);

      return { allocated: true, randomChapters: updatedChapters, chapterInfo };
    }

    return { allocated: false, randomChapters };
  }

  private allocateChaptersForSubsection(
    params: AllocateChaptersForSubsectionParams,
  ): { allocatedChapters: ChapterInfoDto[]; randomChapters: number[] } {
    const {
      sqt,
      section,
      chapterIds,
      mediumIds,
      randomChapters,
      chapterMarksMap,
      chapterQuestionTypeMap,
      chapterNameMap,
    } = params;
    const allocatedChapters: ChapterInfoDto[] = [];
    let chapters = randomChapters;
    let remainingQuestions = section.subsection_question_types.length === 1
      ? section.total_questions
      : SINGLE_QUESTION_ALLOCATION;

    while (remainingQuestions > 0) {
      if (chapters.length === 0) {
        chapters = this.getRandomChaptersByMarks(chapterMarksMap);
      }

      const allocationResult = this.tryAllocateNextChapter(
        chapters,
        sqt,
        section,
        chapterMarksMap,
        chapterQuestionTypeMap,
        chapterNameMap,
      );

      if (allocationResult.allocated && allocationResult.chapterInfo) {
        allocatedChapters.push(allocationResult.chapterInfo);
        chapters = allocationResult.randomChapters;
        remainingQuestions--;
        continue;
      }

      if (!this.isAnyQuestionAvailableForType(chapterIds, chapterQuestionTypeMap, sqt.question_type_id)) {
        throw new BadRequestException(
          `Insufficient verified questions for type '${sqt.question_type.type_name}' ` +
          `available across all selected mediums (${mediumIds.join(', ')}) ` +
          `in the chosen chapters (${chapterIds.join(', ')}). Cannot generate test paper.`,
        );
      }

      chapters = this.getRandomChaptersByMarks(chapterMarksMap);
    }

    return { allocatedChapters, randomChapters: chapters };
  }

  private buildSubsectionAllocationDto(
    sqt: PatternWithSections['sections'][number]['subsection_question_types'][number],
    section: PatternWithSections['sections'][number],
    allocatedChapters: ChapterInfoDto[],
  ): SubsectionAllocationDto {
    return {
      subsectionQuestionTypeId: sqt.id,
      section_id: section.id,
      questionTypeName: sqt.question_type.type_name,
      sequentialNumber: sqt.seqencial_subquestion_number,
      question_type_id: sqt.question_type_id,
      question_type: {
        id: sqt.question_type.id,
        type_name: sqt.question_type.type_name,
      },
      allocatedChapters,
    };
  }

  private processSectionAllocation(
    section: PatternWithSections['sections'][number],
    filter: CreateTestPaperFilterDto,
    chapterMarksMap: Map<number, number>,
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
    chapterNameMap: Map<number, string>,
  ): SectionAllocationDto {
    const sectionAbsoluteMarks = section.total_questions * section.marks_per_question;
    const sectionTotalMarks = section.mandotory_questions * section.marks_per_question;
    let randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);
    const subsectionAllocations: SubsectionAllocationDto[] = [];

    for (const sqt of section.subsection_question_types) {
      const allocationResult = this.allocateChaptersForSubsection({
        sqt,
        section,
        chapterIds: filter.chapterIds,
        mediumIds: filter.mediumIds,
        randomChapters,
        chapterMarksMap,
        chapterQuestionTypeMap,
        chapterNameMap,
      });
      randomChapters = allocationResult.randomChapters;
      subsectionAllocations.push(
        this.buildSubsectionAllocationDto(sqt, section, allocationResult.allocatedChapters),
      );
    }

    return {
      sectionId: section.id,
      pattern_id: section.pattern_id,
      sectionName: section.section_name,
      sequentialNumber: section.sequence_number,
      section_number: section.section_number,
      subSection: section.sub_section,
      totalQuestions: section.total_questions,
      mandotory_questions: section.mandotory_questions,
      marks_per_question: section.marks_per_question,
      absoluteMarks: sectionAbsoluteMarks,
      totalMarks: sectionTotalMarks,
      subsectionAllocations,
    };
  }

  async getTestPaperAllocation(filter: CreateTestPaperFilterDto): Promise<CreateTestPaperResponseDto> {
    const pattern = await this.prisma.pattern.findUnique({
      where: { id: filter.patternId },
      include: {
        sections: {
          include: {
            subsection_question_types: {
              include: {
                question_type: true
              }
            }
          }
        }
      }
    });

    if (!pattern) {
      throw new NotFoundException('Pattern not found');
    }

    const mediumDetails = await this.fetchInstructionMediumDetails(filter.mediumIds);

    const chapters = await this.prisma.chapter.findMany({
      where: {
        id: {
          in: filter.chapterIds
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    const chapterNameMap = new Map(chapters.map(ch => [ch.id, ch.name]));

    const chapterQuestionTypeMap = await this.getChapterQuestionTypeCounts(
      filter.chapterIds,
      filter.mediumIds,
      filter.questionOrigin
    );

    const chapterMarksMap = new Map<number, number>();
    for (const chapterId of filter.chapterIds) {
      chapterMarksMap.set(chapterId, INITIAL_CHAPTER_MARKS);
    }

    const randomSections = this.generateRandomSequence(pattern.sections);

    const sectionAllocations = randomSections.map(section =>
      this.processSectionAllocation(
        section,
        filter,
        chapterMarksMap,
        chapterQuestionTypeMap,
        chapterNameMap,
      ),
    );

    const chapterMarks: ChapterMarksDto[] = Array.from(chapterMarksMap.entries()).map(([chapterId, absoluteMarks]) => ({
      chapterId,
      chapterName: chapterNameMap.get(chapterId) || `Chapter ${chapterId}`,
      absoluteMarks
    }));

    const patternAbsoluteMarks = pattern.sections.reduce((total, section) => 
      total + (section.total_questions * section.marks_per_question), 0);

    return {
      patternId: pattern.id,
      patternName: pattern.pattern_name,
      totalMarks: pattern.total_marks,
      absoluteMarks: patternAbsoluteMarks,
      questionOrigin: filter.questionOrigin,
      mediums: mediumDetails,
      sectionAllocations,
      chapterMarks
    };
  }

  private buildChapterQuestionTypeMapFromCounts(
    questionCounts: { chapter_id: bigint; question_type_id: bigint; count: bigint }[],
  ): Map<number, Map<number, number>> {
    const chapterQuestionTypeMap = new Map<number, Map<number, number>>();
    for (const row of questionCounts) {
      const chapterId = Number(row.chapter_id);
      const questionTypeId = Number(row.question_type_id);
      const count = Number(row.count);

      if (!chapterQuestionTypeMap.has(chapterId)) {
        chapterQuestionTypeMap.set(chapterId, new Map());
      }
      const typeMap = chapterQuestionTypeMap.get(chapterId);
      if (typeMap) {
        typeMap.set(questionTypeId, count);
      }
    }
    return chapterQuestionTypeMap;
  }

  private calculateSingleSubsectionSectionMarks(
    section: PatternWithSections['sections'][number],
    chapterQuestionTypes: Map<number, number>,
  ): number {
    const totalQuestions = section.total_questions;
    const marksPerQuestion = section.marks_per_question;
    const questionTypeId = section.subsection_question_types[0].question_type_id;
    const questionCount = chapterQuestionTypes.get(questionTypeId) || 0;
    const canAllocate = Math.floor(questionCount / QUESTIONS_REQUIRED_PER_ALLOCATION)
      + (questionCount % QUESTIONS_REQUIRED_PER_ALLOCATION > 0 ? SINGLE_QUESTION_ALLOCATION : INITIAL_CHAPTER_MARKS);

    if (canAllocate >= totalQuestions) {
      return totalQuestions * marksPerQuestion;
    }
    return canAllocate * marksPerQuestion;
  }

  private calculateMultiSubsectionSectionMarks(
    section: PatternWithSections['sections'][number],
    chapterQuestionTypes: Map<number, number>,
  ): number {
    let remainingQuestions = section.total_questions;
    let sectionMarks = INITIAL_CHAPTER_MARKS;

    for (const sqt of section.subsection_question_types) {
      if (remainingQuestions <= INITIAL_CHAPTER_MARKS) {
        break;
      }

      const questionTypeId = sqt.question_type_id;
      const questionCount = chapterQuestionTypes.get(questionTypeId) || INITIAL_CHAPTER_MARKS;

      if (questionCount >= QUESTIONS_REQUIRED_PER_ALLOCATION) {
        sectionMarks += section.marks_per_question;
        remainingQuestions--;
        chapterQuestionTypes.set(questionTypeId, questionCount - QUESTIONS_REQUIRED_PER_ALLOCATION);
      }
    }

    return sectionMarks;
  }

  private calculateSectionMarksForChapter(
    section: PatternWithSections['sections'][number],
    chapterQuestionTypes: Map<number, number>,
  ): number {
    if (section.subsection_question_types.length === 1) {
      return this.calculateSingleSubsectionSectionMarks(section, chapterQuestionTypes);
    }
    return this.calculateMultiSubsectionSectionMarks(section, chapterQuestionTypes);
  }

  private calculateChapterAbsoluteMarks(
    pattern: PatternWithSections,
    chapterId: number,
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
  ): number {
    let absoluteMarks = INITIAL_CHAPTER_MARKS;
    const chapterQuestionTypes = new Map(chapterQuestionTypeMap.get(chapterId) || new Map());

    for (const section of pattern.sections) {
      absoluteMarks += this.calculateSectionMarksForChapter(section, chapterQuestionTypes);
    }

    return absoluteMarks;
  }

  async getChaptersWithPossibleMarks(filterDto: FilterChaptersDto): Promise<ChapterMarksResponseDto[]> {
    const { patternId, chapterIds, mediumIds, questionOrigin = 'both' } = filterDto;

    const pattern = await this.prisma.pattern.findUnique({
      where: { id: patternId },
      include: {
        sections: {
          include: {
            subsection_question_types: {
              include: {
                question_type: true
              }
            }
          }
        }
      }
    });

    if (!pattern) {
      throw new NotFoundException('Pattern not found');
    }

    const chapters = await this.prisma.chapter.findMany({
      where: {
        id: { in: chapterIds }
      }
    });

    let boardQuestionCondition = '';
    if (questionOrigin === 'board') {
      boardQuestionCondition = 'AND q.board_question = true';
    } else if (questionOrigin === 'other') {
      boardQuestionCondition = 'AND q.board_question = false';
    }

    const boardQuestionSql = Prisma.sql([boardQuestionCondition]);
    
    const questionCounts = await this.prisma.$queryRaw<{ chapter_id: bigint, question_type_id: bigint, count: bigint }[]>`
      SELECT 
        c.id as chapter_id,
        qt.id as question_type_id,
        COUNT(DISTINCT q.id) as count
      FROM "Chapter" c
      JOIN "Topic" t ON t.chapter_id = c.id
      JOIN "Question_Topic" qtopic ON qtopic.topic_id = t.id
      JOIN "Question" q ON q.id = qtopic.question_id
      JOIN "Question_Type" qt ON qt.id = q.question_type_id
      JOIN "Question_Text" qtext ON qtext.question_id = q.id
      JOIN "Question_Text_Topic_Medium" qttm ON qttm.question_text_id = qtext.id
      WHERE c.id = ANY(${chapterIds})
      AND qttm.instruction_medium_id = ANY(${mediumIds})
      AND qttm.is_verified = true
      ${boardQuestionSql}
      GROUP BY c.id, qt.id
    `;

    const chapterQuestionTypeMap = this.buildChapterQuestionTypeMapFromCounts(questionCounts);

    return chapters.map(chapter => ({
      chapterId: chapter.id,
      chapterName: chapter.name,
      absoluteMarks: this.calculateChapterAbsoluteMarks(pattern, chapter.id, chapterQuestionTypeMap),
      questionOrigin,
    }));
  }

  private async calculatePossibleMarksPerChapter(
    pattern: PatternWithSections,
    chapterIds: number[],
    mediumIds: number[],
    questionOrigin?: QuestionOriginType
  ): Promise<Map<number, number>> {
    const possibleMarksMap = new Map<number, number>();
    
    // Get question availability for each chapter
    // Build the board_question condition based on questionOrigin
    let boardQuestionCondition = '';
    if (questionOrigin === 'board') {
      boardQuestionCondition = 'AND q.board_question = true';
    } else if (questionOrigin === 'other') {
      boardQuestionCondition = 'AND q.board_question = false';
    }
    // For 'both', we don't add condition

    const boardQuestionSql = Prisma.sql([boardQuestionCondition]);

    const questionAvailability = await this.prisma.$queryRaw<QuestionAvailabilityResult[]>`
      SELECT 
        c.id as chapter_id,
        qt.id as question_type_id,
        COUNT(DISTINCT q.id) as question_count
      FROM "Chapter" c
      JOIN "Topic" t ON t.chapter_id = c.id
      JOIN "Question_Topic" qtopic ON qtopic.topic_id = t.id
      JOIN "Question" q ON q.id = qtopic.question_id
      JOIN "Question_Type" qt ON qt.id = q.question_type_id
      JOIN "Question_Text" qtext ON qtext.question_id = q.id
      JOIN "Question_Text_Topic_Medium" qttm ON qttm.question_text_id = qtext.id
      WHERE c.id = ANY(${chapterIds})
      AND qttm.instruction_medium_id = ANY(${mediumIds})
      AND qttm.is_verified = true
      ${boardQuestionSql}
      GROUP BY c.id, qt.id
    `;

    // Calculate possible marks for each chapter
    for (const chapterId of chapterIds) {
      let possibleMarks = INITIAL_CHAPTER_MARKS;
      
      // For each section in pattern
      for (const section of pattern.sections) {
        // For each question type in section
        for (const sqt of section.subsection_question_types) {
          const questionTypeId = sqt.question_type_id;
          
          // Find available questions for this chapter and question type
          const availability = questionAvailability.find(
            (qa) => qa.chapter_id === chapterId && qa.question_type_id === questionTypeId
          );
          
          if (availability && availability.question_count >= MINIMUM_QUESTIONS_FOR_AVAILABILITY_CHECK) {
            // Calculate possible marks for this question type (1:1 ratio)
            const questionsPossible = Math.min(
              section.total_questions,
              availability.question_count
            );
            possibleMarks += questionsPossible * section.marks_per_question;
          }
        }
      }
      
      possibleMarksMap.set(chapterId, possibleMarks);
    }
    
    return possibleMarksMap;
  }

  private initializeAllocationMap(
    pattern: PatternWithSections,
    chapterIds: number[],
  ): Map<number, Map<number, number[]>> {
    const allocationMap = new Map<number, Map<number, number[]>>();

    for (const section of pattern.sections) {
      const sectionMap = new Map<number, number[]>();
      for (const chapterId of chapterIds) {
        sectionMap.set(chapterId, []);
      }
      allocationMap.set(section.id, sectionMap);
    }

    return allocationMap;
  }

  private getTotalAllocatedMarksForChapter(
    chapterId: number,
    allocationMap: Map<number, Map<number, number[]>>,
  ): number {
    return Array.from(allocationMap.values()).reduce(
      (sum, sectionMap) =>
        sum + (sectionMap.get(chapterId) || []).reduce((a, b) => a + b, INITIAL_CHAPTER_MARKS),
      INITIAL_CHAPTER_MARKS,
    );
  }

  private getChaptersNeedingMarks(
    sortedChapters: number[],
    allocationMap: Map<number, Map<number, number[]>>,
    targetMarks: Map<number, number>,
  ): number[] {
    return sortedChapters.filter(chapterId =>
      this.getTotalAllocatedMarksForChapter(chapterId, allocationMap)
        < (targetMarks.get(chapterId) || INITIAL_CHAPTER_MARKS),
    );
  }

  private async allocateMinimumMarksForChapter(
    chapterId: number,
    sortedSections: PatternWithSections['sections'],
    target: number,
    allocationMap: Map<number, Map<number, number[]>>,
    mediumIds: number[],
    questionOrigin?: QuestionOriginType,
  ): Promise<void> {
    let allocatedMarks = INITIAL_CHAPTER_MARKS;

    for (const section of sortedSections) {
      if (allocatedMarks >= target) {
        break;
      }

      const remainingMarks = target - allocatedMarks;
      const marksPerQuestion = section.marks_per_question;
      const maxQuestions = Math.floor(remainingMarks / marksPerQuestion);

      if (maxQuestions <= INITIAL_CHAPTER_MARKS) {
        continue;
      }

      const hasQuestions = await this.hasVerifiedQuestions(
        chapterId,
        section.subsection_question_types.map(sqt => sqt.question_type_id),
        mediumIds,
        questionOrigin,
      );

      if (!hasQuestions) {
        continue;
      }

      const questionsToAllocate = Math.min(
        maxQuestions,
        section.total_questions,
        Math.floor(remainingMarks / marksPerQuestion),
      );

      if (questionsToAllocate <= INITIAL_CHAPTER_MARKS) {
        continue;
      }

      const sectionMap = allocationMap.get(section.id);
      const chapterMap = sectionMap?.get(chapterId);
      if (!sectionMap || !chapterMap) {
        continue;
      }
      sectionMap.set(chapterId, [
        ...chapterMap,
        ...new Array(questionsToAllocate).fill(marksPerQuestion),
      ]);
      allocatedMarks += questionsToAllocate * marksPerQuestion;
    }
  }

  private fillRemainingSectionQuestions(
    section: PatternWithSections['sections'][number],
    sectionAllocation: Map<number, number[]>,
    sortedChapters: number[],
    allocationMap: Map<number, Map<number, number[]>>,
    targetMarks: Map<number, number>,
  ): void {
    const totalAllocated = Array.from(sectionAllocation.values())
      .reduce((sum, marks) => sum + marks.length, 0);
    const remainingQuestions = section.total_questions - totalAllocated;

    if (remainingQuestions <= INITIAL_CHAPTER_MARKS) {
      return;
    }

    const chaptersNeedingMarks = this.getChaptersNeedingMarks(
      sortedChapters,
      allocationMap,
      targetMarks,
    );

    for (let i = 0; i < remainingQuestions; i++) {
      const chapterId = chaptersNeedingMarks[i % chaptersNeedingMarks.length];
      const currentAllocation = sectionAllocation.get(chapterId) ?? [];
      sectionAllocation.set(chapterId, [
        ...currentAllocation,
        section.marks_per_question,
      ]);
    }
  }

  private async allocateQuestions(
    pattern: PatternWithSections,
    chapterIds: number[],
    mediumIds: number[],
    targetMarks: Map<number, number>,
    questionOrigin?: QuestionOriginType
  ): Promise<Map<number, Map<number, number[]>>> {
    const allocationMap = this.initializeAllocationMap(pattern, chapterIds);

    const sortedSections = [...pattern.sections].sort((a, b) => 
      b.marks_per_question - a.marks_per_question
    );

    const possibleMarks = await this.calculatePossibleMarksPerChapter(pattern, chapterIds, mediumIds, questionOrigin);
    const sortedChapters = [...chapterIds].sort((a, b) => 
      (possibleMarks.get(a) || INITIAL_CHAPTER_MARKS) - (possibleMarks.get(b) || INITIAL_CHAPTER_MARKS)
    );

    for (const chapterId of sortedChapters) {
      const target = targetMarks.get(chapterId) || INITIAL_CHAPTER_MARKS;
      await this.allocateMinimumMarksForChapter(
        chapterId,
        sortedSections,
        target,
        allocationMap,
        mediumIds,
        questionOrigin,
      );
    }

    for (const section of sortedSections) {
      const sectionAllocation = allocationMap.get(section.id);
      if (!sectionAllocation) {
        continue;
      }
      this.fillRemainingSectionQuestions(
        section,
        sectionAllocation,
        sortedChapters,
        allocationMap,
        targetMarks,
      );
    }

    return allocationMap;
  }

  private async hasVerifiedQuestions(
    chapterId: number,
    questionTypeIds: number[],
    mediumIds: number[],
    questionOrigin?: QuestionOriginType
  ): Promise<boolean> {
    // Build where condition based on question origin
    let boardQuestionCondition = {};
    if (questionOrigin === 'board') {
      boardQuestionCondition = { board_question: true };
    } else if (questionOrigin === 'other') {
      boardQuestionCondition = { board_question: false };
    }

    const count = await this.prisma.question.count({
      where: {
        question_topics: {
          some: {
            topic: {
              chapter_id: chapterId
            }
          }
        },
        question_type_id: {
          in: questionTypeIds
        },
        question_texts: {
          some: {
            question_text_topics: {
              some: {
                instruction_medium_id: {
                  in: mediumIds
                },
                is_verified: true
              }
            }
          }
        },
        ...boardQuestionCondition
      }
    });
    
    return count >= MINIMUM_QUESTIONS_FOR_AVAILABILITY_CHECK;
  }

  private sumMarkValues(marks: number[]): number {
    return marks.reduce((a, b) => a + b, INITIAL_CHAPTER_MARKS);
  }

  private buildAllocatedChaptersFromSectionAllocation(
    sectionAllocation: Map<number, number[]>,
    chapterNameMap: Map<number, string>,
  ): Array<{ chapterId: number; chapterName: string; marks: number }> {
    return Array.from(sectionAllocation.entries())
      .filter(([, marks]) => marks.length > 0)
      .map(([chapterId, marks]) => ({
        chapterId,
        chapterName: chapterNameMap.get(chapterId) || `Chapter ${chapterId}`,
        marks: this.sumMarkValues(marks),
      }));
  }

  private buildSubsectionAllocationsFromAllocationMap(
    section: PatternWithSections['sections'][number],
    sectionAllocation: Map<number, number[]>,
    chapterNameMap: Map<number, string>,
  ): SubsectionAllocationDto[] {
    return section.subsection_question_types.map(sqt => ({
      subsectionQuestionTypeId: sqt.id,
      section_id: section.id,
      questionTypeName: sqt.question_type.type_name,
      sequentialNumber: sqt.seqencial_subquestion_number,
      question_type_id: sqt.question_type_id,
      question_type: {
        id: sqt.question_type.id,
        type_name: sqt.question_type.type_name,
      },
      allocatedChapters: this.buildAllocatedChaptersFromSectionAllocation(
        sectionAllocation,
        chapterNameMap,
      ),
    }));
  }

  private buildSectionAllocationFromMap(
    section: PatternWithSections['sections'][number],
    patternId: number,
    sectionAllocation: Map<number, number[]>,
    chapterNameMap: Map<number, string>,
  ): SectionAllocationDto {
    return {
      sectionId: section.id,
      pattern_id: patternId,
      sectionName: section.section_name,
      sequentialNumber: section.sequence_number,
      section_number: section.section_number,
      subSection: section.sub_section,
      totalQuestions: section.total_questions,
      mandotory_questions: section.mandotory_questions,
      marks_per_question: section.marks_per_question,
      absoluteMarks: section.total_questions * section.marks_per_question,
      totalMarks: section.mandotory_questions * section.marks_per_question,
      subsectionAllocations: this.buildSubsectionAllocationsFromAllocationMap(
        section,
        sectionAllocation,
        chapterNameMap,
      ),
    };
  }

  private buildChapterMarksFromAllocationMap(
    targetMarks: Map<number, number>,
    allocationMap: Map<number, Map<number, number[]>>,
    chapterNameMap: Map<number, string>,
  ): ChapterMarksDto[] {
    return Array.from(targetMarks.entries()).map(([chapterId]) => ({
      chapterId,
      chapterName: chapterNameMap.get(chapterId) || `Chapter ${chapterId}`,
      absoluteMarks: this.getTotalAllocatedMarksForChapter(chapterId, allocationMap),
    }));
  }

  async getTestPaperAllocationNew(filter: CreateTestPaperFilterDto): Promise<CreateTestPaperResponseDto> {
    const pattern = await this.prisma.pattern.findUnique({
      where: { id: filter.patternId },
      include: {
        sections: {
          include: {
            subsection_question_types: {
              include: {
                question_type: true
              }
            }
          }
        }
      }
    });

    if (!pattern) {
      throw new NotFoundException('Pattern not found');
    }

    const mediumDetails = await this.fetchInstructionMediumDetails(filter.mediumIds);

    const patternAbsoluteMarks = pattern.sections.reduce((total, section) => 
      total + (section.total_questions * section.marks_per_question), 0);

    const totalChapters = filter.chapterIds.length;
    const baseMarksPerChapter = Math.floor(patternAbsoluteMarks / totalChapters);
    const remainingMarks = patternAbsoluteMarks % totalChapters;

    const targetMarks = new Map<number, number>();
    for (const [index, chapterId] of filter.chapterIds.entries()) {
      targetMarks.set(chapterId, baseMarksPerChapter + (index < remainingMarks ? SINGLE_QUESTION_ALLOCATION : INITIAL_CHAPTER_MARKS));
    }

    const allocationMap = await this.allocateQuestions(
      pattern,
      filter.chapterIds,
      filter.mediumIds,
      targetMarks,
      filter.questionOrigin
    );

    const chapters = await this.prisma.chapter.findMany({
      where: {
        id: {
          in: filter.chapterIds
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    const chapterNameMap = new Map(chapters.map(ch => [ch.id, ch.name]));

    const sectionAllocations = pattern.sections.map(section =>
      this.buildSectionAllocationFromMap(
        section,
        pattern.id,
        allocationMap.get(section.id) ?? new Map(),
        chapterNameMap,
      ),
    );

    const chapterMarks = this.buildChapterMarksFromAllocationMap(
      targetMarks,
      allocationMap,
      chapterNameMap,
    );

    return {
      patternId: pattern.id,
      patternName: pattern.pattern_name,
      totalMarks: pattern.total_marks,
      absoluteMarks: patternAbsoluteMarks,
      questionOrigin: filter.questionOrigin,
      mediums: mediumDetails,
      sectionAllocations,
      chapterMarks
    };
  }

  /**
   * Validate that submitted passage groups are complete, then normalize each
   * section/subsection so grouped children occupy consecutive question_order
   * positions in group_order. Passage-linked remains an MCQ type concern only.
   */
  private extractPassageGroupIds(rows: any[]): number[] {
    return [
      ...new Set(
        rows
          .map((row) => row.question_group_id)
          .filter((id): id is number => typeof id === 'number'),
      ),
    ];
  }

  private validatePassageGroupSelection(rows: any[], group: {
    id: number;
    questions: { id: number; group_order: number | null }[];
  }): void {
    const selected = rows.filter((row) => row.question_group_id === group.id);
    const expectedIds = group.questions.map((question) => question.id);
    const selectedIds = new Set(selected.map((row) => row.question_id));
    if (
      selected.length !== expectedIds.length ||
      expectedIds.some((id) => !selectedIds.has(id))
    ) {
      throw new BadRequestException(
        `Passage group ${group.id} must be added as a complete group ` +
          `(${expectedIds.length} linked MCQs).`,
      );
    }
    const placementKeys = new Set(
      selected.map((row) => `${row.section_id}:${row.subsection_id}`),
    );
    if (placementKeys.size !== 1) {
      throw new BadRequestException(
        `All questions in passage group ${group.id} must be in the same section and subsection.`,
      );
    }
  }

  private async validatePassageGroups(rows: any[], groupIds: number[]): Promise<void> {
    const groups = await this.prisma.question_Group.findMany({
      where: { id: { in: groupIds } },
      select: {
        id: true,
        questions: {
          orderBy: { group_order: 'asc' },
          select: { id: true, group_order: true },
        },
      },
    });

    for (const group of groups) {
      this.validatePassageGroupSelection(rows, group);
    }
  }

  private groupRowsBySectionSubsection(rows: any[]): Map<string, any[]> {
    const buckets = new Map<string, any[]>();
    for (const row of rows) {
      const key = `${row.section_id}:${row.subsection_id}`;
      const bucket = buckets.get(key) || [];
      bucket.push(row);
      buckets.set(key, bucket);
    }
    return buckets;
  }

  private orderBucketRowsWithPassageGroups(bucketRows: any[]): any[] {
    bucketRows.sort((a, b) => a.question_order - b.question_order);
    const byGroup = new Map<number, any[]>();
    for (const row of bucketRows) {
      if (!row.question_group_id) {
        continue;
      }
      const members = byGroup.get(row.question_group_id) || [];
      members.push(row);
      byGroup.set(row.question_group_id, members);
    }

    const emittedGroups = new Set<number>();
    const ordered: any[] = [];
    for (const row of bucketRows) {
      if (!row.question_group_id) {
        ordered.push(row);
        continue;
      }
      if (emittedGroups.has(row.question_group_id)) {
        continue;
      }
      emittedGroups.add(row.question_group_id);
      ordered.push(
        ...(byGroup.get(row.question_group_id) || [row]).sort(
          (a, b) => (a.group_order || 0) - (b.group_order || 0),
        ),
      );
    }
    return ordered;
  }

  private normalizePassageGroupBucket(bucketRows: any[]): any[] {
    const ordered = this.orderBucketRowsWithPassageGroups(bucketRows);
    const normalized: any[] = [];
    for (const [index, row] of ordered.entries()) {
      row.question_order = index + 1;
      normalized.push(row);
    }
    return normalized;
  }

  private async normalizePassageGroupRows(rows: any[]): Promise<any[]> {
    const groupIds = this.extractPassageGroupIds(rows);
    if (!groupIds.length) {
      return rows;
    }

    await this.validatePassageGroups(rows, groupIds);

    const buckets = this.groupRowsBySectionSubsection(rows);
    const normalized: any[] = [];
    for (const bucketRows of buckets.values()) {
      normalized.push(...this.normalizePassageGroupBucket(bucketRows));
    }
    return normalized;
  }

  private validateOnlineTestPaperNegativeMarking(dto: CreateOnlineTestPaperDto): void {
    if (
      dto.negative_marking &&
      (!dto.negative_marks_per_question || dto.negative_marks_per_question <= 0)
    ) {
      throw new BadRequestException(
        'Negative marks per question must be provided and greater than 0 when negative marking is enabled',
      );
    }
  }

  private resolveTestPaperOriginType(
    questionSource?: CreateOnlineTestPaperDto['question_source'],
  ): 'board' | 'other' | 'both' {
    const questionSourceMapping = {
      board: 'board' as const,
      other: 'other' as const,
      both: 'both' as const,
    };

    return questionSource
      ? questionSourceMapping[questionSource]
      : 'both';
  }

  private buildOnlineTestPaperQuestionInsertData(
    questionsData: NonNullable<CreateOnlineTestPaperDto['questions_data']>,
    pattern: PatternWithSections,
    testPaperId: number,
  ): Array<{
    test_paper_id: number;
    question_id: number;
    question_text_id: number;
    section_id: number;
    subsection_id: number;
    question_order: number;
    marks: number;
    is_mandatory: boolean;
  }> {
    const questionInsertData = [];

    for (const sectionData of questionsData) {
      const sectionMarks = pattern.sections.find(s => s.id === sectionData.section_id)?.marks_per_question;
      if (!sectionMarks) {
        throw new BadRequestException(`Section with ID ${sectionData.section_id} not found in pattern`);
      }

      for (const subsectionData of sectionData.subsections || []) {
        for (const questionData of subsectionData.questions || []) {
          questionInsertData.push({
            test_paper_id: testPaperId,
            question_id: questionData.question_id,
            question_text_id: questionData.question_text_id,
            section_id: sectionData.section_id,
            subsection_id: subsectionData.subsection_question_type_id,
            question_order: questionData.question_order,
            marks: questionData.marks || sectionMarks,
            is_mandatory: true,
          });
        }
      }
    }

    return questionInsertData;
  }

  private async insertOnlineTestPaperQuestions(
    questionInsertData: Array<{
      test_paper_id: number;
      question_id: number;
      question_text_id: number;
      section_id: number;
      subsection_id: number;
      question_order: number;
      marks: number;
      is_mandatory: boolean;
    }>,
  ): Promise<number> {
    const questionIds = [...new Set(questionInsertData.map((q) => q.question_id))];
    const groupMeta = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, question_group_id: true, group_order: true },
    });
    const groupByQuestionId = new Map(
      groupMeta.map((q) => [q.id, q] as const),
    );
    const enriched = questionInsertData.map((row) => {
      const meta = groupByQuestionId.get(row.question_id);
      return {
        ...row,
        question_group_id: meta?.question_group_id ?? null,
        group_order: meta?.group_order ?? null,
      };
    });
    const normalized = await this.normalizePassageGroupRows(enriched);
    await this.prisma.test_Paper_Question.createMany({
      data: normalized,
    });
    return normalized.length;
  }

  private extractUniqueChapterIdsFromQuestionsData(
    questionsData: NonNullable<CreateOnlineTestPaperDto['questions_data']>,
  ): number[] {
    return [...new Set(
      questionsData
        .flatMap(section => section.subsections || [])
        .flatMap(subsection => subsection.questions || [])
        .map(question => question.chapter_id),
    )];
  }

  private async createTestPaperChapterAssociations(
    testPaperId: number,
    chapterIds: number[],
  ): Promise<void> {
    if (chapterIds.length === 0) {
      return;
    }

    const chapterAssociations = chapterIds.map(chapterId => ({
      test_paper_id: testPaperId,
      chapter_id: chapterId,
      weightage: 1,
    }));

    await this.prisma.test_Paper_Chapter.createMany({
      data: chapterAssociations,
    });
  }

  private parseChapterIdsFromDto(
    chapters: CreateOnlineTestPaperDto['chapters'],
  ): number[] {
    if (typeof chapters === 'string') {
      return chapters
        .split(',')
        .map(id => Number.parseInt(id.trim()))
        .filter(id => !Number.isNaN(id));
    }
    if (Array.isArray(chapters)) {
      return chapters.map(Number);
    }
    return [];
  }

  private buildOnlineTestPaperCreationResponse(
    testPaper: {
      id: number;
      name: string;
      duration_minutes: number | null;
      instructions: string | null;
      negative_marking: boolean;
      negative_marks_per_question: number | null;
      randomize_questions: boolean;
      randomize_options: boolean;
      is_online: boolean;
      created_at: Date;
      school: { id: number; name: string };
    },
    pattern: {
      id: number;
      pattern_name: string;
      total_marks: number;
      standard: { id: number; name: string };
      subject: { id: number; name: string };
    },
    createOnlineTestPaperDto: CreateOnlineTestPaperDto,
    questionCount: number,
  ): { message: string; testPaper: any } {
    return {
      message: questionCount > 0
        ? 'Online test paper created successfully with questions finalized'
        : 'Online test paper created successfully',
      testPaper: {
        id: testPaper.id,
        name: testPaper.name,
        duration_minutes: testPaper.duration_minutes,
        instructions: testPaper.instructions,
        negative_marking: testPaper.negative_marking,
        negative_marks_per_question: testPaper.negative_marks_per_question,
        randomize_questions: testPaper.randomize_questions,
        randomize_options: testPaper.randomize_options,
        is_online: testPaper.is_online,
        question_source: createOnlineTestPaperDto.question_source || 'both',
        question_count: questionCount,
        pattern: {
          id: pattern.id,
          name: pattern.pattern_name,
          total_marks: pattern.total_marks,
          standard: pattern.standard,
          subject: pattern.subject,
        },
        school: {
          id: testPaper.school.id,
          name: testPaper.school.name,
        },
        created_at: testPaper.created_at,
      },
    };
  }

  async createOnlineTestPaper(
    createOnlineTestPaperDto: CreateOnlineTestPaperDto,
    userId: number,
  ): Promise<{ message: string; testPaper: any }> {
    try {
      const membership = await this.prisma.institution_Membership.findFirst({
        where: { user_id: userId, status: 'active' },
        include: { institution: { include: { school: true } } },
      });
      const schoolId = membership?.institution?.school_id ?? null;
      const institutionId = membership?.institution_id ?? null;

      const pattern = await this.prisma.pattern.findUnique({
        where: { id: createOnlineTestPaperDto.pattern_id },
        include: {
          sections: {
            include: {
              subsection_question_types: {
                include: {
                  question_type: true,
                },
              },
            },
          },
          standard: {
            select: {
              id: true,
              name: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!pattern) {
        throw new BadRequestException('Pattern not found');
      }

      this.validateOnlineTestPaperNegativeMarking(createOnlineTestPaperDto);
      const testPaperOriginType = this.resolveTestPaperOriginType(createOnlineTestPaperDto.question_source);

      const testPaper = await this.prisma.test_Paper.create({
        data: {
          name: createOnlineTestPaperDto.name,
          exam_time: new Date('1970-01-01T00:00:00Z'),
          user_id: userId,
          school_id: schoolId,
          institution_id: institutionId,
          pattern_id: createOnlineTestPaperDto.pattern_id,
          test_paper_origin_type: testPaperOriginType,
          duration_minutes: createOnlineTestPaperDto.duration_minutes,
          instructions: createOnlineTestPaperDto.instructions,
          negative_marking: createOnlineTestPaperDto.negative_marking || false,
          negative_marks_per_question:
            createOnlineTestPaperDto.negative_marks_per_question,
          randomize_questions:
            createOnlineTestPaperDto.randomize_questions || false,
          randomize_options: createOnlineTestPaperDto.randomize_options || false,
          is_online: true,
        },
        include: {
          school: true,
        },
      });

      let questionCount = 0;
      if (createOnlineTestPaperDto.questions_data?.length) {
        const questionInsertData = this.buildOnlineTestPaperQuestionInsertData(
          createOnlineTestPaperDto.questions_data,
          pattern,
          testPaper.id,
        );

        if (questionInsertData.length > 0) {
          questionCount = await this.insertOnlineTestPaperQuestions(questionInsertData);
          const uniqueChapterIds = this.extractUniqueChapterIdsFromQuestionsData(
            createOnlineTestPaperDto.questions_data,
          );
          await this.createTestPaperChapterAssociations(testPaper.id, uniqueChapterIds);
        }
      }

      if (
        !createOnlineTestPaperDto.questions_data &&
        createOnlineTestPaperDto.chapters &&
        createOnlineTestPaperDto.chapters.length > 0
      ) {
        const chapterIds = this.parseChapterIdsFromDto(createOnlineTestPaperDto.chapters);
        await this.createTestPaperChapterAssociations(testPaper.id, chapterIds);
      }

      return this.buildOnlineTestPaperCreationResponse(
        testPaper,
        pattern,
        createOnlineTestPaperDto,
        questionCount,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create online test paper: ${error.message}`,
      );
    }
  }

  async getOnlineTestPapers(userId: number, category?: string) {
    try {
      // Get user's org/school information (optional — free teachers & competitive mocks have no school)
      const membership = await this.prisma.institution_Membership.findFirst({
        where: { user_id: userId, status: 'active' },
        include: { institution: true },
      });
      const schoolId = membership?.institution?.school_id ?? null;

      // Fetch online test papers for this user:
      // board papers scoped to their school + school-less competitive/entrance mocks
      const testPapers = await this.prisma.test_Paper.findMany({
        where: {
          user_id: userId,
          is_online: true,
          OR: [
            ...(schoolId ? [{ school_id: schoolId }] : []),
            { school_id: null },
          ],
        },
        include: {
          exam_program: { include: { exam_body: { include: { exam_category: true } } } },
          exam_stage: { select: { id: true, name: true } },
          paper_template: {
            select: {
              id: true,
              name: true,
              total_marks: true,
              sections: {
                orderBy: { sequence_number: 'asc' },
                select: {
                  id: true,
                  name: true,
                  total_questions: true,
                  marks_per_question: true,
                  time_limit_minutes: true,
                  answer_format: true,
                },
              },
            },
          },
          pattern: {
            select: {
              id: true,
              pattern_name: true,
              total_marks: true,
              standard: {
                select: {
                  id: true,
                  name: true,
                },
              },
              subject: {
                select: {
                  id: true,
                  name: true,
                },
              },
              sections: {
                select: {
                  id: true,
                  marks_per_question: true,
                },
              },
            },
          },
          test_paper_chapters: {
            include: {
              chapter: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          test_paper_questions: {
            select: {
              id: true,
              marks: true,
            },
          },
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transform the data to include calculated fields.
      // Board papers derive metadata from pattern; competitive/entrance mocks
      // from exam_program + paper_template. exam_category drives the UI tabs.
      const transformedTestPapers = testPapers.map(testPaper => {
        const questionCount = testPaper.test_paper_questions?.length || 0;
        const chapters = testPaper.test_paper_chapters?.map(tpc => ({
          id: tpc.chapter.id,
          name: tpc.chapter.name,
        })) || [];

        const marksPerQuestion =
          testPaper.pattern?.sections?.[0]?.marks_per_question ??
          testPaper.paper_template?.sections?.[0]?.marks_per_question ??
          1;

        const examCategory = testPaper.pattern
          ? 'BOARD'
          : testPaper.exam_program?.exam_body?.exam_category?.code ?? 'BOARD';

        return {
          id: testPaper.id,
          name: testPaper.name,
          duration_minutes: testPaper.duration_minutes,
          instructions: testPaper.instructions,
          negative_marking: testPaper.negative_marking,
          negative_marks_per_question: testPaper.negative_marks_per_question,
          randomize_questions: testPaper.randomize_questions,
          randomize_options: testPaper.randomize_options,
          is_online: testPaper.is_online,
          is_open_practice: testPaper.is_open_practice,
          created_at: testPaper.created_at,
          pattern: testPaper.pattern,
          exam_category: examCategory,
          exam_program: testPaper.exam_program
            ? {
                id: testPaper.exam_program.id,
                name: testPaper.exam_program.name,
                exam_body: testPaper.exam_program.exam_body?.abbreviation,
              }
            : null,
          exam_stage: testPaper.exam_stage,
          paper_template: testPaper.paper_template,
          total_marks:
            testPaper.pattern?.total_marks ?? testPaper.paper_template?.total_marks ?? 0,
          standard_name:
            testPaper.pattern?.standard?.name ?? testPaper.exam_stage?.name ?? '',
          subject_name:
            testPaper.pattern?.subject?.name ?? testPaper.exam_program?.name ?? '',
          question_count: questionCount,
          marks_per_question: marksPerQuestion,
          chapters: chapters,
          school: testPaper.school,
        };
      });

      if (category) {
        return transformedTestPapers.filter(p => p.exam_category === category);
      }
      return transformedTestPapers;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch online test papers: ${error.message}`,
      );
    }
  }

  private mapMcqOptionForResponse(option: {
    id: number;
    option_text: string | null;
    image: unknown;
    is_correct: boolean;
  }) {
    return {
      id: option.id,
      option_text: option.option_text,
      image: option.image,
      is_correct: option.is_correct,
    };
  }

  private mapMatchPairForResponse(pair: {
    id: number;
    left_text: string | null;
    right_text: string | null;
    left_image: unknown;
    right_image: unknown;
  }) {
    return {
      id: pair.id,
      left_text: pair.left_text,
      right_text: pair.right_text,
      left_image: pair.left_image,
      right_image: pair.right_image,
    };
  }

  private buildTestPaperQuestionData(tpq: any) {
    const questionTopic = tpq.question.question_topics[0];
    const chapter = questionTopic?.topic?.chapter;
    const topic = questionTopic?.topic;

    return {
      id: tpq.id,
      question_id: tpq.question_id,
      question_text_id: tpq.question_text_id,
      question_order: tpq.question_order,
      marks: tpq.marks,
      is_mandatory: tpq.is_mandatory,
      question_group_id:
        tpq.question_group_id ?? tpq.question.question_group_id ?? null,
      group_order: tpq.group_order ?? tpq.question.group_order ?? null,
      passage_text: tpq.question.question_group?.passage_text ?? null,
      passage_image: tpq.question.question_group?.passage_image ?? null,
      question_type: tpq.question.question_type,
      question_text: tpq.question_text.question_text,
      question_image: tpq.question_text.image,
      chapter: chapter ? {
        id: chapter.id,
        name: chapter.name,
      } : null,
      topic: topic ? {
        id: topic.id,
        name: topic.name,
      } : null,
      mcq_options: tpq.question_text.mcq_options.map((option: any) =>
        this.mapMcqOptionForResponse(option),
      ),
      match_pairs: tpq.question_text.match_pairs.map((pair: any) =>
        this.mapMatchPairForResponse(pair),
      ),
    };
  }

  private groupTestPaperQuestionsBySection(testPaperQuestions: any[]): Map<number, Map<number, any[]>> {
    const sectionMap = new Map<number, Map<number, any[]>>();

    for (const tpq of testPaperQuestions) {
      const sectionId = tpq.section_id;
      const subsectionId = tpq.subsection_id;

      let subsectionMap = sectionMap.get(sectionId);
      if (!subsectionMap) {
        subsectionMap = new Map();
        sectionMap.set(sectionId, subsectionMap);
      }

      let questions = subsectionMap.get(subsectionId);
      if (!questions) {
        questions = [];
        subsectionMap.set(subsectionId, questions);
      }

      questions.push(this.buildTestPaperQuestionData(tpq));
    }

    return sectionMap;
  }

  private buildPatternSectionsResponse(
    pattern: NonNullable<Awaited<ReturnType<CreateTestPaperService['fetchTestPaperForQuestions']>>['pattern']>,
    sectionMap: Map<number, Map<number, any[]>>,
  ) {
    return pattern.sections.map(patternSection => {
      const sectionQuestions = sectionMap.get(patternSection.id) || new Map();
      const subsections = patternSection.subsection_question_types.map(sqt => ({
        id: sqt.id,
        sequential_number: sqt.seqencial_subquestion_number,
        question_type: sqt.question_type,
        questions: sectionQuestions.get(sqt.id) || [],
      }));

      return {
        id: patternSection.id,
        section_name: patternSection.section_name,
        sequence_number: patternSection.sequence_number,
        section_number: patternSection.section_number,
        sub_section: patternSection.sub_section,
        total_questions: patternSection.total_questions,
        mandotory_questions: patternSection.mandotory_questions,
        marks_per_question: patternSection.marks_per_question,
        subsections,
      };
    });
  }

  private buildTemplateSectionsResponse(
    paperTemplate: NonNullable<Awaited<ReturnType<CreateTestPaperService['fetchTestPaperForQuestions']>>['paper_template']>,
    sectionMap: Map<number, Map<number, any[]>>,
  ) {
    return paperTemplate.sections.map(templateSection => {
      const sectionQuestions = sectionMap.get(templateSection.id) || new Map();
      const questions: any[] = [];
      for (const qs of sectionQuestions.values()) {
        questions.push(...qs);
      }

      return {
        id: templateSection.id,
        section_name: templateSection.name,
        sequence_number: templateSection.sequence_number,
        section_number: templateSection.sequence_number,
        sub_section: templateSection.answer_format,
        total_questions: templateSection.total_questions,
        mandotory_questions: templateSection.mandatory_questions,
        marks_per_question: templateSection.marks_per_question,
        subsections: [
          {
            id: templateSection.id,
            sequential_number: 1,
            question_type: { id: 0, type_name: templateSection.answer_format },
            questions,
          },
        ],
      };
    });
  }

  private buildTestPaperQuestionsPatternSummary(
    testPaper: Awaited<ReturnType<CreateTestPaperService['fetchTestPaperForQuestions']>>,
    totalMarks: number,
  ) {
    if (testPaper.pattern) {
      return {
        id: testPaper.pattern.id,
        name: testPaper.pattern.pattern_name,
        total_marks: testPaper.pattern.total_marks,
        standard: testPaper.pattern.standard,
        subject: testPaper.pattern.subject,
      };
    }

    return {
      id: testPaper.paper_template?.id ?? 0,
      name: testPaper.paper_template?.name ?? testPaper.exam_program?.name ?? 'Mock Test',
      total_marks: testPaper.paper_template?.total_marks ?? totalMarks,
      standard: { id: 0, name: testPaper.exam_stage?.name ?? '' },
      subject: { id: 0, name: testPaper.exam_program?.name ?? '' },
    };
  }

  private fetchTestPaperForQuestions(testPaperId: number, userId: number) {
    return this.prisma.test_Paper.findFirst({
      where: {
        id: testPaperId,
        user_id: userId,
        is_online: true,
      },
      select: {
        id: true,
        name: true,
        duration_minutes: true,
        instructions: true,
        negative_marking: true,
        negative_marks_per_question: true,
        randomize_questions: true,
        randomize_options: true,
        pattern: {
          select: {
            id: true,
            pattern_name: true,
            total_marks: true,
            standard: {
              select: {
                id: true,
                name: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
            sections: {
              select: {
                id: true,
                section_name: true,
                sequence_number: true,
                section_number: true,
                sub_section: true,
                total_questions: true,
                mandotory_questions: true,
                marks_per_question: true,
                subsection_question_types: {
                  select: {
                    id: true,
                    seqencial_subquestion_number: true,
                    question_type: {
                      select: {
                        id: true,
                        type_name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        exam_program: { select: { id: true, name: true } },
        exam_stage: { select: { id: true, name: true } },
        paper_template: {
          select: {
            id: true,
            name: true,
            total_marks: true,
            sections: {
              orderBy: { sequence_number: 'asc' },
              select: {
                id: true,
                name: true,
                sequence_number: true,
                total_questions: true,
                mandatory_questions: true,
                marks_per_question: true,
                answer_format: true,
                time_limit_minutes: true,
              },
            },
          },
        },
      },
    });
  }

  async getTestPaperQuestions(testPaperId: number, userId: number) {
    try {
      const testPaper = await this.fetchTestPaperForQuestions(testPaperId, userId);

      if (!testPaper) {
        throw new NotFoundException('Test paper not found or you do not have permission to access it');
      }

      const testPaperQuestions = await this.prisma.test_Paper_Question.findMany({
        where: {
          test_paper_id: testPaperId,
        },
        include: {
          question: {
            include: {
              question_group: {
                include: {
                  passage_image: {
                    select: {
                      id: true,
                      image_url: true,
                      original_filename: true,
                    },
                  },
                },
              },
              question_type: {
                select: {
                  id: true,
                  type_name: true,
                },
              },
              question_topics: {
                include: {
                  topic: {
                    include: {
                      chapter: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          question_text: {
            include: {
              image: {
                select: {
                  id: true,
                  image_url: true,
                  original_filename: true,
                },
              },
              mcq_options: {
                include: {
                  image: {
                    select: {
                      id: true,
                      image_url: true,
                      original_filename: true,
                    },
                  },
                },
                orderBy: {
                  id: 'asc',
                },
              },
              match_pairs: {
                include: {
                  left_image: {
                    select: {
                      id: true,
                      image_url: true,
                      original_filename: true,
                    },
                  },
                  right_image: {
                    select: {
                      id: true,
                      image_url: true,
                      original_filename: true,
                    },
                  },
                },
                orderBy: {
                  id: 'asc',
                },
              },
            },
          },
        },
        orderBy: [
          { section_id: 'asc' },
          { question_order: 'asc' },
        ],
      });

      const sectionMap = this.groupTestPaperQuestionsBySection(testPaperQuestions);

      let sections: any[] = [];
      if (testPaper.pattern) {
        sections = this.buildPatternSectionsResponse(testPaper.pattern, sectionMap);
      } else if (testPaper.paper_template) {
        sections = this.buildTemplateSectionsResponse(testPaper.paper_template, sectionMap);
      }

      const totalQuestions = testPaperQuestions.length;
      const totalMarks = testPaperQuestions.reduce((sum, tpq) => sum + (tpq.marks || 0), 0);

      return {
        test_paper: {
          id: testPaper.id,
          name: testPaper.name,
          duration_minutes: testPaper.duration_minutes,
          instructions: testPaper.instructions,
          negative_marking: testPaper.negative_marking,
          negative_marks_per_question: testPaper.negative_marks_per_question,
          randomize_questions: testPaper.randomize_questions,
          randomize_options: testPaper.randomize_options,
          pattern: this.buildTestPaperQuestionsPatternSummary(testPaper, totalMarks),
          school: testPaper.school,
          total_questions: totalQuestions,
          total_marks: totalMarks,
        },
        sections,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch test paper questions: ${error.message}`,
      );
    }
  }

  async deleteOnlineTestPaper(testPaperId: number, userId: number) {
    try {
      // First verify that the test paper exists and belongs to the user
      const testPaper = await this.prisma.test_Paper.findFirst({
        where: {
          id: testPaperId,
          user_id: userId,
          is_online: true,
        },
        include: {
          test_paper_questions: {
            select: { id: true }
          },
          test_assignments: {
            select: { id: true }
          },
          _count: {
            select: {
              test_assignments: true,
              test_paper_questions: true
            }
          }
        },
      });

      if (!testPaper) {
        throw new NotFoundException('Online test paper not found or you do not have permission to delete it');
      }

      // Check if there are any active test attempts that would prevent deletion
      const activeAttempts = await this.prisma.test_Attempt.count({
        where: {
          test_assignment: {
            test_paper_id: testPaperId
          },
          status: {
            in: ['in_progress', 'completed']
          }
        }
      });

      if (activeAttempts > 0) {
        throw new BadRequestException(
          `Cannot delete test paper. It has ${activeAttempts} student attempt(s). Please contact students to complete or abandon their attempts first.`
        );
      }

      // Count what will be deleted for the response
      const questionsCount = testPaper._count.test_paper_questions;
      const assignmentsCount = testPaper._count.test_assignments;
      
      // Count attempts that will be deleted (abandoned attempts)
      const attemptsCount = await this.prisma.test_Attempt.count({
        where: {
          test_assignment: {
            test_paper_id: testPaperId
          }
        }
      });

      // Delete the test paper - this will cascade delete:
      // - test_paper_questions (onDelete: Cascade)
      // - test_assignments (onDelete: Cascade) 
      // - test_attempts (through test_assignments cascade)
      // - student_answers (through test_attempts cascade)
      // - student_results (through test_attempts cascade)
      // - test_paper_chapters (onDelete: Cascade)
      await this.prisma.test_Paper.delete({
        where: { id: testPaperId }
      });

      return {
        message: 'Online test paper deleted successfully',
        deleted_questions_count: questionsCount,
        deleted_assignments_count: assignmentsCount,
        deleted_attempts_count: attemptsCount
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete online test paper: ${error.message}`,
      );
    }
  }
} 