import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterChaptersDto } from './dto/filter-chapters.dto';
import { ChapterMarksResponseDto } from './dto/chapter-marks-response.dto';
import { ChapterMarksRangeFilterDto, ChapterMarksRangeResponseDto } from './dto/chapter-marks-range.dto';

@Injectable()
export class ChapterMarksRangeService {
  private readonly logger = new Logger(ChapterMarksRangeService.name);

  constructor(private prisma: PrismaService) {}

  private boundedUniqueSums(nums: number[], limits: number[]): number[] {
    this.logger.debug(`Calculating bounded unique sums for nums: ${nums}, limits: ${limits}`);
    
    // Calculate maximum possible sum
    const maxSum = nums.reduce((sum, num, idx) => sum + (num * limits[idx]), 0);
    this.logger.debug(`Maximum possible sum: ${maxSum}`);
    
    const dp = new Array(maxSum + 1).fill(false);
    dp[0] = true;

    for (let idx = 0; idx < nums.length; idx++) {
      const num = nums[idx];
      let count = limits[idx];
      this.logger.debug(`Processing num: ${num}, count: ${count}`);
      
      // Binary optimization
      const temp = [];
      let k = 1;
      while (count > 0) {
        const use = Math.min(k, count);
        temp.push(use);
        count -= use;
        k *= 2;
      }
      this.logger.debug(`Binary components: ${temp}`);

      for (const use of temp) {
        const val = use * num;
        this.logger.debug(`Processing value: ${val} (${use} * ${num})`);
        for (let i = maxSum; i >= val; i--) {
          if (dp[i - val]) {
            dp[i] = true;
          }
        }
      }
    }

    const result = Array.from({ length: maxSum }, (_, i) => i + 1).filter(i => dp[i]);
    this.logger.debug(`Possible sums: ${result}`);
    return result;
  }

  async getChaptersWithPossibleMarks(filterDto: FilterChaptersDto): Promise<ChapterMarksResponseDto[]> {
    const { patternId, chapterIds, mediumIds } = filterDto;

    // Fetch pattern and validate
    const pattern = await this.fetchPattern(patternId);
    
    // Fetch chapters
    const chapters = await this.fetchChapters(chapterIds);
    
    // Get question counts for chapters and question types
    const chapterQuestionTypeMap = await this.getQuestionTypeCountMap(chapterIds, mediumIds);
    
    // Process chapters to calculate marks
    return this.calculateChapterMarks(chapters, pattern, chapterQuestionTypeMap);
  }

  /**
   * Fetches pattern with its sections and subsection question types
   */
  private async fetchPattern(patternId: number) {
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

    return pattern;
  }

  /**
   * Fetches chapters by their IDs
   */
  private async fetchChapters(chapterIds: number[]) {
    return this.prisma.chapter.findMany({
      where: {
        id: { in: chapterIds }
      }
    });
  }

  /**
   * Creates a map of chapter IDs to question type counts
   */
  private async getQuestionTypeCountMap(chapterIds: number[], mediumIds: number[]) {
    // Get question counts for each chapter and question type
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
      GROUP BY c.id, qt.id
    `;

    // Create a map of chapter question type counts
    const map = new Map<number, Map<number, number>>();
    
    for (const row of questionCounts) {
      const chapterId = Number(row.chapter_id);
      const questionTypeId = Number(row.question_type_id);
      const count = Number(row.count);

      if (!map.has(chapterId)) {
        map.set(chapterId, new Map());
      }
      
      map.get(chapterId)!.set(questionTypeId, count);
    }
    
    return map;
  }

  /**
   * Calculate marks for each chapter based on pattern and available questions
   */
  private calculateChapterMarks(
    chapters: any[], 
    pattern: any, 
    chapterQuestionTypeMap: Map<number, Map<number, number>>
  ): ChapterMarksResponseDto[] {
    const result: ChapterMarksResponseDto[] = [];

    for (const chapter of chapters) {
      const chapterQuestionTypes = chapterQuestionTypeMap.get(chapter.id) || new Map();
      const absoluteMarks = this.calculateAbsoluteMarks(pattern.sections, chapterQuestionTypes);
      
      result.push({
        chapterId: chapter.id,
        chapterName: chapter.name,
        absoluteMarks
      });
    }

    return result;
  }

  /**
   * Calculate absolute marks based on pattern sections and available question types
   */
  private calculateAbsoluteMarks(
    sections: any[],
    chapterQuestionTypes: Map<number, number>
  ): number {
    let totalMarks = 0;
    
    // Create a copy of the question types map to avoid modifying the original
    const availableQuestions = new Map(chapterQuestionTypes);
    
    for (const section of sections) {
      totalMarks += this.calculateSectionMarks(section, availableQuestions);
    }
    
    return totalMarks;
  }

  /**
   * Calculate marks for a single section
   */
  private calculateSectionMarks(
    section: any,
    availableQuestions: Map<number, number>
  ): number {
    const { total_questions, marks_per_question, subsection_question_types } = section;
    
    return subsection_question_types.length === 1
      ? this.calculateSingleQuestionTypeMarks(subsection_question_types[0], total_questions, marks_per_question, availableQuestions)
      : this.calculateMultipleQuestionTypeMarks(subsection_question_types, total_questions, marks_per_question, availableQuestions);
  }

  /**
   * Calculate marks for a section with a single question type
   */
  private calculateSingleQuestionTypeMarks(
    subsectionQuestionType: any,
    totalQuestions: number,
    marksPerQuestion: number,
    availableQuestions: Map<number, number>
  ): number {
    const questionTypeId = subsectionQuestionType.question_type_id;
    const questionCount = availableQuestions.get(questionTypeId) || 0;
    
    // Calculate how many questions can be allocated
    const canAllocate = Math.floor(questionCount / 2) + (questionCount % 2 > 0 ? 1 : 0);
    
    return Math.min(canAllocate, totalQuestions) * marksPerQuestion;
  }

  /**
   * Calculate marks for a section with multiple question types
   */
  private calculateMultipleQuestionTypeMarks(
    subsectionQuestionTypes: any[],
    totalQuestions: number,
    marksPerQuestion: number,
    availableQuestions: Map<number, number>
  ): number {
    let remainingQuestions = totalQuestions;
    let sectionMarks = 0;

    for (const sqt of subsectionQuestionTypes) {
      if (remainingQuestions <= 0) break;

      const questionTypeId = sqt.question_type_id;
      const questionCount = availableQuestions.get(questionTypeId) || 0;

      if (questionCount >= 2) {
        // Subtract 2 questions and add marks
        sectionMarks += marksPerQuestion;
        remainingQuestions--;
        availableQuestions.set(questionTypeId, questionCount - 2);
      }
    }

    return sectionMarks;
  }

  async getChapterMarksRanges(filterDto: ChapterMarksRangeFilterDto): Promise<ChapterMarksRangeResponseDto[]> {
    const { patternId, chapterIds, mediumIds, questionOrigin = 'both' } = filterDto;
    this.logger.debug(`Processing request for patternId: ${patternId}, chapterIds: ${chapterIds}, mediumIds: ${mediumIds}, questionOrigin: ${questionOrigin}`);

    // Validate and load data
    if (mediumIds.length === 0) {
      this.logger.warn('No medium IDs provided for marks range calculation. Returning empty results.');
      return [];
    }

    // Fetch required data
    const pattern = await this.fetchPattern(patternId);
    const chapters = await this.fetchChapters(chapterIds);
    const chapterQuestionTypeMap = await this.getQuestionTypeCountMapForRange(chapterIds, mediumIds, questionOrigin);

    // Process the chapters to calculate possible marks ranges
    return this.calculateChapterMarksRanges(chapters, pattern, chapterQuestionTypeMap);
  }

  /**
   * Fetches question type counts for chapters considering medium requirements and question origin
   */
  private async getQuestionTypeCountMapForRange(
    chapterIds: number[],
    mediumIds: number[],
    questionOrigin: string
  ): Promise<Map<number, Map<number, number>>> {
    const requiredMediumCount = mediumIds.length;
    const questionCounts = await this.executeQuestionCountQuery(chapterIds, mediumIds, requiredMediumCount, questionOrigin);
    
    this.logger.debug(`Found ${questionCounts.length} question count records after applying filters: mediums and questionOrigin=${questionOrigin}`);
    
    // Create a map of chapter question type counts
    const chapterQuestionTypeMap = new Map<number, Map<number, number>>();
    
    for (const row of questionCounts) {
      const chapterId = Number(row.chapter_id);
      const questionTypeId = Number(row.question_type_id);
      const count = Number(row.count);
      
      if (!chapterQuestionTypeMap.has(chapterId)) {
        chapterQuestionTypeMap.set(chapterId, new Map());
      }
      
      chapterQuestionTypeMap.get(chapterId)!.set(questionTypeId, count);
    }
    
    this.logger.debug(`Processed question counts for ${chapterQuestionTypeMap.size} chapters`);
    return chapterQuestionTypeMap;
  }

  /**
   * Executes the appropriate query based on question origin
   */
  private async executeQuestionCountQuery(
    chapterIds: number[],
    mediumIds: number[],
    requiredMediumCount: number,
    questionOrigin: string
  ) {
    let baseQuery = this.getBaseQueryForQuestionCount(questionOrigin);
    
    return this.prisma.$queryRaw<{ chapter_id: bigint, question_type_id: bigint, count: bigint }[]>`
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
          ${baseQuery}
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
  }

  /**
   * Returns the SQL condition for question origin filter
   */
  private getBaseQueryForQuestionCount(questionOrigin: string): string {
    if (questionOrigin === 'board') {
      return 'AND q.board_question = true';
    } else if (questionOrigin === 'other') {
      return 'AND q.board_question = false';
    }
    return ''; // Both board and non-board questions
  }

  /**
   * Processes all chapters to calculate possible marks ranges
   */
  private calculateChapterMarksRanges(
    chapters: any[],
    pattern: any,
    chapterQuestionTypeMap: Map<number, Map<number, number>>
  ): ChapterMarksRangeResponseDto[] {
    const result: ChapterMarksRangeResponseDto[] = [];
    
    for (const chapter of chapters) {
      this.logger.debug(`Processing chapter: ${chapter.name} (ID: ${chapter.id})`);
      
      const chapterData = this.processChapterForMarksRange(chapter, pattern, chapterQuestionTypeMap);
      result.push(chapterData);
    }
    
    this.logger.debug(`Processed ${result.length} chapters successfully`);
    return result;
  }

  /**
   * Processes a single chapter to calculate its marks range
   */
  private processChapterForMarksRange(
    chapter: any,
    pattern: any,
    chapterQuestionTypeMap: Map<number, Map<number, number>>
  ): ChapterMarksRangeResponseDto {
    const chapterQuestionTypes = chapterQuestionTypeMap.get(chapter.id) || new Map();
    
    // Calculate nums and limits for bounded unique sums
    const { nums, limits } = this.calculateNumsAndLimits(pattern.sections, chapterQuestionTypes);
    
    this.logger.debug(`Chapter ${chapter.name} - nums: ${nums}, limits: ${limits}`);
    
    // Calculate possible marks using bounded unique sums
    const possibleMarks = this.boundedUniqueSums(nums, limits);
    this.logger.debug(`Chapter ${chapter.name} - Possible marks: ${possibleMarks}`);
    
    return {
      chapterId: chapter.id,
      chapterName: chapter.name,
      possibleMarks,
      minMarks: possibleMarks.length > 0 ? possibleMarks[0] : 0,
      maxMarks: possibleMarks.length > 0 ? possibleMarks[possibleMarks.length - 1] : 0
    };
  }

  /**
   * Calculates nums and limits arrays for bounded unique sums
   */
  private calculateNumsAndLimits(
    sections: any[],
    chapterQuestionTypes: Map<number, number>
  ): { nums: number[], limits: number[] } {
    const nums: number[] = [];
    const limits: number[] = [];
    
    for (const section of sections) {
      this.processSection(section, chapterQuestionTypes, nums, limits);
    }
    
    return { nums, limits };
  }

  /**
   * Processes a section to update nums and limits arrays
   */
  private processSection(
    section: any,
    chapterQuestionTypes: Map<number, number>,
    nums: number[],
    limits: number[]
  ): void {
    this.logger.debug(`Processing section with ${section.subsection_question_types.length} question types`);
    
    const marksPerQuestion = section.marks_per_question;
    const totalQuestions = section.total_questions;
    const subsectionQuestionTypes = section.subsection_question_types;
    
    if (subsectionQuestionTypes.length === 1) {
      this.processSingleQuestionTypeSection(
        subsectionQuestionTypes[0],
        totalQuestions,
        marksPerQuestion,
        chapterQuestionTypes,
        nums,
        limits
      );
    } else {
      this.processMultipleQuestionTypeSection(
        subsectionQuestionTypes,
        totalQuestions,
        marksPerQuestion,
        chapterQuestionTypes,
        nums,
        limits
      );
    }
  }

  /**
   * Processes a section with a single question type
   */
  private processSingleQuestionTypeSection(
    subsectionQuestionType: any,
    totalQuestions: number,
    marksPerQuestion: number,
    chapterQuestionTypes: Map<number, number>,
    nums: number[],
    limits: number[]
  ): void {
    const questionTypeId = subsectionQuestionType.question_type_id;
    const questionCount = chapterQuestionTypes.get(questionTypeId) || 0;
    const canAllocate = Math.floor(questionCount / 2) + (questionCount % 2 > 0 ? 1 : 0);
    
    this.logger.debug(`Single question type - QuestionTypeId: ${questionTypeId}, Count: ${questionCount}, CanAllocate: ${canAllocate}`);
    
    if (canAllocate > 0) {
      nums.push(marksPerQuestion);
      limits.push(Math.min(canAllocate, totalQuestions));
    }
  }

  /**
   * Processes a section with multiple question types
   */
  private processMultipleQuestionTypeSection(
    subsectionQuestionTypes: any[],
    totalQuestions: number,
    marksPerQuestion: number,
    chapterQuestionTypes: Map<number, number>,
    nums: number[],
    limits: number[]
  ): void {
    // Make a copy of question types to avoid modifying the original
    const tempQuestionTypes = new Map(chapterQuestionTypes);
    const totalAllocatable = this.calculateTotalAllocatable(
      subsectionQuestionTypes,
      totalQuestions,
      tempQuestionTypes
    );
    
    this.logger.debug(`Total allocatable questions: ${totalAllocatable}`);
    
    if (totalAllocatable > 0) {
      nums.push(marksPerQuestion);
      limits.push(totalAllocatable);
    }
  }

  /**
   * Calculates total allocatable questions for multiple question type sections
   */
  private calculateTotalAllocatable(
    subsectionQuestionTypes: any[],
    totalQuestions: number,
    questionTypes: Map<number, number>
  ): number {
    let remainingQuestions = totalQuestions;
    let totalAllocatable = 0;
    
    for (const sqt of subsectionQuestionTypes) {
      if (remainingQuestions <= 0) break;
      
      const questionTypeId = sqt.question_type_id;
      const questionCount = questionTypes.get(questionTypeId) || 0;
      
      if (questionCount >= 2) {
        totalAllocatable++;
        remainingQuestions--;
        questionTypes.set(questionTypeId, questionCount - 2);
      }
    }
    
    return totalAllocatable;
  }
} 