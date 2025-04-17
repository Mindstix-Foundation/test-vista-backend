import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  ChapterMarksRequestDto, 
  ChapterMarksDistributionResponseDto, 
  SectionAllocationDto, 
  SubsectionAllocationDto, 
  AllocatedChapterDto, 
  ChapterMarksDto,
  FinalQuestionsDistributionBodyDto
} from './dto/chapter-marks-distribution.dto';
import { Pattern } from '@prisma/client';

@Injectable()
export class ChapterMarksDistributionService {
  private readonly logger = new Logger(ChapterMarksDistributionService.name);

  constructor(private prisma: PrismaService) {}

  private generateRandomSequence<T>(items: T[]): T[] {
    const sequence = [...items];
    for (let i = sequence.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }
    return sequence;
  }

  private async getChapterQuestionTypeCounts(
    chapterIds: number[],
    mediumIds: number[],
    pattern: {
      id: number;
      pattern_name: string;
      board_id: number;
      standard_id: number;
      subject_id: number;
      total_marks: number;
      created_at: Date;
      updated_at: Date;
      sections: {
        id: number;
        pattern_id: number;
        sequence_number: number;
        section_number: number;
        sub_section: string;
        section_name: string;
        total_questions: number;
        mandotory_questions: number;
        marks_per_question: number;
        subsection_question_types: {
          id: number;
          section_id: number;
          seqencial_subquestion_number: number;
          question_type_id: number;
          question_type: {
            id: number;
            type_name: string;
          };
        }[];
      }[];
    }
  ): Promise<Map<number, Map<number, number>>> {
    const chapterQuestionTypeMap = new Map<number, Map<number, number>>();
    
    // Get all unique question types from the pattern
    const uniqueQuestionTypes = new Set<number>();
    pattern.sections.forEach(section => {
      section.subsection_question_types.forEach(sqt => {
        uniqueQuestionTypes.add(sqt.question_type_id);
      });
    });

    // Get question counts for each chapter and question type
    for (const chapterId of chapterIds) {
      const questionTypeCounts = new Map<number, number>();
      
      for (const questionTypeId of uniqueQuestionTypes) {
        const count = await this.prisma.question.count({
          where: {
            question_type_id: questionTypeId,
            question_topics: {
              some: {
                topic: {
                  chapter_id: chapterId
                }
              }
            },
            question_texts: {
              some: {
                question_text_topics: {
                  some: {
                    instruction_medium_id: { in: mediumIds },
                    is_verified: true
                  }
                }
              }
            }
          }
        });
        questionTypeCounts.set(questionTypeId, count);
      }
      
      chapterQuestionTypeMap.set(chapterId, questionTypeCounts);
    }

    return chapterQuestionTypeMap;
  }

  private getUniqueMarksPerQuestion(sections: any[]): number[] {
    const marksSet = new Set<number>();
    sections.forEach(section => {
      marksSet.add(section.marks_per_question);
    });
    const uniqueMarks = Array.from(marksSet).sort((a, b) => a - b);
    this.logger.debug(`Unique marks per question: ${uniqueMarks.join(', ')}`);
    return uniqueMarks;
  }

  private getChapterPriorityList(
    chapterIds: number[],
    requestedMarks: number[],
    chapterQuestionTypeMap: Map<number, Map<number, number>>
  ): number[] {
    // Create array of chapters with their question type count and requested marks
    const chaptersWithInfo = chapterIds.map((chapterId, index) => ({
      chapterId,
      questionTypeCount: chapterQuestionTypeMap.get(chapterId)?.size || 0,
      requestedMarks: requestedMarks[index]
    }));

    // Sort by question type count (ascending) and requested marks (descending)
    chaptersWithInfo.sort((a, b) => {
      if (a.questionTypeCount !== b.questionTypeCount) {
        return a.questionTypeCount - b.questionTypeCount;
      }
      if (a.requestedMarks !== b.requestedMarks) {
        return b.requestedMarks - a.requestedMarks;
      }
      return Math.random() - 0.5; // Random if both are same
    });

    const priorityList = chaptersWithInfo.map(chapter => chapter.chapterId);
    this.logger.debug(`Chapter priority list: ${priorityList.join(' -> ')}`);
    return priorityList;
  }

  private findReplacement(
    sectionAllocations: SectionAllocationDto[],
    chapterId: number,
    currentMark: number,
    targetMark: number
  ): { sectionId: number; subsectionId: number } | null {
    for (const sectionAlloc of sectionAllocations) {
      for (const subsection of sectionAlloc.subsectionAllocations) {
        const chapterIndex = subsection.allocatedChapters.findIndex(
          chapter => chapter.chapterId === chapterId
        );
        if (chapterIndex !== -1) {
          if (sectionAlloc.absoluteMarks === currentMark) {
            return {
              sectionId: sectionAlloc.sectionId,
              subsectionId: subsection.subsectionQuestionTypeId
            };
          }
        }
      }
    }
    return null;
  }

  private getSectionAllocatedQuestions(sectionAllocations: SectionAllocationDto[], sectionId: number): number {
    const section = sectionAllocations.find(s => s.sectionId === sectionId);
    if (!section) return 0;
    
    return section.subsectionAllocations.reduce((total, subsection) => {
      return total + subsection.allocatedChapters.length;
    }, 0);
  }

  private getSubsectionAllocatedQuestions(sectionAllocations: SectionAllocationDto[], sectionId: number, subsectionId: number): number {
    const section = sectionAllocations.find(s => s.sectionId === sectionId);
    if (!section) return 0;
    
    const subsection = section.subsectionAllocations.find(s => s.subsectionQuestionTypeId === subsectionId);
    if (!subsection) return 0;
    
    return subsection.allocatedChapters.length;
  }

  private async tryReplaceAllocation(
    sectionAllocations: SectionAllocationDto[],
    chapterId: number,
    currentMark: number,
    targetMark: number,
    chapterQuestionTypes: Map<number, number>,
    chapterQuestionTypeUsage: Map<number, number>,
    usedQuestionTypes: Map<number, Set<number>>,
    pattern: any
  ): Promise<boolean> {
    const replacement = this.findReplacement(sectionAllocations, chapterId, currentMark, targetMark);
    if (!replacement) return false;

    // Find the section from the pattern
    const section = pattern.sections.find(s => s.id === replacement.sectionId);
    if (!section) return false;

    // Check if section allows multiple questions of the same type
    const allowsMultipleQuestions = section.subsection_question_types.length === 1;

    // Remove the old allocation
    const sectionAlloc = sectionAllocations.find(s => s.sectionId === replacement.sectionId)!;
    const subsection = sectionAlloc.subsectionAllocations.find(s => s.subsectionQuestionTypeId === replacement.subsectionId)!;
    const chapterIndex = subsection.allocatedChapters.findIndex(c => c.chapterId === chapterId);
    
    if (chapterIndex !== -1) {
      this.logger.debug(`Removing allocation of chapter ${chapterId} from section ${replacement.sectionId}, subsection ${replacement.subsectionId}`);
      subsection.allocatedChapters.splice(chapterIndex, 1);
      
      // Look for a section with the target mark that can accept more questions
      for (const section of pattern.sections) {
        if (section.marks_per_question !== targetMark) continue;
        
        // Skip if section is full
        if (!this.canAddMoreQuestionsToSection(sectionAllocations, section)) continue;
        
        // Get available question types
        const availableTypes = this.getAvailableQuestionTypes(
          section, 
          sectionAllocations, 
          chapterId,
          chapterQuestionTypes,
          pattern
        );
        
        // Select question type to use
        const selectedTypeId = this.getLeastUsedQuestionType(availableTypes, chapterQuestionTypes);
        if (!selectedTypeId) continue;
        
        // Find corresponding subsection question type
        const sqt = section.subsection_question_types.find(
          sqt => sqt.question_type_id === selectedTypeId
        );
        if (!sqt) continue;
        
        const currentCount = chapterQuestionTypes.get(selectedTypeId) || 0;
        
        if (currentCount <= 0) {
          this.logger.debug(`Not enough questions available for type ${selectedTypeId} (count: ${currentCount})`);
          continue;
        }
        
        // Add new allocation
        let subsectionAlloc = sectionAllocations
          .find(sa => sa.sectionId === section.id)!
          .subsectionAllocations
          .find(sa => sa.subsectionQuestionTypeId === sqt.id);
        
        if (!subsectionAlloc) {
          const newSubsection = this.ensureSubsectionProperties({
            subsectionQuestionTypeId: sqt.id,
            questionTypeName: sqt.question_type.type_name,
            allocatedChapters: [{
              chapterId,
              chapterName: (await this.prisma.chapter.findUnique({
                where: { id: chapterId }
              }))!.name
            }]
          });
          
          sectionAllocations
            .find(sa => sa.sectionId === section.id)!
            .subsectionAllocations.push(newSubsection);
        } else {
          subsectionAlloc.allocatedChapters.push({
            chapterId,
            chapterName: (await this.prisma.chapter.findUnique({
              where: { id: chapterId }
            }))!.name
          });
        }
        
        // Update tracking
        usedQuestionTypes.get(section.id)!.add(selectedTypeId);
        chapterQuestionTypeUsage.set(selectedTypeId, currentCount - 1);
        
        // Add code to update the question count
        const newCount = Math.max(0, currentCount - 3);
        chapterQuestionTypes.set(selectedTypeId, newCount);
        this.logger.debug(`Updated question count for type ${selectedTypeId}: ${currentCount} -> ${newCount}`);

        this.logger.debug(`Successfully replaced ${currentMark} mark question with ${targetMark} mark question`);
      return true;
    }
    }
    
    return false;
  }

  private getQuestionTypeUsage(sectionAllocations: SectionAllocationDto[]): Map<number, number> {
    const usageMap = new Map<number, number>();
    
    sectionAllocations.forEach(section => {
      section.subsectionAllocations.forEach(subsection => {
        const questionTypeId = subsection.subsectionQuestionTypeId;
        usageMap.set(questionTypeId, (usageMap.get(questionTypeId) || 0) + subsection.allocatedChapters.length);
      });
    });
    
    return usageMap;
  }

  private getChapterQuestionTypeUsage(
    sectionAllocations: SectionAllocationDto[],
    chapterId: number,
    pattern: any
  ): Map<number, number> {
    // Track usage by actual question_type_id, not just subsection ID
    const usageMap = new Map<number, number>();
    
    // Initialize all question types from the pattern with 0 usage
    pattern.sections.forEach(section => {
      section.subsection_question_types.forEach(sqt => {
        const typeId = sqt.question_type_id;
        if (!usageMap.has(typeId)) {
          usageMap.set(typeId, 0);
        }
      });
    });
    
    // Count how many times each question type has been used for this chapter
    sectionAllocations.forEach(section => {
      section.subsectionAllocations.forEach(subsection => {
        // Find the question_type_id for this subsection
        const sectionObj = pattern.sections.find(s => s.id === section.sectionId);
        if (!sectionObj) return;
        
        const sqt = sectionObj.subsection_question_types.find(
          s => s.id === subsection.subsectionQuestionTypeId
        );
        if (!sqt) return;
        
        const questionTypeId = sqt.question_type_id;
        
        // Count allocations for this chapter for this question type
        const allocatedToChapter = subsection.allocatedChapters.filter(c => c.chapterId === chapterId).length;
        if (allocatedToChapter > 0) {
          usageMap.set(questionTypeId, (usageMap.get(questionTypeId) || 0) + allocatedToChapter);
        }
      });
    });
    
    return usageMap;
  }

  private isSubsectionAllocated(
    sectionAllocations: SectionAllocationDto[],
    sectionId: number,
    subsectionId: number
  ): boolean {
    const section = sectionAllocations.find(s => s.sectionId === sectionId);
    if (!section) return false;
    
    const subsection = section.subsectionAllocations.find(s => s.subsectionQuestionTypeId === subsectionId);
    return !!subsection && subsection.allocatedChapters.length > 0;
  }

  private canAddMoreQuestionsToSection(
    sectionAllocations: SectionAllocationDto[],
    section: any
  ): boolean {
    const allocatedQuestions = this.getSectionAllocatedQuestions(sectionAllocations, section.id);
    return allocatedQuestions < section.total_questions;
  }

  private getMaxQuestionsPerSubsection(section: any, subsectionId: number): number {
    // If the section has only one subsection_question_type, it can have multiple questions
    // up to total_questions (examples: sections 8, 10, 11, 12, 13)
    if (section.subsection_question_types.length === 1) {
      return section.total_questions;
    }
    
    // If the section has multiple subsection_question_types (like section 9),
    // each can only have 1 question
    return 1;
  }

  private canAddMoreQuestionsToSubsection(
    sectionAllocations: SectionAllocationDto[],
    section: any,
    subsectionId: number
  ): boolean {
    const maxQuestionsPerSubsection = this.getMaxQuestionsPerSubsection(section, subsectionId);
    
    const sectionAllocation = sectionAllocations.find(s => s.sectionId === section.id);
    if (!sectionAllocation) return true;
    
    const subsectionAllocation = sectionAllocation.subsectionAllocations.find(s => s.subsectionQuestionTypeId === subsectionId);
    if (!subsectionAllocation) return true;
    
    return subsectionAllocation.allocatedChapters.length < maxQuestionsPerSubsection;
  }

  private getAvailableQuestionTypes(
    section: any,
    sectionAllocations: SectionAllocationDto[],
    chapterId: number,
    chapterQuestionTypes: Map<number, number>,
    pattern: any
  ): { unused: number[], leastUsed: number[] } {
    const unusedTypes: Array<{subsectionId: number, typeId: number}> = [];
    const usedTypes: Array<{subsectionId: number, typeId: number, usageCount: number}> = [];
    
    // First check if we can add more questions to this section
    if (!this.canAddMoreQuestionsToSection(sectionAllocations, section)) {
      return { unused: [], leastUsed: [] };
    }
    
    // Get question types usage for this chapter by their underlying question_type_id
    const chapterTypeUsage = this.getChapterQuestionTypeUsage(sectionAllocations, chapterId, pattern);
    
    this.logger.debug(`Question type usage for chapter ${chapterId}: ${
      Array.from(chapterTypeUsage.entries())
        .map(([typeId, count]) => `type ${typeId}: ${count}`)
        .join(', ')
    }`);
    
    // Check each question type in the section
    for (const sqt of section.subsection_question_types) {
      const questionTypeId = sqt.question_type_id;
      
      // Skip if no questions available for this type
      const availableCount = chapterQuestionTypes.get(questionTypeId) || 0;
      if (availableCount <= 0) continue;
      
      // Get max questions per subsection - based on section structure
      const maxQuestionsPerSubsection = this.getMaxQuestionsPerSubsection(section, sqt.id);
      
      // Check if subsection can accept more questions
      if (!this.canAddMoreQuestionsToSubsection(sectionAllocations, section, sqt.id)) {
        continue;
      }
      
      // Check if this QUESTION TYPE (not subsection) has been used for this chapter
      const typeUsage = chapterTypeUsage.get(questionTypeId) || 0;
      
      if (typeUsage === 0) {
        unusedTypes.push({ subsectionId: sqt.id, typeId: questionTypeId });
      } else {
        usedTypes.push({ subsectionId: sqt.id, typeId: questionTypeId, usageCount: typeUsage });
      }
    }
    
    // Log available types
    this.logger.debug(`Available unused types: ${
      unusedTypes.map(t => `subsection ${t.subsectionId} (type ${t.typeId})`).join(', ')
    }`);
    this.logger.debug(`Available used types: ${
      usedTypes.map(t => `subsection ${t.subsectionId} (type ${t.typeId}, used ${t.usageCount})`).join(', ')
    }`);
    
    // Sort used types by usage count (ascending)
    const sortedUsedTypes = usedTypes.sort((a, b) => a.usageCount - b.usageCount);
    
    // Get the types with the lowest usage count
    const leastUsedCount = sortedUsedTypes.length > 0 ? sortedUsedTypes[0].usageCount : 0;
    const leastUsedTypes = sortedUsedTypes
      .filter(t => t.usageCount === leastUsedCount)
      .map(t => t.typeId);
    
    return { 
      unused: unusedTypes.map(t => t.typeId), 
      leastUsed: leastUsedTypes 
    };
  }

  private getLeastUsedQuestionType(
    availableTypes: { unused: number[], leastUsed: number[] },
    chapterQuestionTypes: Map<number, number>
  ): number | null {
    // Prioritize unused types first
    if (availableTypes.unused.length > 0) {
      // Randomly select from unused types
      const randomIndex = Math.floor(Math.random() * availableTypes.unused.length);
      return availableTypes.unused[randomIndex];
    }
    
    // If no unused types, use least used types
    if (availableTypes.leastUsed.length > 0) {
      // Randomly select from least used types
      const randomIndex = Math.floor(Math.random() * availableTypes.leastUsed.length);
      return availableTypes.leastUsed[randomIndex];
    }
    
    return null;
  }

  private getAllAvailableQuestionTypesByMark(
    mark: number,
    pattern: any,
    sectionAllocations: SectionAllocationDto[],
    chapterId: number,
    chapterQuestionTypes: Map<number, number>
  ): { sectionId: number, subsectionId: number, questionTypeId: number, usage: number }[] {
    // Get all sections with this mark value
    const sectionsWithMark = pattern.sections.filter(s => s.marks_per_question === mark);
    
    // Track all available question types across all sections
    const availableQuestionTypes: { 
      sectionId: number, 
      subsectionId: number, 
      questionTypeId: number, 
      usage: number 
    }[] = [];
    
    // Get usage stats for question types for this chapter
    const chapterTypeUsage = this.getChapterQuestionTypeUsage(sectionAllocations, chapterId, pattern);
    
    // Check each section for available question types
    for (const section of sectionsWithMark) {
      // Skip if section is full
      const allocatedQuestions = this.getSectionAllocatedQuestions(sectionAllocations, section.id);
      if (allocatedQuestions >= section.total_questions) {
        this.logger.debug(`Section ${section.id} (${section.section_name}) is full (${allocatedQuestions}/${section.total_questions})`);
        continue;
      }
      
      // Check each question type in this section
      for (const sqt of section.subsection_question_types) {
        const questionTypeId = sqt.question_type_id;
        
        // Skip if no questions available for this type
        const availableCount = chapterQuestionTypes.get(questionTypeId) || 0;
        if (availableCount <= 0) {
          this.logger.debug(`No available questions for type ${questionTypeId} (count: ${availableCount})`);
          continue;
        }
        
        // Check if subsection can accept more questions
        if (!this.canAddMoreQuestionsToSubsection(sectionAllocations, section, sqt.id)) {
          continue;
        }
        
        // Get usage count for this question type for this chapter
        const usageCount = chapterTypeUsage.get(questionTypeId) || 0;
        
        // Add to available types
        availableQuestionTypes.push({
          sectionId: section.id,
          subsectionId: sqt.id,
          questionTypeId: questionTypeId,
          usage: usageCount
        });
      }
    }
    
    return availableQuestionTypes;
  }
  
  private selectBestQuestionType(
    availableTypes: { sectionId: number, subsectionId: number, questionTypeId: number, usage: number }[]
  ): { sectionId: number, subsectionId: number, questionTypeId: number } | null {
    if (availableTypes.length === 0) return null;
    
    // First, prioritize unused question types
    const unusedTypes = availableTypes.filter(type => type.usage === 0);
    
    if (unusedTypes.length > 0) {
      // Randomly select from unused types
      const randomIndex = Math.floor(Math.random() * unusedTypes.length);
      const selected = unusedTypes[randomIndex];
      this.logger.debug(`Selected unused question type ${selected.questionTypeId} in section ${selected.sectionId}`);
      return selected;
    }
    
    // If all types have been used, find the least used ones
    const minUsage = Math.min(...availableTypes.map(type => type.usage));
    const leastUsedTypes = availableTypes.filter(type => type.usage === minUsage);
    
    // Randomly select from least used types
    const randomIndex = Math.floor(Math.random() * leastUsedTypes.length);
    const selected = leastUsedTypes[randomIndex];
    this.logger.debug(`Selected least used question type ${selected.questionTypeId} in section ${selected.sectionId} (used ${selected.usage} times)`);
    return selected;
  }

  async distributeChapterMarks(filter: ChapterMarksRequestDto): Promise<ChapterMarksDistributionResponseDto> {
    this.logger.log('Starting chapter marks distribution');
    this.logger.debug(`Pattern ID: ${filter.patternId}`);
    this.logger.debug(`Chapter IDs: ${filter.chapterIds.join(', ')}`);
    this.logger.debug(`Requested marks: ${filter.requestedMarks.join(', ')}`);

    // 1. Get pattern details with explicit include structure
    const pattern = await this.prisma.pattern.findUnique({
      where: { id: filter.patternId },
      include: {
        board: true,
        standard: true,
        subject: true,
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
      throw new NotFoundException(`Pattern with ID ${filter.patternId} not found`);
    }

    this.logger.debug(`Pattern found: ${pattern.pattern_name}`);
    this.logger.debug(`Sections: ${pattern.sections.map(s => `${s.section_name} (${s.marks_per_question} marks)`).join(', ')}`);

    // 2. Calculate total marks
    const totalMarks = pattern.sections.reduce((sum, section) => 
      sum + (section.marks_per_question * section.total_questions), 0);

    // 3. Validate requested marks
    const totalRequestedMarks = filter.requestedMarks.reduce((sum, marks) => sum + marks, 0);
    if (totalRequestedMarks !== totalMarks) {
      throw new BadRequestException(
        `Total requested marks (${totalRequestedMarks}) do not match pattern total marks (${totalMarks})`
      );
    }

    // 4. Get chapter question type counts
    const chapterQuestionTypeMap = await this.getChapterQuestionTypeCounts(
      filter.chapterIds,
      filter.mediumIds,
      pattern
    );

    // Create a deep copy of the original map for reference
    const originalChapterQuestionTypeMap = new Map<number, Map<number, number>>();
    for (const [chapterId, questionTypeCounts] of chapterQuestionTypeMap.entries()) {
      originalChapterQuestionTypeMap.set(chapterId, new Map(questionTypeCounts));
    }

    // 5. Create chapter priority list based on number of question types
    const chapterPriorityList = Array.from(chapterQuestionTypeMap.entries())
      .sort((a, b) => a[1].size - b[1].size)
      .map(([chapterId]) => chapterId);

    this.logger.debug(`Chapter priority list: ${chapterPriorityList.join(' -> ')}`);

    // 6. Initialize tracking variables
    const chapterMarksMap = new Map<number, number>();
    const sectionAllocations: SectionAllocationDto[] = pattern.sections.map(section => {
      const sectionAlloc = this.ensureSectionProperties({
        sectionId: section.id,
        sectionName: section.section_name,
        sequentialNumber: section.sequence_number,
        subSection: section.sub_section,
        totalQuestions: section.total_questions,
        absoluteMarks: section.marks_per_question * section.total_questions,
        totalMarks: section.marks_per_question * section.total_questions,
        subsectionAllocations: section.subsection_question_types.map(sqt => 
          this.ensureSubsectionProperties({
            subsectionQuestionTypeId: sqt.id,
            questionTypeName: sqt.question_type.type_name,
            sequentialNumber: sqt.seqencial_subquestion_number,
            allocatedChapters: []
          })
        )
      });
      return sectionAlloc;
    });

    // 7. Get unique marks per question
    const uniqueMarks = [...new Set(pattern.sections.map(s => s.marks_per_question))].sort((a, b) => a - b);
    this.logger.debug(`Unique marks: ${uniqueMarks.join(', ')}`);

    // 8. Initialize question type usage tracking
    const usedQuestionTypes = new Map<number, Set<number>>();
    const questionTypeUsage = new Map<number, number>();
    
    pattern.sections.forEach(section => {
      usedQuestionTypes.set(section.id, new Set<number>());
    });
    
    filter.chapterIds.forEach(chapterId => {
      questionTypeUsage.set(chapterId, 0);
    });

    // Store unallocated marks to redistribute later
    let unallocatedMarks = 0;

    // 9. Process each chapter in priority order
    for (const chapterId of chapterPriorityList) {
      const requestedMarks = filter.requestedMarks[filter.chapterIds.indexOf(chapterId)];
      let remainingMarks = requestedMarks;
      const chapterQuestionTypes = chapterQuestionTypeMap.get(chapterId) || new Map();

      this.logger.debug(`\nProcessing chapter ${chapterId} with requested marks: ${requestedMarks}`);
      this.logger.debug(`Available question types: ${Array.from(chapterQuestionTypes.entries())
        .map(([typeId, count]) => `type ${typeId}: ${count} questions`)
        .join(', ')}`);

      // Log section structure for better debugging
      this.logger.debug('Section structure:');
      for (const section of pattern.sections) {
        const maxQuestionsPerSubsection = this.getMaxQuestionsPerSubsection(section, 0);
        const multipleQuestionsAllowed = section.subsection_question_types.length === 1;
        
        this.logger.debug(`Section ${section.id} (${section.section_name}): ${section.total_questions} total questions, ${section.marks_per_question} marks each`);
        this.logger.debug(`  Has ${section.subsection_question_types.length} question types, ${multipleQuestionsAllowed ? 'allows multiple questions per type' : 'only 1 question per type'}`);
        for (const sqt of section.subsection_question_types) {
          this.logger.debug(`  - Type ${sqt.question_type.id} (${sqt.question_type.type_name})`);
        }
      }

      // Randomly decide if we'll fill marks in ascending or descending order for this chapter
      const isAscendingMarkOrder = Math.random() < 0.5;
      this.logger.debug(`Base mark order for chapter ${chapterId}: ${isAscendingMarkOrder ? 'ascending' : 'descending'}`);

      // If we still have unallocated marks from previous chapters, try to add them to this chapter's request
      if (unallocatedMarks > 0) {
        this.logger.debug(`Adding ${unallocatedMarks} unallocated marks from previous chapters to this chapter's request`);
        remainingMarks += unallocatedMarks;
        unallocatedMarks = 0;
      }

      while (remainingMarks > 0) {
        let iterationMarks = 0;
        let marksAllocatedInIteration = false;
        
        // Randomly decide if we'll fill marks in ascending or descending order for this iteration
        // With a small chance (20%), we'll completely randomize the order for more diversity
        const randomizeCompletely = Math.random() < 0.2;
        const isAscendingOrder = randomizeCompletely ? true : isAscendingMarkOrder;
        
        let marksToTry = isAscendingOrder ? [...uniqueMarks] : [...uniqueMarks].reverse();
        if (randomizeCompletely) {
          marksToTry = this.generateRandomSequence(marksToTry);
          this.logger.debug(`Using completely randomized marks order for this iteration: ${marksToTry.join(' -> ')}`);
        }
        
        let currentMarkIndex = 0;

        this.logger.debug(`\nStarting new iteration for chapter ${chapterId}`);
        this.logger.debug(`Remaining marks: ${remainingMarks}`);
        this.logger.debug(`Using marks order: ${marksToTry.join(' -> ')}`);

        // Try to allocate one question of each mark type in sequence
        while (currentMarkIndex < marksToTry.length) {
          const mark = marksToTry[currentMarkIndex];
          this.logger.debug(`\nTrying mark ${mark} (index ${currentMarkIndex})`);

          if (mark > remainingMarks) {
            this.logger.debug(`Skipping mark ${mark} as it's greater than remaining marks ${remainingMarks}`);
            currentMarkIndex++;
            continue;
          }

          // Get ALL available question types across ALL sections with this mark value
          const availableQuestionTypes = this.getAllAvailableQuestionTypesByMark(
            mark, 
            pattern, 
            sectionAllocations, 
            chapterId, 
            chapterQuestionTypes
          );

          if (availableQuestionTypes.length === 0) {
            this.logger.debug(`No available question types for mark ${mark}`);
            currentMarkIndex++;
            continue;
          }

          this.logger.debug(`Found ${availableQuestionTypes.length} available question types for mark ${mark}:`);
          availableQuestionTypes.forEach(type => {
            const section = pattern.sections.find(s => s.id === type.sectionId);
            const sqt = section.subsection_question_types.find(s => s.id === type.subsectionId);
            this.logger.debug(`  - Section ${type.sectionId} (${section.section_name}), Type ${type.questionTypeId} (${sqt.question_type.type_name}), Usage: ${type.usage}`);
          });

          // Select the best question type to use (prioritizing unused types)
          const selectedType = this.selectBestQuestionType(availableQuestionTypes);
          
          if (!selectedType) {
            this.logger.debug(`Could not select a question type for mark ${mark}`);
            currentMarkIndex++;
              continue;
            }

          // Find the section and subsection
          const section = pattern.sections.find(s => s.id === selectedType.sectionId);
          const selectedSqt = section.subsection_question_types.find(s => s.id === selectedType.subsectionId);
          
          const questionTypeId = selectedType.questionTypeId;
          
          // Get current question count for this type
          const currentCount = chapterQuestionTypes.get(questionTypeId) || 0;
          const originalCount = originalChapterQuestionTypeMap.get(chapterId)?.get(questionTypeId) || 0;
          
          // Skip if we don't have enough questions of this type
          if (currentCount <= 0) {
            this.logger.debug(`Not enough questions available for type ${questionTypeId} (count: ${currentCount})`);
            currentMarkIndex++;
                continue;
              }

          this.logger.debug(`Allocating question type ${questionTypeId} (${selectedSqt.question_type.type_name}) in section ${section.id} (${section.section_name}) to chapter ${chapterId}`);
          this.logger.debug(`Question type usage before: ${currentCount}/${originalCount}`);

              // Allocate the question
          let subsectionAllocation = sectionAllocations
                .find(sa => sa.sectionId === section.id)!
                .subsectionAllocations
            .find(sa => sa.subsectionQuestionTypeId === selectedType.subsectionId);

              if (!subsectionAllocation) {
                const newSubsection = this.ensureSubsectionProperties({
                  subsectionQuestionTypeId: selectedSqt.id,
                  questionTypeName: selectedSqt.question_type.type_name,
                  allocatedChapters: [{
                    chapterId,
                    chapterName: (await this.prisma.chapter.findUnique({
                      where: { id: chapterId }
                    }))!.name
                  }]
                });
                
                sectionAllocations
                  .find(sa => sa.sectionId === section.id)!
                  .subsectionAllocations.push(newSubsection);
              } else {
                subsectionAllocation.allocatedChapters.push({
                  chapterId,
                  chapterName: (await this.prisma.chapter.findUnique({
                    where: { id: chapterId }
                  }))!.name
                });
              }

              // Update tracking
              usedQuestionTypes.get(section.id)!.add(questionTypeId);
          questionTypeUsage.set(questionTypeId, currentCount - 1);
              remainingMarks -= mark;
              iterationMarks += mark;
              marksAllocatedInIteration = true;

              this.logger.debug(`Allocated ${mark} marks. Remaining marks: ${remainingMarks}`);
          this.logger.debug(`Question type usage after: ${currentCount - 1}/${originalCount}`);

          // Add decrement of question type count by 3 here
          const newCount = Math.max(0, currentCount - 3);
          chapterQuestionTypes.set(questionTypeId, newCount);
          this.logger.debug(`Updated question count for type ${questionTypeId}: ${currentCount} -> ${newCount}`);

            currentMarkIndex++;
        }

        // If we couldn't allocate any marks in this iteration, try to handle remaining marks
        if (!marksAllocatedInIteration && remainingMarks > 0) {
          this.logger.debug(`\nNo marks allocated in iteration, handling remaining marks: ${remainingMarks}`);
          
          // Try to allocate sections that exactly match the remaining marks first
            this.logger.debug(`Trying direct allocation for remaining marks: ${remainingMarks}`);
          
          // Get all sections with exactly matching marks per question
          const exactMatchSections = pattern.sections
            .filter(section => section.marks_per_question === remainingMarks)
            .sort((a, b) => {
              // Prioritize sections with fewer allocated questions
              const aAllocated = this.getSectionAllocatedQuestions(sectionAllocations, a.id);
              const bAllocated = this.getSectionAllocatedQuestions(sectionAllocations, b.id);
              return (aAllocated / a.total_questions) - (bAllocated / b.total_questions);
            });
          
          this.logger.debug(`Found ${exactMatchSections.length} sections with marks_per_question = ${remainingMarks}`);
          
          let exactMatchAllocated = false;
          
          // Try to allocate to each section
          for (const section of exactMatchSections) {
              const allocatedQuestions = this.getSectionAllocatedQuestions(sectionAllocations, section.id);
            if (allocatedQuestions >= section.total_questions) {
              this.logger.debug(`Section ${section.id} (${section.section_name}) is full (${allocatedQuestions}/${section.total_questions})`);
              continue;
            }
            
            // Get available question types
            const availableTypes = this.getAvailableQuestionTypes(
              section, 
              sectionAllocations, 
              chapterId,
              chapterQuestionTypes,
              pattern
            );
            
            // Get the best question type to use
            const selectedTypeId = this.getLeastUsedQuestionType(availableTypes, chapterQuestionTypes);
            if (!selectedTypeId) {
              this.logger.debug(`No suitable question type found for section ${section.id}`);
              continue;
            }
            
            // Find the corresponding subsection
            const selectedSqt = section.subsection_question_types.find(
              sqt => sqt.question_type_id === selectedTypeId
            );
            
            if (!selectedSqt) {
              this.logger.debug(`Couldn't find subsection for question type ${selectedTypeId}`);
              continue;
            }
            
            const currentCount = chapterQuestionTypes.get(selectedTypeId) || 0;
            
            // Skip if we don't have enough questions of this type
            if (currentCount <= 0) {
              this.logger.debug(`Not enough questions available for type ${selectedTypeId} (count: ${currentCount})`);
              continue;
            }

                // Allocate the question
            let subsectionAllocation = sectionAllocations
                  .find(sa => sa.sectionId === section.id)!
                  .subsectionAllocations
              .find(sa => sa.subsectionQuestionTypeId === selectedSqt.id);

                if (!subsectionAllocation) {
                  const newSubsection = this.ensureSubsectionProperties({
                    subsectionQuestionTypeId: selectedSqt.id,
                    questionTypeName: selectedSqt.question_type.type_name,
                    allocatedChapters: [{
                      chapterId,
                      chapterName: (await this.prisma.chapter.findUnique({
                        where: { id: chapterId }
                      }))!.name
                    }]
                  });
                  
                  sectionAllocations
                    .find(sa => sa.sectionId === section.id)!
                    .subsectionAllocations.push(newSubsection);
                } else {
                  subsectionAllocation.allocatedChapters.push({
                    chapterId,
                    chapterName: (await this.prisma.chapter.findUnique({
                      where: { id: chapterId }
                    }))!.name
                  });
                }

                // Update tracking
            usedQuestionTypes.get(section.id)!.add(selectedTypeId);
            questionTypeUsage.set(selectedTypeId, currentCount - 1);
                remainingMarks -= remainingMarks;
            this.logger.debug(`Directly allocated ${remainingMarks} marks to section ${section.id}. Remaining marks: 0`);
            exactMatchAllocated = true;

            // Add decrement of question type count by 3 here
            const newCount = Math.max(0, currentCount - 3);
            chapterQuestionTypes.set(selectedTypeId, newCount);
            this.logger.debug(`Updated question count for type ${selectedTypeId}: ${currentCount} -> ${newCount}`);

                break;
          }

          // Skip the old direct allocation and go to the replacement logic if we couldn't do exact match
          if (!exactMatchAllocated && remainingMarks > 0) {
            // Try to replace existing allocations
            this.logger.debug(`Trying to replace existing allocations for remaining marks: ${remainingMarks}`);
            for (const mark of marksToTry) {
              if (mark <= remainingMarks) continue;

              // Try to replace lower mark questions with this higher mark question
              for (const lowerMark of marksToTry) {
                if (lowerMark >= mark) continue;

                const success = await this.tryReplaceAllocation(
                  sectionAllocations,
                  chapterId,
                  lowerMark,
                  mark,
                  chapterQuestionTypes,
                  questionTypeUsage,
                  usedQuestionTypes,
                  pattern
                );

                if (success) {
                  remainingMarks += lowerMark - mark;
                  this.logger.debug(`Replaced ${lowerMark} mark question with ${mark} mark question. New remaining marks: ${remainingMarks}`);
                  break;
                }
              }
              if (remainingMarks === 0) break;
            }
          }

          if (remainingMarks > 0) {
            this.logger.debug(`Could not allocate any more marks for chapter ${chapterId}. Remaining marks: ${remainingMarks}`);
            break;
          }
        }
      }

      // If we still have unallocated marks after all attempts, store them for redistribution
      if (remainingMarks > 0) {
        this.logger.debug(`Could not allocate ${remainingMarks} marks for chapter ${chapterId}, saving for redistribution`);
        unallocatedMarks += remainingMarks;
        remainingMarks = 0;
      }

      // Update chapter marks
      chapterMarksMap.set(chapterId, requestedMarks - remainingMarks);
      this.logger.debug(`Final marks for chapter ${chapterId}: ${requestedMarks - remainingMarks}`);
    }

    // Handle any remaining unallocated marks after processing all chapters
    if (unallocatedMarks > 0) {
      this.logger.debug(`Still have ${unallocatedMarks} unallocated marks after processing all chapters`);
      
      // Try to distribute unallocated marks to any chapter that can accept them
      let redistributed = false;
      for (const chapterId of chapterPriorityList.reverse()) { // Try in reverse priority order
        // Get the chapter's available question types
        const chapterTypes = chapterQuestionTypeMap.get(chapterId) || new Map<number, number>();
        
        // Find all available question types for any mark value for this chapter
        let availableQuestionTypes = [];
        for (const mark of uniqueMarks) {
          const typesForMark = this.getAllAvailableQuestionTypesByMark(
            mark,
            pattern,
            sectionAllocations,
            chapterId,
            chapterTypes // Using the correct map for this chapter
          );
          availableQuestionTypes = availableQuestionTypes.concat(typesForMark);
        }
        
        if (availableQuestionTypes.length > 0) {
          this.logger.debug(`Found ${availableQuestionTypes.length} available question types for chapter ${chapterId} to redistribute marks`);
          
          // Sort by mark value to prioritize higher marks
          availableQuestionTypes.sort((a, b) => {
            const sectionA = pattern.sections.find(s => s.id === a.sectionId);
            const sectionB = pattern.sections.find(s => s.id === b.sectionId);
            return sectionB.marks_per_question - sectionA.marks_per_question;
          });
          
          // Try to allocate as many questions as possible
          while (unallocatedMarks > 0 && availableQuestionTypes.length > 0) {
            // Find question types that can be allocated with remaining marks
            const allocatableTypes = availableQuestionTypes.filter(type => {
              const section = pattern.sections.find(s => s.id === type.sectionId);
              return section.marks_per_question <= unallocatedMarks;
            });
            
            if (allocatableTypes.length === 0) break;
            
            // Select the best type
            const selectedType = this.selectBestQuestionType(allocatableTypes);
            if (!selectedType) break;
            
            // Find the section and its mark value
            const section = pattern.sections.find(s => s.id === selectedType.sectionId);
            const markValue = section.marks_per_question;
            const selectedSqt = section.subsection_question_types.find(s => s.id === selectedType.subsectionId);
            
            // Get current question count for this type
            const questionTypeId = selectedType.questionTypeId;
            const currentCount = chapterTypes.get(questionTypeId) || 0;
            
            // Skip if we don't have enough questions of this type
            if (currentCount <= 0) {
              this.logger.debug(`Not enough questions available for type ${questionTypeId} (count: ${currentCount})`);
              // Remove this type from the available types
              availableQuestionTypes = availableQuestionTypes.filter(t => 
                !(t.sectionId === selectedType.sectionId && t.questionTypeId === questionTypeId)
              );
              continue;
            }
            
            // Allocate the question
            this.logger.debug(`Redistributing ${markValue} marks to chapter ${chapterId} with question type ${selectedType.questionTypeId}`);
            
            let subsectionAllocation = sectionAllocations
              .find(sa => sa.sectionId === section.id)!
              .subsectionAllocations
              .find(sa => sa.subsectionQuestionTypeId === selectedType.subsectionId);

            if (!subsectionAllocation) {
              const newSubsection = this.ensureSubsectionProperties({
                subsectionQuestionTypeId: selectedSqt.id,
                questionTypeName: selectedSqt.question_type.type_name,
                allocatedChapters: [{
                  chapterId,
                  chapterName: (await this.prisma.chapter.findUnique({
                    where: { id: chapterId }
                  }))!.name
                }]
              });
              
              sectionAllocations
                .find(sa => sa.sectionId === section.id)!
                .subsectionAllocations.push(newSubsection);
            } else {
              subsectionAllocation.allocatedChapters.push({
                chapterId,
                chapterName: (await this.prisma.chapter.findUnique({
                  where: { id: chapterId }
                }))!.name
              });
            }
            
            // Update tracking
            usedQuestionTypes.get(section.id)!.add(questionTypeId);
            questionTypeUsage.set(questionTypeId, currentCount - 1);
            
            // Update marks
            unallocatedMarks -= markValue;
            const currentMarks = chapterMarksMap.get(chapterId) || 0;
            chapterMarksMap.set(chapterId, currentMarks + markValue);
            this.logger.debug(`Chapter ${chapterId} marks updated to ${currentMarks + markValue}`);
            
            // Update the question count for this type directly in the existing map
            const newCount = Math.max(0, currentCount - 3);
            chapterTypes.set(questionTypeId, newCount);
            
            this.logger.debug(`Updated question count for type ${questionTypeId}: ${currentCount} -> ${newCount}`);
            
            // Update the available question types with the updated map
            availableQuestionTypes = this.getAllAvailableQuestionTypesByMark(
              markValue,
              pattern,
              sectionAllocations,
              chapterId,
              chapterTypes // Using the updated map
            );
            
            redistributed = true;
          }
          
          if (unallocatedMarks === 0) break;
        }
      }
      
      // If we still couldn't allocate all marks, warn about it
      if (unallocatedMarks > 0) {
        this.logger.warn(`Could not allocate all marks. ${unallocatedMarks} marks remain unallocated.`);
      } else if (redistributed) {
        this.logger.debug(`Successfully redistributed all unallocated marks`);
      }
    }

    // 10. Prepare final response
    const chapterMarks: ChapterMarksDto[] = [];
    for (const chapterId of filter.chapterIds) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId }
      });
      if (!chapter) continue;

      chapterMarks.push({
        chapterId,
        chapterName: chapter.name,
        absoluteMarks: chapterMarksMap.get(chapterId) || 0
      });
    }

    return {
      patternId: pattern.id,
      patternName: pattern.pattern_name,
      totalMarks,
      absoluteMarks: totalMarks,
      sectionAllocations: sectionAllocations.map(section => {
        // Apply the section helper
        this.ensureSectionProperties(section);
        
        // Apply the subsection helper to all subsections
        section.subsectionAllocations = section.subsectionAllocations.map(subsection => 
          this.ensureSubsectionProperties(subsection)
        );
        
        return section;
      }),
      chapterMarks
    };
  }

  async processFinalQuestionsDistribution(requestBody: FinalQuestionsDistributionBodyDto): Promise<ChapterMarksDistributionResponseDto> {
    const { patternId, mediumIds = [] } = requestBody;
    this.logger.log(`Processing final questions distribution for pattern ID ${patternId}`);

    try {
      // Validate that the pattern exists
      const pattern = await this.prisma.pattern.findUnique({
        where: { id: patternId },
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
        },
      });

      if (!pattern) {
        throw new NotFoundException(`Pattern with ID ${patternId} not found`);
      }

      // Create new response DTO
      const responseDto = new ChapterMarksDistributionResponseDto();
      responseDto.patternId = requestBody.patternId;
      responseDto.patternName = requestBody.patternName;
      responseDto.totalMarks = requestBody.totalMarks;
      responseDto.absoluteMarks = requestBody.absoluteMarks;
      responseDto.sectionAllocations = [];
      responseDto.chapterMarks = requestBody.chapterMarks.map(chapter => {
        const chapterMark = new ChapterMarksDto();
        chapterMark.chapterId = chapter.chapterId;
        chapterMark.chapterName = chapter.chapterName;
        chapterMark.absoluteMarks = chapter.absoluteMarks;
        return chapterMark;
      });

      // Keep track of used questions to avoid repetition
      const usedQuestionIds = new Map<number, Set<number>>(); // Map<QuestionTypeId, Set<QuestionId>>

      // Process each section and its allocations
      for (const section of requestBody.sectionAllocations) {
        this.logger.log(`Processing section ${section.sectionId}: ${section.sectionName}`);
        
        const sectionAllocation = new SectionAllocationDto();
        sectionAllocation.sectionId = section.sectionId;
        sectionAllocation.sectionName = section.sectionName;
        sectionAllocation.sequentialNumber = section.sequentialNumber;
        sectionAllocation.subSection = section.subSection;
        sectionAllocation.totalQuestions = section.totalQuestions;
        sectionAllocation.absoluteMarks = section.absoluteMarks;
        sectionAllocation.totalMarks = section.totalMarks;
        sectionAllocation.subsectionAllocations = [];

        // Process each subsection and its allocations
        for (const subsection of section.subsectionAllocations) {
          this.logger.log(`Processing subsection ${subsection.subsectionQuestionTypeId}: ${subsection.questionTypeName}`);
          
          // First try to get the question type ID from the pattern
          let questionTypeId = this.findQuestionTypeIdFromPattern(pattern, section.sectionId, subsection.subsectionQuestionTypeId);
          
          // If not found in pattern, try to get from database directly by name
          if (!questionTypeId) {
            this.logger.log(`Question type ID not found in pattern. Trying to look up by name: ${subsection.questionTypeName}`);
            
            try {
              const questionType = await this.prisma.question_Type.findFirst({
                where: {
                  type_name: subsection.questionTypeName
                }
              });
              
              if (questionType) {
                questionTypeId = questionType.id;
                this.logger.log(`Found question type ID ${questionTypeId} by name: ${subsection.questionTypeName}`);
              }
            } catch (err) {
              this.logger.error(`Error looking up question type by name: ${err.message}`);
            }
          }
          
          if (!questionTypeId) {
            this.logger.warn(`Could not find question type ID for section ${section.sectionId}, subsection ${subsection.subsectionQuestionTypeId}, name: ${subsection.questionTypeName}`);
            // Still keep the structure even without questions
            const subsectionAlloc = new SubsectionAllocationDto();
            subsectionAlloc.subsectionQuestionTypeId = subsection.subsectionQuestionTypeId;
            subsectionAlloc.questionTypeName = subsection.questionTypeName;
            subsectionAlloc.sequentialNumber = subsection.sequentialNumber;
            subsectionAlloc.allocatedChapters = subsection.allocatedChapters.map(chapter => {
              const chapterAlloc = new AllocatedChapterDto();
              chapterAlloc.chapterId = chapter.chapterId;
              chapterAlloc.chapterName = chapter.chapterName;
              return chapterAlloc;
            });
            sectionAllocation.subsectionAllocations.push(subsectionAlloc);
            continue;
          }

          // Initialize tracking for this question type if not exists
          if (!usedQuestionIds.has(questionTypeId)) {
            usedQuestionIds.set(questionTypeId, new Set<number>());
          }

          const subsectionAllocation = new SubsectionAllocationDto();
          subsectionAllocation.subsectionQuestionTypeId = subsection.subsectionQuestionTypeId;
          subsectionAllocation.questionTypeName = subsection.questionTypeName;
          subsectionAllocation.sequentialNumber = subsection.sequentialNumber;
          subsectionAllocation.allocatedChapters = [];

          // Process each allocated chapter
          for (const allocatedChapter of subsection.allocatedChapters) {
            this.logger.log(`Finding question for chapter ${allocatedChapter.chapterId}: ${allocatedChapter.chapterName}`);
            
            // Fetch a random question for this chapter and question type
            const question = await this.getRandomQuestion(
              allocatedChapter.chapterId,
              questionTypeId,
              usedQuestionIds.get(questionTypeId),
              mediumIds
            );

            const chapterAllocation = new AllocatedChapterDto();
            chapterAllocation.chapterId = allocatedChapter.chapterId;
            chapterAllocation.chapterName = allocatedChapter.chapterName;

            if (question) {
              // Track this question as used
              usedQuestionIds.get(questionTypeId).add(question.id);
              this.logger.log(`Allocated question ID ${question.id} to chapter ${allocatedChapter.chapterId}`);

              // Set the question directly on the allocatedChapter
              chapterAllocation.question = question;
            } else {
              // If no question found, still include the chapter but without question data
              this.logger.warn(`No available question found for chapter ${allocatedChapter.chapterId}, question type ${questionTypeId}`);
            }

            subsectionAllocation.allocatedChapters.push(chapterAllocation);
          }

          sectionAllocation.subsectionAllocations.push(subsectionAllocation);
        }

        responseDto.sectionAllocations.push(sectionAllocation);
      }

      return responseDto;
    } catch (error) {
      this.logger.error(`Error processing final questions distribution: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper method to find question type ID from pattern data
  private findQuestionTypeIdFromPattern(pattern: any, sectionId: number, subsectionQuestionTypeId: number): number {
    try {
      this.logger.log(`Looking for question type ID in pattern for section ${sectionId}, subsection ${subsectionQuestionTypeId}`);
      
      // Check if pattern has sections
      if (!pattern.sections || !Array.isArray(pattern.sections)) {
        this.logger.warn(`Pattern has no sections or sections is not an array`);
        return null;
      }
      
      // Find the section
      const section = pattern.sections.find(s => s.id === sectionId);
      if (!section) {
        this.logger.warn(`Section ${sectionId} not found in pattern`);
        
        // Log available sections for debugging
        const availableSections = pattern.sections.map(s => s.id);
        this.logger.warn(`Available sections: ${availableSections.join(', ')}`);
        
        return null;
      }
      
      // Check if section has subsection_question_types
      if (!section.subsection_question_types || !Array.isArray(section.subsection_question_types)) {
        this.logger.warn(`Section ${sectionId} has no subsection_question_types or it's not an array`);
        return null;
      }
      
      // Find the subsection
      const subsection = section.subsection_question_types.find(s => s.id === subsectionQuestionTypeId);
      if (!subsection) {
        this.logger.warn(`Subsection ${subsectionQuestionTypeId} not found in section ${sectionId}`);
        
        // Log available subsections for debugging
        const availableSubsections = section.subsection_question_types.map(s => s.id);
        this.logger.warn(`Available subsections: ${availableSubsections.join(', ')}`);
        
        // Try to find by seqencial_subquestion_number as fallback
        const subsectionBySequence = section.subsection_question_types.find(s => s.seqencial_subquestion_number === subsectionQuestionTypeId);
        if (subsectionBySequence) {
          this.logger.log(`Found subsection by sequence number instead: ${subsectionBySequence.id}`);
          return subsectionBySequence.question_type_id;
        }
        
        return null;
      }
      
      this.logger.log(`Found question type ID: ${subsection.question_type_id} for subsection ${subsectionQuestionTypeId}`);
      return subsection.question_type_id;
    } catch (error) {
      this.logger.error(`Error finding question type ID: ${error.message}`, error.stack);
      return null;
    }
  }

  // Helper method to get a random question for a chapter and question type
  private async getRandomQuestion(chapterId: number, questionTypeId: number, usedQuestionIds: Set<number>, mediumIds: number[] = []): Promise<any> {
    try {
      this.logger.log(`Finding questions for chapter ${chapterId}, question type ${questionTypeId}`);
      
      // Count available questions for error logging
      const totalAvailable = await this.prisma.question.count({
        where: { question_type_id: questionTypeId }
      });
      
      const totalForChapter = await this.prisma.question.count({
        where: {
          question_type_id: questionTypeId,
          question_topics: {
            some: {
              topic: {
                chapter_id: chapterId
              }
            }
          }
        }
      });
      
      this.logger.log(`Available questions stats: total for type: ${totalAvailable}, for chapter: ${totalForChapter}`);

      // Build the where clause for Prisma
      const whereClause: any = {
        question_type_id: questionTypeId,
        question_topics: {
          some: {
            topic: {
              chapter_id: chapterId
            }
          }
        }
      };

      // Add medium IDs filter if provided and non-empty
      if (mediumIds && mediumIds.length > 0) {
        whereClause.question_texts = {
          some: {
            question_text_topics: {
              some: {
                instruction_medium_id: { in: mediumIds }
              }
            }
          }
        };
      }

      // Exclude already used questions
      if (usedQuestionIds && usedQuestionIds.size > 0) {
        whereClause.id = {
          notIn: Array.from(usedQuestionIds)
        };
      }

      this.logger.log(`Searching with where clause: ${JSON.stringify(whereClause, null, 2)}`);

      // Find all eligible questions
      const eligibleQuestions = await this.prisma.question.findMany({
        where: whereClause,
        include: {
          question_type: true,
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              },
              question_text_topics: {
                include: {
                  question_topic: {
                    include: {
                      topic: true
                    }
                  }
                }
              }
            }
          },
          question_topics: {
            include: {
              topic: true
            }
          }
        }
      });

      // If no questions found with all criteria, try a more relaxed search without medium filter
      if (!eligibleQuestions.length && mediumIds && mediumIds.length > 0) {
        this.logger.log(`No questions found with medium filter. Trying without medium filter.`);
        
        // Remove the medium filter from the where clause
        delete whereClause.question_texts;
        
        // Try again without medium filter
        const relaxedQuestions = await this.prisma.question.findMany({
          where: whereClause,
          include: {
            question_type: true,
            question_texts: {
              include: {
                image: true,
                mcq_options: {
                  include: {
                    image: true
                  }
                },
                match_pairs: {
                  include: {
                    left_image: true,
                    right_image: true
                  }
                },
                question_text_topics: {
                  include: {
                    question_topic: {
                      include: {
                        topic: true
                      }
                    }
                  }
                }
              }
            },
            question_topics: {
              include: {
                topic: true
              }
            }
          }
        });
        
        // Use relaxed results if available
        if (relaxedQuestions.length) {
          this.logger.log(`Found ${relaxedQuestions.length} questions without medium filter.`);
          eligibleQuestions.push(...relaxedQuestions);
        }
      }

      // If still no questions found, try a simple fallback search just by question type
      if (!eligibleQuestions.length) {
        this.logger.log(`No questions found for chapter. Trying fallback with just question type.`);
        
        // Simplified where clause with just question type
        const fallbackWhereClause = {
          question_type_id: questionTypeId
        };
        
        // Add used questions filter if available
        if (usedQuestionIds && usedQuestionIds.size > 0) {
          fallbackWhereClause['id'] = {
            notIn: Array.from(usedQuestionIds)
          };
        }
        
        // Try fallback search
        const fallbackQuestions = await this.prisma.question.findMany({
          where: fallbackWhereClause,
          take: 5, // Limit to 5 results
          include: {
            question_type: true,
            question_texts: {
              include: {
                image: true,
                mcq_options: {
                  include: {
                    image: true
                  }
                },
                match_pairs: {
                  include: {
                    left_image: true,
                    right_image: true
                  }
                },
                question_text_topics: {
                  include: {
                    question_topic: {
                      include: {
                        topic: true
                      }
                    }
                  }
                }
              }
            },
            question_topics: {
              include: {
                topic: true
              }
            }
          }
        });
        
        // Use fallback results if available
        if (fallbackQuestions.length) {
          this.logger.log(`Found ${fallbackQuestions.length} questions with fallback search.`);
          eligibleQuestions.push(...fallbackQuestions);
        }
      }

      // If no questions found at all, return null
      if (!eligibleQuestions.length) {
        this.logger.warn(`No questions found for chapter ${chapterId}, question type ${questionTypeId} with any search method.`);
        return null;
      }

      this.logger.log(`Found ${eligibleQuestions.length} eligible questions`);

      // Transform question data to include topic information and break circular references
      const processedQuestions = eligibleQuestions.map(q => {
        // Create a clean object instead of using JSON.stringify/parse to avoid serialization issues
        const processedQuestion = {
          id: q.id,
          question_type_id: q.question_type_id,
          board_question: q.board_question,
          question_type: q.question_type ? {
            id: q.question_type.id,
            type_name: q.question_type.type_name
          } : null,
          question_texts: []
        };
        
        // Process each question text to add topic information
        if (q.question_texts && q.question_texts.length > 0) {
          processedQuestion.question_texts = q.question_texts.map(text => {
            const processedText = {
              id: text.id,
              question_id: text.question_id,
              image_id: text.image_id,
              question_text: text.question_text,
              image: text.image,
              mcq_options: text.mcq_options || [],
              match_pairs: text.match_pairs || [],
              topic: null
            };
            
            // Try to get topic from question_text_topics
            if (text.question_text_topics && text.question_text_topics.length > 0) {
              const topicInfo = text.question_text_topics[0]?.question_topic?.topic;
              if (topicInfo) {
                processedText.topic = {
                  id: topicInfo.id,
                  name: topicInfo.name,
                  chapter_id: topicInfo.chapter_id
                };
              }
            } 
            // If no topic from question_text_topics, try from question_topics
            else if (q.question_topics && q.question_topics.length > 0) {
              const topicInfo = q.question_topics[0]?.topic;
              if (topicInfo) {
                processedText.topic = {
                  id: topicInfo.id,
                  name: topicInfo.name,
                  chapter_id: topicInfo.chapter_id
                };
              }
            }
            
            return processedText;
          });
        }
        
        return processedQuestion;
      });

      // Return a random question from the eligible ones
      const randomIndex = Math.floor(Math.random() * processedQuestions.length);
      const selectedQuestion = processedQuestions[randomIndex];
      this.logger.log(`Selected question ID: ${selectedQuestion.id}`);
      
      return selectedQuestion;
    } catch (error) {
      this.logger.error(`Error fetching random question: ${error.message}`, error.stack);
      return null;
    }
  }

  // Helper method to ensure a SubsectionAllocationDto has all required properties
  private ensureSubsectionProperties(subsection: any): any {
    if (!subsection.sequentialNumber && subsection.sequentialNumber !== 0) {
      subsection.sequentialNumber = 0; // Default value
    }
    return subsection;
  }

  // Helper method to ensure a SectionAllocationDto has all required properties
  private ensureSectionProperties(section: any): any {
    if (!section.sequentialNumber && section.sequentialNumber !== 0) {
      section.sequentialNumber = 0; // Default value
    }
    if (!section.subSection) {
      section.subSection = ''; // Default value
    }
    return section;
  }
} 