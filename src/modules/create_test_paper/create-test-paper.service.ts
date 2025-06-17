import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestPaperFilterDto, CreateTestPaperResponseDto, SectionAllocationDto, SubsectionAllocationDto, ChapterMarksDto, ChapterInfoDto } from './dto/create-test-paper.dto';
import { FilterChaptersDto } from './dto/filter-chapters.dto';
import { ChapterMarksResponseDto } from './dto/chapter-marks-response.dto';
import { Prisma } from '@prisma/client';

// Define type alias for the question origin union type
type QuestionOriginType = 'board' | 'other' | 'both';

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
    for (const [, chapters] of groupedChapters) {
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
    questionOrigin?: QuestionOriginType
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

    // Fetch data and initialize structures
    const { pattern, mediumDetails, chapterNameMap } = await this.fetchInitialData(filter);
    
    // Get chapter question type counts
    const chapterQuestionTypeMap = await this.getChapterQuestionTypeCounts(
      filter.chapterIds,
      filter.mediumIds,
      filter.questionOrigin
    );

    // Initialize chapter marks tracking
    const chapterMarksMap = this.initializeChapterMarks(filter.chapterIds);
    
    // Create random sections array and process each section
    const randomSections = this.generateRandomSequence(pattern.sections);
    const sectionAllocations = this.processSections(
      randomSections, 
      chapterQuestionTypeMap, 
      chapterMarksMap, 
      chapterNameMap,
      filter
    );

    // Format results
    return this.formatTestPaperResponse(
      pattern, 
      mediumDetails, 
      sectionAllocations, 
      chapterMarksMap, 
      chapterNameMap,
      filter
    );
  }

  /**
   * Fetches initial data needed for test paper allocation
   */
  private async fetchInitialData(filter: CreateTestPaperFilterDto): Promise<{
    pattern: any;
    mediumDetails: any[];
    chapterNameMap: Map<number, string>;
  }> {
    // 1. Get pattern with all necessary relations
    const pattern = await this.fetchPattern(filter.patternId);
    
    // 2. Fetch Medium details
    const mediumDetails = await this.fetchMediumDetails(filter.mediumIds);
    
    // 3. Fetch chapter names
    const chapterNameMap = await this.fetchChapterNames(filter.chapterIds);
    
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
    
    return { pattern, mediumDetails, chapterNameMap };
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
      console.error('Pattern not found for ID:', patternId);
      throw new NotFoundException('Pattern not found');
    }
    
    return pattern;
  }
  
  /**
   * Fetches medium details
   */
  private async fetchMediumDetails(mediumIds?: number[]): Promise<any[]> {
    let mediumDetails: { id: number; instruction_medium: string }[] = [];
    
    if (mediumIds && mediumIds.length > 0) {
      try {
        mediumDetails = await this.prisma.instruction_Medium.findMany({
          where: { id: { in: mediumIds } },
          select: { id: true, instruction_medium: true },
        });
      } catch (error) {
        console.error(`Could not fetch medium details for IDs: ${mediumIds}`, error);
      }
    }
    
    return mediumDetails;
  }
  
  /**
   * Fetches chapter names and returns a map of chapter ID to name
   */
  private async fetchChapterNames(chapterIds: number[]): Promise<Map<number, string>> {
    const chapters = await this.prisma.chapter.findMany({
      where: {
        id: { in: chapterIds }
      },
      select: { id: true, name: true }
    });
    
    return new Map(chapters.map(ch => [ch.id, ch.name]));
  }
  
  /**
   * Initializes chapter marks map
   */
  private initializeChapterMarks(chapterIds: number[]): Map<number, number> {
    const chapterMarksMap = new Map<number, number>();
    chapterIds.forEach(chapterId => chapterMarksMap.set(chapterId, 0));
    console.log('Initialized chapter marks map:', Array.from(chapterMarksMap.entries()));
    return chapterMarksMap;
  }
  
  /**
   * Processes all sections to create section allocations
   */
  private processSections(
    sections: any[],
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
    chapterMarksMap: Map<number, number>,
    chapterNameMap: Map<number, string>,
    filter: CreateTestPaperFilterDto
  ): SectionAllocationDto[] {
    console.log('Random sections order:', sections.map(s => s.section_name));
    const sectionAllocations: SectionAllocationDto[] = [];
    
    for (const section of sections) {
      const sectionAllocation = this.processSection(
        section, 
        chapterQuestionTypeMap, 
        chapterMarksMap,
        chapterNameMap,
        filter
      );
      
      sectionAllocations.push(sectionAllocation);
      console.log(`Completed section ${section.section_name}. Current chapter marks:`, 
        Array.from(chapterMarksMap.entries()));
    }
    
    return sectionAllocations;
  }
  
  /**
   * Processes a single section
   */
  private processSection(
    section: any,
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
    chapterMarksMap: Map<number, number>,
    chapterNameMap: Map<number, string>,
    filter: CreateTestPaperFilterDto
  ): SectionAllocationDto {
    console.log(`\nProcessing Section: ${section.section_name}`);
    console.log(`Total Questions: ${section.total_questions}`);
    console.log(`Number of Subsections: ${section.subsection_question_types.length}`);
    
    const sectionAbsoluteMarks = section.total_questions * section.marks_per_question;
    const sectionTotalMarks = section.mandotory_questions * section.marks_per_question;
    
    // Process subsections
    const subsectionAllocations = this.processSubsections(
      section,
      chapterQuestionTypeMap,
      chapterMarksMap,
      chapterNameMap,
      filter
    );
    
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
      subsectionAllocations
    };
  }
  
  /**
   * Processes all subsections in a section
   */
  private processSubsections(
    section: any,
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
    chapterMarksMap: Map<number, number>,
    chapterNameMap: Map<number, string>,
    filter: CreateTestPaperFilterDto
  ): SubsectionAllocationDto[] {
    let randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);
    console.log('Initial random chapters for section:', randomChapters);
    
    const subsectionAllocations: SubsectionAllocationDto[] = [];
    
    for (const sqt of section.subsection_question_types) {
      const subsectionAllocation = this.processSubsection(
        sqt,
        section,
        randomChapters,
        chapterQuestionTypeMap,
        chapterMarksMap,
        chapterNameMap,
        filter
      );
      
      subsectionAllocations.push(subsectionAllocation);
    }
    
    return subsectionAllocations;
  }
  
  /**
   * Processes a single subsection
   */
  private processSubsection(
    sqt: any,
    section: any,
    randomChapters: number[],
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
    chapterMarksMap: Map<number, number>,
    chapterNameMap: Map<number, string>,
    filter: CreateTestPaperFilterDto
  ): SubsectionAllocationDto {
    console.log(`\nProcessing Question Type: ${sqt.question_type.type_name}`);
    
    const allocatedChapters = this.allocateChaptersForSubsection(
      sqt,
      section,
      randomChapters,
      chapterQuestionTypeMap,
      chapterMarksMap,
      chapterNameMap,
      filter
    );
    
    console.log(`Completed allocation for ${sqt.question_type.type_name}. Allocated chapters:`, 
      allocatedChapters.map(c => `ID: ${c.chapterId}`).join(', '));
    
    return {
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
    };
  }
  
  /**
   * Allocates chapters for a subsection
   */
  private allocateChaptersForSubsection(
    sqt: any,
    section: any,
    randomChapters: number[],
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
    chapterMarksMap: Map<number, number>,
    chapterNameMap: Map<number, string>,
    filter: CreateTestPaperFilterDto
  ): ChapterInfoDto[] {
    const allocatedChapters: ChapterInfoDto[] = [];
    let remainingQuestions = this.calculateRemainingQuestions(section);
    
    console.log(`Questions to allocate for this subsection: ${remainingQuestions}`);
    
    let chaptersToUse = [...randomChapters]; // Create a copy to avoid modifying the original
    
    while (remainingQuestions > 0) {
      // Check if we need to regenerate the chapters array
      if (chaptersToUse.length === 0) {
        chaptersToUse = this.getRandomChaptersByMarks(chapterMarksMap);
        console.log('Regenerated random chapters array:', chaptersToUse);
      }
      
      // Try to allocate a chapter
      const allocationResult = this.tryAllocateChapter(
        sqt,
        chaptersToUse,
        chapterQuestionTypeMap,
        chapterMarksMap,
        chapterNameMap,
        section.marks_per_question
      );
      
      // Handle allocation result
      if (allocationResult.success) {
        allocatedChapters.push(allocationResult.chapterInfo);
        remainingQuestions--;
        
        // Remove the allocated chapter from the array
        const index = chaptersToUse.indexOf(allocationResult.chapterInfo.chapterId);
        if (index !== -1) {
          chaptersToUse.splice(index, 1);
        }
      } else {
        // Check if allocation is possible at all
        this.checkQuestionAvailability(sqt, filter, chapterQuestionTypeMap);
        
        // Regenerate random chapters
        chaptersToUse = this.getRandomChaptersByMarks(chapterMarksMap);
        console.log('Regenerated random chapters array after failed allocation:', chaptersToUse);
      }
    }
    
    return allocatedChapters;
  }
  
  /**
   * Calculates the number of questions needed for a subsection
   */
  private calculateRemainingQuestions(section: any): number {
    return section.subsection_question_types.length === 1 
      ? section.total_questions 
      : 1;
  }
  
  /**
   * Tries to allocate a chapter for a question type
   */
  private tryAllocateChapter(
    sqt: any,
    randomChapters: number[],
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
    chapterMarksMap: Map<number, number>,
    chapterNameMap: Map<number, string>,
    marksPerQuestion: number
  ): { success: boolean; chapterInfo?: ChapterInfoDto } {
    for (let i = 0; i < randomChapters.length; i++) {
      const chapterId = randomChapters[i];
      const chapterQuestionTypes = chapterQuestionTypeMap.get(chapterId);
      
      console.log(`Trying Chapter ID: ${chapterId} at index ${i}`);
      console.log('Chapter question types:', chapterQuestionTypes ? 
        Array.from(chapterQuestionTypes.entries()) : 'No question types found');
      
      if (chapterQuestionTypes && chapterQuestionTypes.has(sqt.question_type_id)) {
        const questionCount = chapterQuestionTypes.get(sqt.question_type_id)!;
        
        if (questionCount > 0) {
          // Allocate the chapter
          const chapterInfo = this.allocateChapter(
            chapterId,
            sqt,
            questionCount,
            chapterQuestionTypes,
            chapterMarksMap,
            chapterNameMap,
            marksPerQuestion
          );
          
          return { success: true, chapterInfo };
        } else {
          console.log(`✗ Chapter ${chapterId} has insufficient questions (${questionCount})`);
        }
      } else {
        console.log(`✗ Chapter ${chapterId} doesn't have question type ${sqt.question_type.type_name}`);
      }
    }
    
    return { success: false };
  }
  
  /**
   * Allocates a chapter for a question type
   */
  private allocateChapter(
    chapterId: number,
    sqt: any,
    questionCount: number,
    chapterQuestionTypes: Map<number, number>,
    chapterMarksMap: Map<number, number>,
    chapterNameMap: Map<number, string>,
    marksPerQuestion: number
  ): ChapterInfoDto {
    console.log(`✓ Allocated Chapter ID: ${chapterId} for ${sqt.question_type.type_name}`);
    
    // Create chapter info
    const chapterInfo: ChapterInfoDto = {
      chapterId,
      chapterName: chapterNameMap.get(chapterId) || `Chapter ${chapterId}`
    };
    
    // Update marks
    const currentMarks = chapterMarksMap.get(chapterId) || 0;
    chapterMarksMap.set(chapterId, currentMarks + marksPerQuestion);
    console.log(`Updated marks for Chapter ${chapterId}: ${currentMarks} -> ${currentMarks + marksPerQuestion}`);
    
    // Update question count
    chapterQuestionTypes.set(sqt.question_type_id, questionCount - 2);
    console.log(`Updated question count for Chapter ${chapterId}: ${questionCount} -> ${questionCount - 2}`);
    
    return chapterInfo;
  }
  
  /**
   * Checks if there are any questions available for allocation
   */
  private checkQuestionAvailability(
    sqt: any,
    filter: CreateTestPaperFilterDto,
    chapterQuestionTypeMap: Map<number, Map<number, number>>
  ): void {
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
  }
  
  /**
   * Formats the final test paper response
   */
  private formatTestPaperResponse(
    pattern: any,
    mediumDetails: any[],
    sectionAllocations: SectionAllocationDto[],
    chapterMarksMap: Map<number, number>,
    chapterNameMap: Map<number, string>,
    filter: CreateTestPaperFilterDto
  ): CreateTestPaperResponseDto {
    // Format chapter marks
    const chapterMarks: ChapterMarksDto[] = Array.from(chapterMarksMap.entries())
      .map(([chapterId, absoluteMarks]) => ({
        chapterId,
        chapterName: chapterNameMap.get(chapterId) || `Chapter ${chapterId}`,
        absoluteMarks
      }));
    
    // Calculate total marks
    const patternAbsoluteMarks = pattern.sections.reduce((total: number, section: any) => 
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

    // Fetch pattern and chapters
    const pattern = await this.fetchPatternForMarks(patternId);
    const chapters = await this.fetchChaptersForMarks(chapterIds);
    
    // Get question counts for chapters
    const chapterQuestionTypeMap = await this.getQuestionCountsForMarks(chapterIds, mediumIds, questionOrigin);
    
    // Calculate possible marks for each chapter
    return this.calculatePossibleMarksForChapters(chapters, pattern, chapterQuestionTypeMap, questionOrigin);
  }

  /**
   * Fetches pattern with sections and question types for marks calculation
   */
  private async fetchPatternForMarks(patternId: number) {
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
   * Fetches chapters for marks calculation
   */
  private async fetchChaptersForMarks(chapterIds: number[]) {
    return this.prisma.chapter.findMany({
      where: {
        id: { in: chapterIds }
      }
    });
  }

  /**
   * Gets question counts for marks calculation
   */
  private async getQuestionCountsForMarks(
    chapterIds: number[],
    mediumIds: number[],
    questionOrigin: QuestionOriginType
  ): Promise<Map<number, Map<number, number>>> {
    // Build SQL condition for question origin
    const boardQuestionSql = this.buildBoardQuestionCondition(questionOrigin);
    
    // Execute query to get question counts
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
    
    // Create map of chapter question type counts
    return this.buildQuestionTypeMap(questionCounts);
  }
  
  /**
   * Builds SQL condition for question origin filter
   */
  private buildBoardQuestionCondition(questionOrigin: QuestionOriginType): Prisma.Sql {
    let boardQuestionCondition = '';
    
    if (questionOrigin === 'board') {
      boardQuestionCondition = 'AND q.board_question = true';
    } else if (questionOrigin === 'other') {
      boardQuestionCondition = 'AND q.board_question = false';
    }
    // For 'both', we don't add any condition
    
    return Prisma.sql([boardQuestionCondition]);
  }
  
  /**
   * Builds a map of chapter question types from query results
   */
  private buildQuestionTypeMap(
    questionCounts: { chapter_id: bigint, question_type_id: bigint, count: bigint }[]
  ): Map<number, Map<number, number>> {
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
    
    return chapterQuestionTypeMap;
  }
  
  /**
   * Calculates possible marks for each chapter
   */
  private calculatePossibleMarksForChapters(
    chapters: any[],
    pattern: any,
    chapterQuestionTypeMap: Map<number, Map<number, number>>,
    questionOrigin: QuestionOriginType
  ): ChapterMarksResponseDto[] {
    const result: ChapterMarksResponseDto[] = [];
    
    for (const chapter of chapters) {
      // Get chapter question types or empty map if none
      const chapterQuestionTypes = chapterQuestionTypeMap.get(chapter.id) || new Map();
      
      // Calculate absolute marks for this chapter
      const absoluteMarks = this.calculateAbsoluteMarksForChapter(
        pattern.sections,
        chapterQuestionTypes
      );
      
      // Add chapter to result
      result.push({
        chapterId: chapter.id,
        chapterName: chapter.name,
        absoluteMarks,
        questionOrigin
      });
    }
    
    return result;
  }
  
  /**
   * Calculates absolute marks for a chapter based on pattern sections
   */
  private calculateAbsoluteMarksForChapter(
    sections: any[],
    chapterQuestionTypes: Map<number, number>
  ): number {
    let absoluteMarks = 0;
    
    // Create a copy of the question types map to avoid modifying the original
    const availableQuestions = new Map(chapterQuestionTypes);
    
    for (const section of sections) {
      absoluteMarks += this.calculateMarksForSection(section, availableQuestions);
    }
    
    return absoluteMarks;
  }
  
  /**
   * Calculates marks for a single section
   */
  private calculateMarksForSection(
    section: any,
    availableQuestions: Map<number, number>
  ): number {
    const { total_questions, marks_per_question, subsection_question_types } = section;
    
    return subsection_question_types.length === 1
      ? this.calculateMarksForSingleTypeSection(subsection_question_types[0], total_questions, marks_per_question, availableQuestions)
      : this.calculateMarksForMultiTypeSection(subsection_question_types, total_questions, marks_per_question, availableQuestions);
  }
  
  /**
   * Calculates marks for a section with a single question type
   */
  private calculateMarksForSingleTypeSection(
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
   * Calculates marks for a section with multiple question types
   */
  private calculateMarksForMultiTypeSection(
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

  private async calculatePossibleMarksPerChapter(
    pattern: any,
    chapterIds: number[],
    mediumIds: number[],
    questionOrigin?: QuestionOriginType
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
    questionOrigin?: QuestionOriginType
  ): Promise<Map<number, Map<number, number[]>>> {
    // Initialize allocation map
    const allocationMap = this.initializeAllocationMap(pattern, chapterIds);
    
    // Get sorted data
    const sortedData = await this.getSortedSectionsAndChapters(pattern, chapterIds, mediumIds, questionOrigin);
    
    // First pass: Allocate minimum possible marks for each chapter
    await this.performFirstPassAllocation(sortedData, allocationMap, targetMarks, mediumIds, questionOrigin);
    
    // Second pass: Fill remaining questions in sections
    this.performSecondPassAllocation(sortedData, allocationMap, targetMarks);
    
    return allocationMap;
  }

  /**
   * Initialize the allocation map structure
   */
  private initializeAllocationMap(
    pattern: any, 
    chapterIds: number[]
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

  /**
   * Get sorted sections and chapters for allocation
   */
  private async getSortedSectionsAndChapters(
    pattern: any,
    chapterIds: number[],
    mediumIds: number[],
    questionOrigin?: QuestionOriginType
  ): Promise<{
    sortedSections: any[],
    sortedChapters: number[],
    possibleMarks: Map<number, number>
  }> {
    // Sort sections by marks per question (descending)
    const sortedSections = [...pattern.sections].sort((a, b) => 
      b.marks_per_question - a.marks_per_question
    );
    
    // Sort chapters by possible marks (ascending)
    const possibleMarks = await this.calculatePossibleMarksPerChapter(pattern, chapterIds, mediumIds, questionOrigin);
    const sortedChapters = [...chapterIds].sort((a, b) => 
      possibleMarks.get(a) - possibleMarks.get(b)
    );
    
    return { sortedSections, sortedChapters, possibleMarks };
  }

  /**
   * First pass: Allocate minimum possible marks for each chapter
   */
  private async performFirstPassAllocation(
    sortedData: {
      sortedSections: any[],
      sortedChapters: number[],
      possibleMarks: Map<number, number>
    },
    allocationMap: Map<number, Map<number, number[]>>,
    targetMarks: Map<number, number>,
    mediumIds: number[],
    questionOrigin?: QuestionOriginType
  ): Promise<void> {
    const { sortedSections, sortedChapters } = sortedData;
    
    for (const chapterId of sortedChapters) {
      await this.allocateMarksToChapter(
        chapterId,
        sortedSections,
        allocationMap,
        targetMarks.get(chapterId),
        mediumIds,
        questionOrigin
      );
    }
  }

  /**
   * Allocate marks to a specific chapter across sections
   */
  private async allocateMarksToChapter(
    chapterId: number,
    sortedSections: any[],
    allocationMap: Map<number, Map<number, number[]>>,
    targetMark: number,
    mediumIds: number[],
    questionOrigin?: QuestionOriginType
  ): Promise<void> {
    let allocatedMarks = 0;
    
    for (const section of sortedSections) {
      // Break if we've already reached the target
      if (allocatedMarks >= targetMark) break;
      
      const remainingMarks = targetMark - allocatedMarks;
      const marksPerQuestion = section.marks_per_question;
      const maxQuestions = Math.floor(remainingMarks / marksPerQuestion);
      
      if (maxQuestions <= 0) continue;
      
      // Check if chapter has verified questions for this section
      const hasQuestions = await this.hasVerifiedQuestions(
        chapterId,
        section.subsection_question_types.map(sqt => sqt.question_type_id),
        mediumIds,
        questionOrigin
      );
      
      if (!hasQuestions) continue;
      
      // Add questions to section allocation
      const additionalMarks = this.allocateQuestionsToSection(
        section,
        chapterId,
        allocationMap,
        maxQuestions,
        remainingMarks,
        marksPerQuestion
      );
      
      allocatedMarks += additionalMarks;
    }
  }

  /**
   * Allocate questions to a specific section for a chapter
   */
  private allocateQuestionsToSection(
    section: any,
    chapterId: number,
    allocationMap: Map<number, Map<number, number[]>>,
    maxQuestions: number,
    remainingMarks: number,
    marksPerQuestion: number
  ): number {
    // Calculate how many questions to allocate
    const questionsToAllocate = Math.min(
      maxQuestions,
      section.total_questions,
      Math.floor(remainingMarks / marksPerQuestion)
    );
    
    if (questionsToAllocate <= 0) return 0;
    
    // Update allocation
    const sectionAllocation = allocationMap.get(section.id);
    const currentAllocation = sectionAllocation.get(chapterId);
    
    sectionAllocation.set(chapterId, [
      ...currentAllocation,
      ...Array(questionsToAllocate).fill(marksPerQuestion)
    ]);
    
    return questionsToAllocate * marksPerQuestion;
  }

  /**
   * Second pass: Fill remaining questions in sections
   */
  private performSecondPassAllocation(
    sortedData: {
      sortedSections: any[],
      sortedChapters: number[],
      possibleMarks: Map<number, number>
    },
    allocationMap: Map<number, Map<number, number[]>>,
    targetMarks: Map<number, number>
  ): void {
    const { sortedSections, sortedChapters } = sortedData;
    
    for (const section of sortedSections) {
      this.fillRemainingQuestionsInSection(section, sortedChapters, allocationMap, targetMarks);
    }
  }

  /**
   * Fill remaining questions in a specific section
   */
  private fillRemainingQuestionsInSection(
    section: any,
    sortedChapters: number[],
    allocationMap: Map<number, Map<number, number[]>>,
    targetMarks: Map<number, number>
  ): void {
    const sectionAllocation = allocationMap.get(section.id);
    const totalAllocated = this.countAllocatedQuestionsInSection(sectionAllocation);
    const remainingQuestions = section.total_questions - totalAllocated;
    
    if (remainingQuestions <= 0) return;
    
    // Find chapters that need more marks
    const chaptersNeedingMarks = this.findChaptersNeedingMoreMarks(
      sortedChapters,
      allocationMap,
      targetMarks
    );
    
    // Distribute remaining questions
    this.distributeRemainingQuestions(
      remainingQuestions,
      chaptersNeedingMarks,
      sectionAllocation,
      section.marks_per_question
    );
  }

  /**
   * Count allocated questions in a section
   */
  private countAllocatedQuestionsInSection(
    sectionAllocation: Map<number, number[]>
  ): number {
    return Array.from(sectionAllocation.values())
      .reduce((sum, marks) => sum + marks.length, 0);
  }

  /**
   * Find chapters that need more marks
   */
  private findChaptersNeedingMoreMarks(
    sortedChapters: number[],
    allocationMap: Map<number, Map<number, number[]>>,
    targetMarks: Map<number, number>
  ): number[] {
    return sortedChapters.filter(chapterId => {
      const allocated = this.getTotalAllocatedMarksForChapter(chapterId, allocationMap);
      return allocated < targetMarks.get(chapterId);
    });
  }

  /**
   * Get total allocated marks for a chapter across all sections
   */
  private getTotalAllocatedMarksForChapter(
    chapterId: number,
    allocationMap: Map<number, Map<number, number[]>>
  ): number {
    return Array.from(allocationMap.values())
      .reduce((sum, sectionMap) => 
        sum + sectionMap.get(chapterId).reduce((a, b) => a + b, 0), 0);
  }

  /**
   * Distribute remaining questions among chapters
   */
  private distributeRemainingQuestions(
    remainingQuestions: number,
    chaptersNeedingMarks: number[],
    sectionAllocation: Map<number, number[]>,
    marksPerQuestion: number
  ): void {
    if (chaptersNeedingMarks.length === 0) return;
    
    for (let i = 0; i < remainingQuestions; i++) {
      const chapterId = chaptersNeedingMarks[i % chaptersNeedingMarks.length];
      const currentAllocation = sectionAllocation.get(chapterId);
      
      sectionAllocation.set(chapterId, [
        ...currentAllocation,
        marksPerQuestion
      ]);
    }
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