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

    // Get pattern details with sections
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

    // Get chapters
    const chapters = await this.prisma.chapter.findMany({
      where: {
        id: { in: chapterIds }
      }
    });

    const result: ChapterMarksResponseDto[] = [];

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

    // Process each chapter
    for (const chapter of chapters) {
      let absoluteMarks = 0;
      const chapterQuestionTypes = chapterQuestionTypeMap.get(chapter.id) || new Map();

      // Process each section in the pattern
      for (const section of pattern.sections) {
        const totalQuestions = section.total_questions;
        const marksPerQuestion = section.marks_per_question;
        const subsectionQuestionTypes = section.subsection_question_types;

        if (subsectionQuestionTypes.length === 1) {
          // If section has only one subsection question type
          const questionTypeId = subsectionQuestionTypes[0].question_type_id;
          const questionCount = chapterQuestionTypes.get(questionTypeId) || 0;

          // Calculate how many questions can be allocated
          const canAllocate = Math.floor(questionCount / 3) + (questionCount % 3 > 0 ? 1 : 0);
          
          if (canAllocate >= totalQuestions) {
            absoluteMarks += totalQuestions * marksPerQuestion;
          } else {
            absoluteMarks += canAllocate * marksPerQuestion;
          }
        } else {
          // If section has multiple subsection question types
          let remainingQuestions = totalQuestions;
          let sectionMarks = 0;

          for (const sqt of subsectionQuestionTypes) {
            if (remainingQuestions <= 0) break;

            const questionTypeId = sqt.question_type_id;
            const questionCount = chapterQuestionTypes.get(questionTypeId) || 0;

            if (questionCount >= 3) {
              // Subtract 3 questions and add marks
              sectionMarks += marksPerQuestion;
              remainingQuestions--;
              chapterQuestionTypes.set(questionTypeId, questionCount - 3);
            }
          }

          absoluteMarks += sectionMarks;
        }
      }

      result.push({
        chapterId: chapter.id,
        chapterName: chapter.name,
        absoluteMarks
      });
    }

    return result;
  }

  async getChapterMarksRanges(filterDto: ChapterMarksRangeFilterDto): Promise<ChapterMarksRangeResponseDto[]> {
    const { patternId, chapterIds, mediumIds } = filterDto;
    this.logger.debug(`Processing request for patternId: ${patternId}, chapterIds: ${chapterIds}, mediumIds: ${mediumIds}`);

    // Get pattern details with sections
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
      this.logger.error(`Pattern not found for id: ${patternId}`);
      throw new NotFoundException('Pattern not found');
    }

    this.logger.debug(`Found pattern with ${pattern.sections.length} sections`);

    // Get chapters
    const chapters = await this.prisma.chapter.findMany({
      where: {
        id: { in: chapterIds }
      }
    });

    this.logger.debug(`Found ${chapters.length} chapters`);

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

    this.logger.debug(`Found ${questionCounts.length} question count records`);

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

    const result: ChapterMarksRangeResponseDto[] = [];

    // Process each chapter
    for (const chapter of chapters) {
      this.logger.debug(`Processing chapter: ${chapter.name} (ID: ${chapter.id})`);
      
      const chapterQuestionTypes = chapterQuestionTypeMap.get(chapter.id) || new Map();
      const nums: number[] = [];
      const limits: number[] = [];

      // Process each section in the pattern
      for (const section of pattern.sections) {
        this.logger.debug(`Processing section with ${section.subsection_question_types.length} question types`);
        
        const marksPerQuestion = section.marks_per_question;
        const totalQuestions = section.total_questions;
        const subsectionQuestionTypes = section.subsection_question_types;

        if (subsectionQuestionTypes.length === 1) {
          // Single question type section
          const questionTypeId = subsectionQuestionTypes[0].question_type_id;
          const questionCount = chapterQuestionTypes.get(questionTypeId) || 0;
          const canAllocate = Math.floor(questionCount / 3) + (questionCount % 3 > 0 ? 1 : 0);
          
          this.logger.debug(`Single question type - QuestionTypeId: ${questionTypeId}, Count: ${questionCount}, CanAllocate: ${canAllocate}`);
          
          if (canAllocate > 0) {
            nums.push(marksPerQuestion);
            limits.push(Math.min(canAllocate, totalQuestions));
          }
        } else {
          // Multiple question type section
          let remainingQuestions = totalQuestions;
          let totalAllocatable = 0;
          let tempQuestionTypes = new Map(chapterQuestionTypes);

          for (const sqt of subsectionQuestionTypes) {
            if (remainingQuestions <= 0) break;

            const questionTypeId = sqt.question_type_id;
            const questionCount = tempQuestionTypes.get(questionTypeId) || 0;

            if (questionCount >= 3) {
              // Subtract 3 questions and add marks
              totalAllocatable++;
              remainingQuestions--;
              tempQuestionTypes.set(questionTypeId, questionCount - 3);
            }
          }
          
          this.logger.debug(`Total allocatable questions: ${totalAllocatable}`);
          
          if (totalAllocatable > 0) {
            nums.push(marksPerQuestion);
            limits.push(totalAllocatable);
          }
        }
      }

      this.logger.debug(`Chapter ${chapter.name} - nums: ${nums}, limits: ${limits}`);

      // Calculate possible marks using bounded unique sums
      const possibleMarks = this.boundedUniqueSums(nums, limits);
      this.logger.debug(`Chapter ${chapter.name} - Possible marks: ${possibleMarks}`);

      result.push({
        chapterId: chapter.id,
        chapterName: chapter.name,
        possibleMarks,
        minMarks: possibleMarks.length > 0 ? possibleMarks[0] : 0,
        maxMarks: possibleMarks.length > 0 ? possibleMarks[possibleMarks.length - 1] : 0
      });
    }

    this.logger.debug(`Processed ${result.length} chapters successfully`);
    return result;
  }
} 