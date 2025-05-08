import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestPaperFilterDto, CreateTestPaperResponseDto, SectionAllocationDto, SubsectionAllocationDto, ChapterMarksDto, ChapterInfoDto } from './dto/create-test-paper.dto';
import { FilterChaptersDto } from './dto/filter-chapters.dto';
import { ChapterMarksResponseDto } from './dto/chapter-marks-response.dto';
import { Prisma } from '@prisma/client';

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
    for (const [marks, chapters] of groupedChapters) {
      if (chapters.length > 1) {
        // Randomize chapters with same marks
        result.push(...this.generateRandomSequence(chapters));
      } else {
        // Single chapter in group, no need to randomize
        result.push(chapters[0]);
      }
    }
    
    console.log('Grouped chapters by marks:', 
      Array.from(groupedChapters.entries()).map(([marks, chapters]) => ({
        marks,
        chapters: chapters.join(', ')
      }))
    );
    console.log('Final random chapters array:', result);
    
    return result;
  }

  private async getChapterQuestionTypeCounts(
    chapterIds: number[],
    mediumIds: number[],
    questionOrigin?: 'board' | 'other' | 'both'
  ): Promise<Map<number, Map<number, number>>> {
    console.log('Getting chapter question type counts for chapters:', chapterIds);
    console.log('Medium IDs:', mediumIds);
    console.log('Question Origin:', questionOrigin || 'both');

    // Ensure mediumIds array is not empty to avoid SQL errors
    if (mediumIds.length === 0) {
      console.warn('No medium IDs provided. Returning empty map.');
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
    // For 'both', we don't add any condition

    const boardQuestionSql = Prisma.sql([boardQuestionCondition]);

    const result = await this.prisma.$queryRaw<{ chapter_id: bigint, question_type_id: bigint, count: bigint }[]>`
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


    console.log('Raw SQL result (aggregated):', aggregatedResult);

    const chapterQuestionTypeMap = new Map<number, Map<number, number>>();
    
    for (const row of aggregatedResult) {
      const chapterId = Number(row.chapter_id);
      const questionTypeId = Number(row.question_type_id);
      const count = Number(row.count);
      
      console.log(`Chapter ${chapterId} has ${count} questions of type ${questionTypeId}`);
      
      if (!chapterQuestionTypeMap.has(chapterId)) {
        chapterQuestionTypeMap.set(chapterId, new Map());
      }
      chapterQuestionTypeMap.get(chapterId)!.set(questionTypeId, count);
    }

    console.log('Final chapter question type map:', 
      Array.from(chapterQuestionTypeMap.entries()).map(([chapterId, types]) => ({
        chapterId,
        questionTypes: Array.from(types.entries())
      }))
    );

    return chapterQuestionTypeMap;
  }

  async getTestPaperAllocation(filter: CreateTestPaperFilterDto): Promise<CreateTestPaperResponseDto> {
    console.log('Starting test paper allocation with filter:', filter);

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
      console.error('Pattern not found for ID:', filter.patternId);
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
        // console.error is better for backend logs than logger.warn
        console.error(`Could not fetch medium details for IDs: ${filter.mediumIds}`, error);
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

    console.log('Found pattern:', {
      id: pattern.id,
      name: pattern.pattern_name,
      sections: pattern.sections.map(s => ({
        id: s.id,
        name: s.section_name,
        totalQuestions: s.total_questions,
        marksPerQuestion: s.marks_per_question,
        subsectionTypes: s.subsection_question_types.map(sqt => ({
          id: sqt.id,
          typeId: sqt.question_type_id,
          typeName: sqt.question_type.type_name
        }))
      }))
    });

    // 2. Get chapter question type counts
    const chapterQuestionTypeMap = await this.getChapterQuestionTypeCounts(
      filter.chapterIds,
      filter.mediumIds,
      filter.questionOrigin
    );

    // 3. Initialize chapter marks tracking
    const chapterMarksMap = new Map<number, number>();
    filter.chapterIds.forEach(chapterId => chapterMarksMap.set(chapterId, 0));
    console.log('Initialized chapter marks map:', Array.from(chapterMarksMap.entries()));

    // 4. Create random sections array
    const randomSections = this.generateRandomSequence(pattern.sections);
    console.log('Random sections order:', randomSections.map(s => s.section_name));

    // 5. Process each section
    const sectionAllocations: SectionAllocationDto[] = [];

    for (const section of randomSections) {
      console.log(`\nProcessing Section: ${section.section_name}`);
      console.log(`Total Questions: ${section.total_questions}`);
      console.log(`Number of Subsections: ${section.subsection_question_types.length}`);

      const sectionAbsoluteMarks = section.total_questions * section.marks_per_question;
      const sectionTotalMarks = section.mandotory_questions * section.marks_per_question;

      // Create random chapters array based on current marks
      let randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);
      console.log('Initial random chapters for section:', randomChapters);

      const subsectionAllocations: SubsectionAllocationDto[] = [];

      for (const sqt of section.subsection_question_types) {
        console.log(`\nProcessing Question Type: ${sqt.question_type.type_name}`);
        const allocatedChapters: ChapterInfoDto[] = [];
        let remainingQuestions = section.subsection_question_types.length === 1 
          ? section.total_questions 
          : 1;
        
        console.log(`Questions to allocate for this subsection: ${remainingQuestions}`);

        while (remainingQuestions > 0) {
          if (randomChapters.length === 0) {
            console.log('Regenerating random chapters array');
            randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);
            console.log('New random chapters:', randomChapters);
          }

          let currentIndex = 0;
          let chapterAllocated = false;

          while (currentIndex < randomChapters.length && !chapterAllocated) {
            const currentChapterId = randomChapters[currentIndex];
            const chapterQuestionTypes = chapterQuestionTypeMap.get(currentChapterId);
            
            console.log(`Trying Chapter ID: ${currentChapterId} at index ${currentIndex}`);
            console.log('Chapter question types:', chapterQuestionTypes ? 
              Array.from(chapterQuestionTypes.entries()) : 'No question types found');

            if (chapterQuestionTypes && chapterQuestionTypes.has(sqt.question_type_id)) {
              const questionCount = chapterQuestionTypes.get(sqt.question_type_id)!;
              
              if (questionCount > 0) {
                console.log(`✓ Allocated Chapter ID: ${currentChapterId} for ${sqt.question_type.type_name}`);
                allocatedChapters.push({
                  chapterId: currentChapterId,
                  chapterName: chapterNameMap.get(currentChapterId) || `Chapter ${currentChapterId}`
                });

                const currentMarks = chapterMarksMap.get(currentChapterId) || 0;
                chapterMarksMap.set(currentChapterId, currentMarks + section.marks_per_question);
                console.log(`Updated marks for Chapter ${currentChapterId}: ${currentMarks} -> ${currentMarks + section.marks_per_question}`);

                chapterQuestionTypes.set(sqt.question_type_id, questionCount - 2);
                console.log(`Updated question count for Chapter ${currentChapterId}: ${questionCount} -> ${questionCount - 2}`);
                
                remainingQuestions--;
                chapterAllocated = true;
                
                // Remove allocated chapter from array
                randomChapters.splice(currentIndex, 1);
                console.log('Removed allocated chapter from array. Remaining chapters:', randomChapters);
              } else {
                console.log(`✗ Chapter ${currentChapterId} has insufficient questions (${questionCount})`);
                currentIndex++;
              }
            } else {
              console.log(`✗ Chapter ${currentChapterId} doesn't have question type ${sqt.question_type.type_name}`);
              currentIndex++;
            }
          }

          // If we reached the end of array without allocating, check if it's possible to allocate at all
          if (!chapterAllocated) {
            console.log('Attempted all chapters, none suitable or available for:', sqt.question_type.type_name);

            // Check if *any* chapter has remaining questions of this type
            const isAnyQuestionAvailable = filter.chapterIds.some(chapterId => {
              const types = chapterQuestionTypeMap.get(chapterId);
              return types && (types.get(sqt.question_type_id) || 0) > 0;
            });

            if (!isAnyQuestionAvailable) {
              console.error(`Allocation failed: No chapter has enough verified questions for type '${sqt.question_type.type_name}' (ID: ${sqt.question_type_id}) across all specified mediums.`);
              throw new BadRequestException(
                `Insufficient verified questions for type '${sqt.question_type.type_name}' ` +
                `available across all selected mediums (${filter.mediumIds.join(', ')}) ` +
                `in the chosen chapters (${filter.chapterIds.join(', ')}). Cannot generate test paper.`
              );
            }

            console.log('Regenerating random chapters array as some chapters might still have questions.');
            randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);
            console.log('New random chapters:', randomChapters);
          }
        }

        console.log(`Completed allocation for ${sqt.question_type.type_name}. Allocated chapters:`, 
          allocatedChapters.map(c => `ID: ${c.chapterId}`).join(', '));

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

      console.log(`Completed section ${section.section_name}. Current chapter marks:`, 
        Array.from(chapterMarksMap.entries()));
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

    console.log('Final allocation:', {
      patternId: pattern.id,
      patternName: pattern.pattern_name,
      totalMarks: pattern.total_marks,
      absoluteMarks: patternAbsoluteMarks,
      questionOrigin: filter.questionOrigin,
      mediums: mediumDetails,
      sectionAllocations: sectionAllocations.map(sa => ({
        sectionName: sa.sectionName,
        subsectionAllocations: sa.subsectionAllocations.map(suba => ({
          questionTypeName: suba.questionTypeName,
          allocatedChapters: suba.allocatedChapters.map(c => c.chapterId)
        }))
      })),
      chapterMarks
    });

    console.log('\n' + '-'.repeat(50) + '\n');

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
          const canAllocate = Math.floor(questionCount / 2) + (questionCount % 2 > 0 ? 1 : 0);
          
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

            if (questionCount >= 2) {
              // Subtract 2 questions and add marks
              sectionMarks += marksPerQuestion;
              remainingQuestions--;
              chapterQuestionTypes.set(questionTypeId, questionCount - 2);
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
    pattern: any,
    chapterIds: number[],
    mediumIds: number[],
    questionOrigin?: 'board' | 'other' | 'both'
  ): Promise<Map<number, number>> {
    const possibleMarksMap = new Map<number, number>();
    
    // Get question availability for each chapter
    interface QuestionAvailability {
      chapter_id: number;
      question_type_id: number;
      question_count: number;
    }

    // Build the board_question condition based on questionOrigin
    let boardQuestionCondition = '';
    if (questionOrigin === 'board') {
      boardQuestionCondition = 'AND q.board_question = true';
    } else if (questionOrigin === 'other') {
      boardQuestionCondition = 'AND q.board_question = false';
    }
    // For 'both', we don't add any condition

    const boardQuestionSql = Prisma.sql([boardQuestionCondition]);

    const questionAvailability = await this.prisma.$queryRaw<QuestionAvailability[]>`
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
      let possibleMarks = 0;
      
      // For each section in pattern
      for (const section of pattern.sections) {
        // For each question type in section
        for (const sqt of section.subsection_question_types) {
          const questionTypeId = sqt.question_type_id;
          
          // Find available questions for this chapter and question type
          const availability = questionAvailability.find(
            (qa: any) => qa.chapter_id === chapterId && qa.question_type_id === questionTypeId
          );
          
          if (availability && availability.question_count >= 3) {
            // Calculate possible marks for this question type
            const questionsPossible = Math.min(
              section.total_questions,
              Math.floor(availability.question_count / 3)
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
    pattern: any,
    chapterIds: number[],
    mediumIds: number[],
    targetMarks: Map<number, number>,
    questionOrigin?: 'board' | 'other' | 'both'
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
      possibleMarks.get(a) - possibleMarks.get(b)
    );
    
    // First pass: Allocate minimum possible marks
    for (const chapterId of sortedChapters) {
      const target = targetMarks.get(chapterId);
      let allocatedMarks = 0;
      
      // Allocate high value questions first
      for (const section of sortedSections) {
        if (allocatedMarks >= target) break;
        
        const remainingMarks = target - allocatedMarks;
        const marksPerQuestion = section.marks_per_question;
        const maxQuestions = Math.floor(remainingMarks / marksPerQuestion);
        
        if (maxQuestions > 0) {
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
            
            if (questionsToAllocate > 0) {
              const currentAllocation = allocationMap.get(section.id).get(chapterId);
              allocationMap.get(section.id).set(chapterId, [
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
      const sectionAllocation = allocationMap.get(section.id);
      const totalAllocated = Array.from(sectionAllocation.values())
        .reduce((sum, marks) => sum + marks.length, 0);
      
      const remainingQuestions = section.total_questions - totalAllocated;
      
      if (remainingQuestions > 0) {
        // Find chapters that need more marks
        const chaptersNeedingMarks = sortedChapters.filter(chapterId => {
          const allocated = Array.from(allocationMap.values())
            .reduce((sum, sectionMap) => 
              sum + sectionMap.get(chapterId).reduce((a, b) => a + b, 0), 0);
          return allocated < targetMarks.get(chapterId);
        });
        
        // Allocate remaining questions
        for (let i = 0; i < remainingQuestions; i++) {
          const chapterId = chaptersNeedingMarks[i % chaptersNeedingMarks.length];
          const currentAllocation = sectionAllocation.get(chapterId);
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
    questionOrigin?: 'board' | 'other' | 'both'
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
    
    return count >= 3;
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
        console.error(`Could not fetch medium details for IDs: ${filter.mediumIds}`, error);
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
      targetMarks.set(chapterId, baseMarksPerChapter + (index < remainingMarks ? 1 : 0));
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
      const sectionAllocation = allocationMap.get(section.id);
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
          .filter(([_, marks]) => marks.length > 0)
          .map(([chapterId, marks]) => ({
            chapterId,
            chapterName: chapterNameMap.get(chapterId) || `Chapter ${chapterId}`,
            marks: marks.reduce((a, b) => a + b, 0)
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
          sum + sectionMap.get(chapterId).reduce((a, b) => a + b, 0), 0);
      
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
} 