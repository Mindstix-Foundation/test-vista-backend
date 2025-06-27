import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestPaperFilterDto, CreateTestPaperResponseDto, SectionAllocationDto, SubsectionAllocationDto, ChapterMarksDto, ChapterInfoDto } from './dto/create-test-paper.dto';
import { CreateOnlineTestPaperDto } from './dto/create-online-test-paper.dto';
import { FilterChaptersDto } from './dto/filter-chapters.dto';
import { ChapterMarksResponseDto } from './dto/chapter-marks-response.dto';
import { Prisma } from '@prisma/client';

// Define type alias for the question origin union type
type QuestionOriginType = 'board' | 'other' | 'both';

// Constants for allocation logic
const QUESTIONS_REQUIRED_PER_ALLOCATION = 2;
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

@Injectable()
export class CreateTestPaperService {
  constructor(private prisma: PrismaService) {}

  private generateRandomSequence<T>(items: T[]): T[] {
    const sequence = [...items];
    for (let i = sequence.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }
    return sequence;
  }

  private getRandomChaptersByMarks(chapterMarksMap: Map<number, number>): number[] {
    // Convert map to array of [chapterId, marks] pairs
    const chaptersWithMarks = Array.from(chapterMarksMap.entries());
    
    // Sort by marks in ascending order
    chaptersWithMarks.sort((a, b) => a[1] - b[1]);
    
    // Group chapters by marks
    const groupedChapters = new Map<number, number[]>();
    for (const [chapterId, marks] of chaptersWithMarks) {
      if (!groupedChapters.has(marks)) {
        groupedChapters.set(marks, []);
      }
      groupedChapters.get(marks)!.push(chapterId);
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
      chapterQuestionTypeMap.get(chapterId)!.set(questionTypeId, count);
    }

    return chapterQuestionTypeMap;
  }

  async getTestPaperAllocation(filter: CreateTestPaperFilterDto): Promise<CreateTestPaperResponseDto> {
    // 1. Get pattern with all necessary relations
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

    // Fetch Medium details
    let mediumDetails: { id: number; instruction_medium: string }[] = [];
    if (filter.mediumIds && filter.mediumIds.length > 0) {
      try {
        mediumDetails = await this.prisma.instruction_Medium.findMany({
          where: { id: { in: filter.mediumIds } },
          select: { id: true, instruction_medium: true },
        });
      } catch (error) {
        // Continue without medium details if fetch fails
      }
    }

    // Fetch chapter names first
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

    // 2. Get chapter question type counts
    const chapterQuestionTypeMap = await this.getChapterQuestionTypeCounts(
      filter.chapterIds,
      filter.mediumIds,
      filter.questionOrigin
    );

    // 3. Initialize chapter marks tracking
    const chapterMarksMap = new Map<number, number>();
    filter.chapterIds.forEach(chapterId => chapterMarksMap.set(chapterId, INITIAL_CHAPTER_MARKS));

    // 4. Create random sections array
    const randomSections = this.generateRandomSequence(pattern.sections);

    // 5. Process each section
    const sectionAllocations: SectionAllocationDto[] = [];

    for (const section of randomSections) {
      const sectionAbsoluteMarks = section.total_questions * section.marks_per_question;
      const sectionTotalMarks = section.mandotory_questions * section.marks_per_question;

      // Create random chapters array based on current marks
      let randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);

      const subsectionAllocations: SubsectionAllocationDto[] = [];

      for (const sqt of section.subsection_question_types) {
        const allocatedChapters: ChapterInfoDto[] = [];
        let remainingQuestions = section.subsection_question_types.length === 1 
          ? section.total_questions 
          : SINGLE_QUESTION_ALLOCATION;

        while (remainingQuestions > 0) {
          if (randomChapters.length === 0) {
            randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);
          }

          let currentIndex = 0;
          let chapterAllocated = false;

          while (currentIndex < randomChapters.length && !chapterAllocated) {
            const currentChapterId = randomChapters[currentIndex];
            const chapterQuestionTypes = chapterQuestionTypeMap.get(currentChapterId);

            if (chapterQuestionTypes && chapterQuestionTypes.has(sqt.question_type_id)) {
              const questionCount = chapterQuestionTypes.get(sqt.question_type_id)!;
              
              if (questionCount > INITIAL_CHAPTER_MARKS) {
                allocatedChapters.push({
                  chapterId: currentChapterId,
                  chapterName: chapterNameMap.get(currentChapterId) || `Chapter ${currentChapterId}`
                });

                const currentMarks = chapterMarksMap.get(currentChapterId) || INITIAL_CHAPTER_MARKS;
                chapterMarksMap.set(currentChapterId, currentMarks + section.marks_per_question);

                chapterQuestionTypes.set(sqt.question_type_id, questionCount - QUESTIONS_REQUIRED_PER_ALLOCATION);
                
                remainingQuestions--;
                chapterAllocated = true;
                
                // Remove allocated chapter from array
                randomChapters.splice(currentIndex, 1);
              } else {
                currentIndex++;
              }
            } else {
              currentIndex++;
            }
          }

          // If we reached the end of array without allocating, check if it's possible to allocate at all
          if (!chapterAllocated) {
            // Check if chapter has remaining questions of this type
            const isAnyQuestionAvailable = filter.chapterIds.some(chapterId => {
              const types = chapterQuestionTypeMap.get(chapterId);
              return types && (types.get(sqt.question_type_id) || INITIAL_CHAPTER_MARKS) > 0;
            });

            if (!isAnyQuestionAvailable) {
              throw new BadRequestException(
                `Insufficient verified questions for type '${sqt.question_type.type_name}' ` +
                `available across all selected mediums (${filter.mediumIds.join(', ')}) ` +
                `in the chosen chapters (${filter.chapterIds.join(', ')}). Cannot generate test paper.`
              );
            }

            randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);
          }
        }

        subsectionAllocations.push({
          subsectionQuestionTypeId: sqt.id,
          section_id: section.id,
          questionTypeName: sqt.question_type.type_name,
          sequentialNumber: sqt.seqencial_subquestion_number,
          question_type_id: sqt.question_type_id,
          question_type: {
            id: sqt.question_type.id,
            type_name: sqt.question_type.type_name
          },
          allocatedChapters
        });
      }

      sectionAllocations.push({
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
        subsectionAllocations
      });
    }

    // 6. Format chapter marks
    const chapterMarks: ChapterMarksDto[] = Array.from(chapterMarksMap.entries()).map(([chapterId, absoluteMarks]) => ({
      chapterId,
      chapterName: chapterNameMap.get(chapterId) || `Chapter ${chapterId}`,
      absoluteMarks
    }));

    // 7. Calculate total marks
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

  async getChaptersWithPossibleMarks(filterDto: FilterChaptersDto): Promise<ChapterMarksResponseDto[]> {
    const { patternId, chapterIds, mediumIds, questionOrigin = 'both' } = filterDto;

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

    // Build the board_question condition based on questionOrigin
    let boardQuestionCondition = '';
    if (questionOrigin === 'board') {
      boardQuestionCondition = 'AND q.board_question = true';
    } else if (questionOrigin === 'other') {
      boardQuestionCondition = 'AND q.board_question = false';
    }
    // For 'both', we don't add any condition

    const boardQuestionSql = Prisma.sql([boardQuestionCondition]);
    
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
      ${boardQuestionSql}
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
      let absoluteMarks = INITIAL_CHAPTER_MARKS;
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
          const canAllocate = Math.floor(questionCount / QUESTIONS_REQUIRED_PER_ALLOCATION) + (questionCount % QUESTIONS_REQUIRED_PER_ALLOCATION > 0 ? SINGLE_QUESTION_ALLOCATION : INITIAL_CHAPTER_MARKS);
          
          if (canAllocate >= totalQuestions) {
            absoluteMarks += totalQuestions * marksPerQuestion;
          } else {
            absoluteMarks += canAllocate * marksPerQuestion;
          }
        } else {
          // If section has multiple subsection question types
          let remainingQuestions = totalQuestions;
          let sectionMarks = INITIAL_CHAPTER_MARKS;

          for (const sqt of subsectionQuestionTypes) {
            if (remainingQuestions <= INITIAL_CHAPTER_MARKS) break;

            const questionTypeId = sqt.question_type_id;
            const questionCount = chapterQuestionTypes.get(questionTypeId) || INITIAL_CHAPTER_MARKS;

            if (questionCount >= QUESTIONS_REQUIRED_PER_ALLOCATION) {
              // Subtract required questions and add marks
              sectionMarks += marksPerQuestion;
              remainingQuestions--;
              chapterQuestionTypes.set(questionTypeId, questionCount - QUESTIONS_REQUIRED_PER_ALLOCATION);
            }
          }

          absoluteMarks += sectionMarks;
        }
      }

      result.push({
        chapterId: chapter.id,
        chapterName: chapter.name,
        absoluteMarks,
        questionOrigin
      });
    }

    return result;
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
            // Calculate possible marks for this question type
            const questionsPossible = Math.min(
              section.total_questions,
              Math.floor(availability.question_count / MINIMUM_QUESTIONS_FOR_AVAILABILITY_CHECK)
            );
            possibleMarks += questionsPossible * section.marks_per_question;
          }
        }
      }
      
      possibleMarksMap.set(chapterId, possibleMarks);
    }
    
    return possibleMarksMap;
  }

  private async allocateQuestions(
    pattern: PatternWithSections,
    chapterIds: number[],
    mediumIds: number[],
    targetMarks: Map<number, number>,
    questionOrigin?: QuestionOriginType
  ): Promise<Map<number, Map<number, number[]>>> {
    const allocationMap = new Map<number, Map<number, number[]>>();
    
    // Initialize allocation map
    for (const section of pattern.sections) {
      const sectionMap = new Map<number, number[]>();
      for (const chapterId of chapterIds) {
        sectionMap.set(chapterId, []);
      }
      allocationMap.set(section.id, sectionMap);
    }
    
    // Sort sections by marks per question (descending)
    const sortedSections = [...pattern.sections].sort((a, b) => 
      b.marks_per_question - a.marks_per_question
    );
    
    // Sort chapters by possible marks (ascending)
    const possibleMarks = await this.calculatePossibleMarksPerChapter(pattern, chapterIds, mediumIds, questionOrigin);
    const sortedChapters = [...chapterIds].sort((a, b) => 
      (possibleMarks.get(a) || INITIAL_CHAPTER_MARKS) - (possibleMarks.get(b) || INITIAL_CHAPTER_MARKS)
    );
    
    // First pass: Allocate minimum possible marks
    for (const chapterId of sortedChapters) {
      const target = targetMarks.get(chapterId) || INITIAL_CHAPTER_MARKS;
      let allocatedMarks = INITIAL_CHAPTER_MARKS;
      
      // Allocate high value questions first
      for (const section of sortedSections) {
        if (allocatedMarks >= target) break;
        
        const remainingMarks = target - allocatedMarks;
        const marksPerQuestion = section.marks_per_question;
        const maxQuestions = Math.floor(remainingMarks / marksPerQuestion);
        
        if (maxQuestions > INITIAL_CHAPTER_MARKS) {
          // Check if chapter has verified questions for this section
          const hasQuestions = await this.hasVerifiedQuestions(
            chapterId,
            section.subsection_question_types.map(sqt => sqt.question_type_id),
            mediumIds,
            questionOrigin
          );
          
          if (hasQuestions) {
            // Allocate at least one question to each section
            const questionsToAllocate = Math.min(
              maxQuestions,
              section.total_questions,
              Math.floor(remainingMarks / marksPerQuestion)
            );
            
            if (questionsToAllocate > INITIAL_CHAPTER_MARKS) {
              const currentAllocation = allocationMap.get(section.id)!.get(chapterId)!;
              allocationMap.get(section.id)!.set(chapterId, [
                ...currentAllocation,
                ...Array(questionsToAllocate).fill(marksPerQuestion)
              ]);
              
              allocatedMarks += questionsToAllocate * marksPerQuestion;
            }
          }
        }
      }
    }
    
    // Second pass: Fill remaining marks
    for (const section of sortedSections) {
      const sectionAllocation = allocationMap.get(section.id)!;
      const totalAllocated = Array.from(sectionAllocation.values())
        .reduce((sum, marks) => sum + marks.length, 0);
      
      const remainingQuestions = section.total_questions - totalAllocated;
      
      if (remainingQuestions > INITIAL_CHAPTER_MARKS) {
        // Find chapters that need more marks
        const chaptersNeedingMarks = sortedChapters.filter(chapterId => {
          const allocated = Array.from(allocationMap.values())
            .reduce((sum, sectionMap) => 
              sum + (sectionMap.get(chapterId) || []).reduce((a, b) => a + b, INITIAL_CHAPTER_MARKS), INITIAL_CHAPTER_MARKS);
          return allocated < (targetMarks.get(chapterId) || INITIAL_CHAPTER_MARKS);
        });
        
        // Allocate remaining questions
        for (let i = 0; i < remainingQuestions; i++) {
          const chapterId = chaptersNeedingMarks[i % chaptersNeedingMarks.length];
          const currentAllocation = sectionAllocation.get(chapterId)!;
          sectionAllocation.set(chapterId, [
            ...currentAllocation,
            section.marks_per_question
          ]);
        }
      }
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

  async getTestPaperAllocationNew(filter: CreateTestPaperFilterDto): Promise<CreateTestPaperResponseDto> {
    // 1. Get pattern with all necessary relations
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

    // Fetch Medium details (Need to fetch here too)
    let mediumDetails: { id: number; instruction_medium: string }[] = [];
    if (filter.mediumIds && filter.mediumIds.length > 0) {
      try {
        mediumDetails = await this.prisma.instruction_Medium.findMany({
          where: { id: { in: filter.mediumIds } },
          select: { id: true, instruction_medium: true },
        });
      } catch (error) {
        // Continue without medium details if fetch fails
      }
    }

    // 2. Calculate absolute marks
    const patternAbsoluteMarks = pattern.sections.reduce((total, section) => 
      total + (section.total_questions * section.marks_per_question), 0);

    // 3. Calculate target marks per chapter
    const totalChapters = filter.chapterIds.length;
    const baseMarksPerChapter = Math.floor(patternAbsoluteMarks / totalChapters);
    const remainingMarks = patternAbsoluteMarks % totalChapters;

    const targetMarks = new Map<number, number>();
    filter.chapterIds.forEach((chapterId, index) => {
      targetMarks.set(chapterId, baseMarksPerChapter + (index < remainingMarks ? SINGLE_QUESTION_ALLOCATION : INITIAL_CHAPTER_MARKS));
    });

    // 4. Allocate questions
    const allocationMap = await this.allocateQuestions(
      pattern,
      filter.chapterIds,
      filter.mediumIds,
      targetMarks,
      filter.questionOrigin
    );

    // Get chapter names
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

    // 5. Format response
    const sectionAllocations: SectionAllocationDto[] = pattern.sections.map(section => {
      const sectionAllocation = allocationMap.get(section.id)!;
      const subsectionAllocations: SubsectionAllocationDto[] = section.subsection_question_types.map(sqt => ({
        subsectionQuestionTypeId: sqt.id,
        section_id: section.id,
        questionTypeName: sqt.question_type.type_name,
        sequentialNumber: sqt.seqencial_subquestion_number,
        question_type_id: sqt.question_type_id,
        question_type: {
          id: sqt.question_type.id,
          type_name: sqt.question_type.type_name
        },
        allocatedChapters: Array.from(sectionAllocation.entries())
          .filter(([, marks]) => marks.length > 0)
          .map(([chapterId, marks]) => ({
            chapterId,
            chapterName: chapterNameMap.get(chapterId) || `Chapter ${chapterId}`,
            marks: marks.reduce((a, b) => a + b, INITIAL_CHAPTER_MARKS)
          }))
      }));

      return {
        sectionId: section.id,
        pattern_id: pattern.id,
        sectionName: section.section_name,
        sequentialNumber: section.sequence_number,
        section_number: section.section_number,
        subSection: section.sub_section,
        totalQuestions: section.total_questions,
        mandotory_questions: section.mandotory_questions,
        marks_per_question: section.marks_per_question,
        absoluteMarks: section.total_questions * section.marks_per_question,
        totalMarks: section.mandotory_questions * section.marks_per_question,
        subsectionAllocations
      };
    });

    // 6. Calculate chapter marks
    const chapterMarks: ChapterMarksDto[] = Array.from(targetMarks.entries()).map(([chapterId, target]) => {
      const allocatedMarks = Array.from(allocationMap.values())
        .reduce((sum, sectionMap) => 
          sum + (sectionMap.get(chapterId) || []).reduce((a, b) => a + b, INITIAL_CHAPTER_MARKS), INITIAL_CHAPTER_MARKS);
      
      return {
        chapterId,
        chapterName: chapterNameMap.get(chapterId) || `Chapter ${chapterId}`,
        absoluteMarks: allocatedMarks
      };
    });

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

  async createOnlineTestPaper(
    createOnlineTestPaperDto: CreateOnlineTestPaperDto,
    userId: number,
  ): Promise<{ message: string; testPaper: any }> {
    try {
      // Get user's school information
      const userSchool = await this.prisma.user_School.findFirst({
        where: { user_id: userId },
        include: { school: true },
      });

      if (!userSchool) {
        throw new BadRequestException('User is not associated with any school');
      }

      // Validate pattern exists
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

      // Validate negative marking values
      if (
        createOnlineTestPaperDto.negative_marking &&
        (!createOnlineTestPaperDto.negative_marks_per_question ||
          createOnlineTestPaperDto.negative_marks_per_question <= 0)
      ) {
        throw new BadRequestException(
          'Negative marks per question must be provided and greater than 0 when negative marking is enabled',
        );
      }

      // Map question_source to TestPaperOriginType
      const questionSourceMapping = {
        board: 'board' as const,
        other: 'other' as const,
        both: 'both' as const,
      };

      const testPaperOriginType = createOnlineTestPaperDto.question_source
        ? questionSourceMapping[createOnlineTestPaperDto.question_source]
        : 'both';

      // Create the online test paper
      const testPaper = await this.prisma.test_Paper.create({
        data: {
          name: createOnlineTestPaperDto.name,
          exam_time: new Date('1970-01-01T00:00:00Z'), // Default time for online tests
          user_id: userId,
          school_id: userSchool.school_id,
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

      // Handle questions data if provided
      let questionCount = 0;
      if (createOnlineTestPaperDto.questions_data && createOnlineTestPaperDto.questions_data.length > 0) {
        // Prepare question data for insertion
        const questionInsertData = [];

        for (const sectionData of createOnlineTestPaperDto.questions_data) {
          const sectionMarks = pattern.sections.find(s => s.id === sectionData.section_id)?.marks_per_question;
          if (!sectionMarks) {
            throw new BadRequestException(`Section with ID ${sectionData.section_id} not found in pattern`);
          }

          for (const subsectionData of sectionData.subsections || []) {
            for (const questionData of subsectionData.questions || []) {
              questionInsertData.push({
                test_paper_id: testPaper.id,
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

        // Insert all questions
        if (questionInsertData.length > 0) {
          await this.prisma.test_Paper_Question.createMany({
            data: questionInsertData,
          });
          questionCount = questionInsertData.length;
        }

        // Also create Test_Paper_Chapter associations for unique chapters
        if (questionInsertData.length > 0) {
          const uniqueChapterIds = [...new Set(
            createOnlineTestPaperDto.questions_data
              .flatMap(section => section.subsections || [])
              .flatMap(subsection => subsection.questions || [])
              .map(question => question.chapter_id)
          )];

          if (uniqueChapterIds.length > 0) {
            const chapterAssociations = uniqueChapterIds.map(chapterId => ({
              test_paper_id: testPaper.id,
              chapter_id: chapterId,
              weightage: 1, // Default weightage
            }));

            await this.prisma.test_Paper_Chapter.createMany({
              data: chapterAssociations,
            });
          }
        }
      }

      // If no questions_data but chapters are provided, create Test_Paper_Chapter associations
      if (!createOnlineTestPaperDto.questions_data && createOnlineTestPaperDto.chapters && createOnlineTestPaperDto.chapters.length > 0) {
        let chapterIds: number[] = [];
        
        // Handle chapters field (can be string "1,2,3" or array [1,2,3])
        if (typeof createOnlineTestPaperDto.chapters === 'string') {
          chapterIds = createOnlineTestPaperDto.chapters
            .split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id));
        } else if (Array.isArray(createOnlineTestPaperDto.chapters)) {
          chapterIds = createOnlineTestPaperDto.chapters.map(id => Number(id));
        }

        if (chapterIds.length > 0) {
          const chapterAssociations = chapterIds.map(chapterId => ({
            test_paper_id: testPaper.id,
            chapter_id: chapterId,
            weightage: 1, // Default weightage
          }));

          await this.prisma.test_Paper_Chapter.createMany({
            data: chapterAssociations,
          });
        }
      }

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
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create online test paper: ${error.message}`,
      );
    }
  }

  async getOnlineTestPapers(userId: number) {
    try {
      // Get user's school information
      const userSchool = await this.prisma.user_School.findFirst({
        where: { user_id: userId },
        include: { school: true },
      });

      if (!userSchool) {
        throw new BadRequestException('User is not associated with any school');
      }

      // Fetch online test papers for this user
      const testPapers = await this.prisma.test_Paper.findMany({
        where: {
          user_id: userId,
          school_id: userSchool.school_id,
          is_online: true,
        },
        include: {
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

      // Transform the data to include calculated fields
      const transformedTestPapers = testPapers.map(testPaper => {
        const questionCount = testPaper.test_paper_questions?.length || 0;
        const chapters = testPaper.test_paper_chapters?.map(tpc => ({
          id: tpc.chapter.id,
          name: tpc.chapter.name,
        })) || [];

        // Get marks per question from the pattern's first section (assuming uniform marks)
        const marksPerQuestion = testPaper.pattern?.sections?.[0]?.marks_per_question || 1;

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
          created_at: testPaper.created_at,
          pattern: testPaper.pattern,
          question_count: questionCount,
          marks_per_question: marksPerQuestion,
          chapters: chapters,
          school: testPaper.school,
        };
      });

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

  async getTestPaperQuestions(testPaperId: number, userId: number) {
    try {
      // First verify that the test paper belongs to the user
      const testPaper = await this.prisma.test_Paper.findFirst({
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
        },
      });

      if (!testPaper) {
        throw new NotFoundException('Test paper not found or you do not have permission to access it');
      }

      // Fetch all questions for this test paper
      const testPaperQuestions = await this.prisma.test_Paper_Question.findMany({
        where: {
          test_paper_id: testPaperId,
        },
        include: {
          question: {
            include: {
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

      // Group questions by section and subsection
      const sectionMap = new Map();
      
      for (const tpq of testPaperQuestions) {
        const sectionId = tpq.section_id;
        const subsectionId = tpq.subsection_id;
        
        if (!sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, new Map());
        }
        
        if (!sectionMap.get(sectionId).has(subsectionId)) {
          sectionMap.get(sectionId).set(subsectionId, []);
        }
        
        // Get chapter and topic information
        const questionTopic = tpq.question.question_topics[0]; // Assuming one topic per question
        const chapter = questionTopic?.topic?.chapter;
        const topic = questionTopic?.topic;

        const questionData = {
          id: tpq.id,
          question_id: tpq.question_id,
          question_text_id: tpq.question_text_id,
          question_order: tpq.question_order,
          marks: tpq.marks,
          is_mandatory: tpq.is_mandatory,
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
          mcq_options: tpq.question_text.mcq_options.map(option => ({
            id: option.id,
            option_text: option.option_text,
            image: option.image,
            is_correct: option.is_correct,
          })),
          match_pairs: tpq.question_text.match_pairs.map(pair => ({
            id: pair.id,
            left_text: pair.left_text,
            right_text: pair.right_text,
            left_image: pair.left_image,
            right_image: pair.right_image,
          })),
        };
        
        sectionMap.get(sectionId).get(subsectionId).push(questionData);
      }

      // Transform the grouped data into the response format
      const sections = [];
      
      for (const patternSection of testPaper.pattern.sections) {
        const sectionQuestions = sectionMap.get(patternSection.id) || new Map();
        
        const subsections = [];
        
        for (const sqt of patternSection.subsection_question_types) {
          const subsectionQuestions = sectionQuestions.get(sqt.id) || [];
          
          subsections.push({
            id: sqt.id,
            sequential_number: sqt.seqencial_subquestion_number,
            question_type: sqt.question_type,
            questions: subsectionQuestions,
          });
        }
        
        sections.push({
          id: patternSection.id,
          section_name: patternSection.section_name,
          sequence_number: patternSection.sequence_number,
          section_number: patternSection.section_number,
          sub_section: patternSection.sub_section,
          total_questions: patternSection.total_questions,
          mandotory_questions: patternSection.mandotory_questions,
          marks_per_question: patternSection.marks_per_question,
          subsections: subsections,
        });
      }

      // Calculate totals
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
          pattern: {
            id: testPaper.pattern.id,
            name: testPaper.pattern.pattern_name,
            total_marks: testPaper.pattern.total_marks,
            standard: testPaper.pattern.standard,
            subject: testPaper.pattern.subject,
          },
          school: testPaper.school,
          total_questions: totalQuestions,
          total_marks: totalMarks,
        },
        sections: sections,
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
} 