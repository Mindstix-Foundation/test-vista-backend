import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  ChapterMarksRequestDto, 
  ChapterMarksDistributionResponseDto, 
  SectionAllocationDto, 
  SubsectionAllocationDto, 
  AllocatedChapterDto, 
  ChapterMarksDto,
  FinalQuestionsDistributionBodyDto,
  ChangeQuestionRequestDto,
  ChangeQuestionResponseDto
} from './dto/chapter-marks-distribution.dto';
import { Pattern } from '@prisma/client';
import { AwsS3Service } from '../aws/aws-s3.service';

@Injectable()
export class ChapterMarksDistributionService {
  private readonly logger = new Logger(ChapterMarksDistributionService.name);

  constructor(
    private prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service
  ) {}

  // Helper method to transform image data with presigned URLs
  private async transformImageData(image) {
    if (!image) return null;
    
    // Check for either url or image_url field
    const imageUrl = image.url || image.image_url;
    
    // If no url found, return minimal image data
    if (!imageUrl) {
      this.logger.warn(`Image ${image.id} has no url or image_url`);
      return { id: image.id };
    }
    
    try {
      // Generate presigned URL with 1-hour expiration
      const presignedUrl = await this.awsS3Service.generatePresignedUrl(imageUrl, 3600);
      
      // Return only id and presigned_url
      return {
        id: image.id,
        presigned_url: presignedUrl
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for image ${image.id}:`, error);
      return { id: image.id };
    }
  }

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
    },
    questionOrigin?: 'board' | 'other' | 'both'
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
        // Construct the AND condition dynamically based on mediumIds
        const mediumConditions = mediumIds.map(mediumId => ({
          question_texts: {
            some: {
              question_text_topics: {
                some: {
                  instruction_medium_id: mediumId,
                  is_verified: true
                }
              }
            }
          }
        }));

        // Add board_question condition based on questionOrigin
        let boardQuestionCondition = {};
        if (questionOrigin === 'board') {
          boardQuestionCondition = { board_question: true };
        } else if (questionOrigin === 'other') {
          boardQuestionCondition = { board_question: false };
        }

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
            // Replace the previous filter with the AND condition
            AND: [...mediumConditions, boardQuestionCondition] 
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
        const newCount = Math.max(0, currentCount - 2);
        chapterQuestionTypes.set(selectedTypeId, newCount);

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
        continue;
      }
      
      // Check each question type in this section
      for (const sqt of section.subsection_question_types) {
        const questionTypeId = sqt.question_type_id;
        
        // Skip if no questions available for this type
        const availableCount = chapterQuestionTypes.get(questionTypeId) || 0;
        if (availableCount <= 0) {
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
      return selected;
    }
    
    // If all types have been used, find the least used ones
    const minUsage = Math.min(...availableTypes.map(type => type.usage));
    const leastUsedTypes = availableTypes.filter(type => type.usage === minUsage);
    
    // Randomly select from least used types
    const randomIndex = Math.floor(Math.random() * leastUsedTypes.length);
    const selected = leastUsedTypes[randomIndex];
    return selected;
  }

  // NEW HELPER FUNCTION to attempt allocating a specific mark value directly
  private async tryAllocateExactMarks(
    targetMarks: number,
    chapterId: number,
    pattern: any,
    sectionAllocations: SectionAllocationDto[],
    chapterQuestionTypes: Map<number, number>,
    usedQuestionTypes: Map<number, Set<number>>,
    questionTypeUsage: Map<number, number> // Added missing param
  ): Promise<boolean> {
    // Get all sections with exactly matching marks per question
    const exactMatchSections = pattern.sections
      .filter(section => section.marks_per_question === targetMarks)
      .sort((a, b) => {
        // Prioritize sections with fewer allocated questions relative to total
        const aAllocated = this.getSectionAllocatedQuestions(sectionAllocations, a.id);
        const bAllocated = this.getSectionAllocatedQuestions(sectionAllocations, b.id);
        const aRatio = a.total_questions > 0 ? aAllocated / a.total_questions : 1;
        const bRatio = b.total_questions > 0 ? bAllocated / b.total_questions : 1;
        return aRatio - bRatio;
      });

    // Try to allocate to each potential section
    for (const section of exactMatchSections) {
      const allocatedQuestions = this.getSectionAllocatedQuestions(sectionAllocations, section.id);
      if (allocatedQuestions >= section.total_questions) {
        continue; // Section is full
      }

      // Get available question types for this section and chapter
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
        continue; // No suitable type found
      }

      // Find the corresponding subsection
      const selectedSqt = section.subsection_question_types.find(
        sqt => sqt.question_type_id === selectedTypeId
      );
      if (!selectedSqt) {
        continue; // Should not happen if type was found, but safety check
      }

      const currentCount = chapterQuestionTypes.get(selectedTypeId) || 0;
      if (currentCount <= 0) {
        continue; // No questions of this type left for the chapter
      }

      // --- Allocation Logic Start --- (Copied and adapted from original fallback)
      let subsectionAllocation = sectionAllocations
        .find(sa => sa.sectionId === section.id)!
        .subsectionAllocations
        .find(sa => sa.subsectionQuestionTypeId === selectedSqt.id);

      if (!subsectionAllocation) {
        const newSubsection = this.ensureSubsectionProperties({
          subsectionQuestionTypeId: selectedSqt.id,
          section_id: section.id, // Added section_id
          questionTypeName: selectedSqt.question_type.type_name,
          sequentialNumber: selectedSqt.seqencial_subquestion_number, // Added seq number
          question_type_id: selectedSqt.question_type_id, // Added type id
          question_type: selectedSqt.question_type, // Added type object
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
      usedQuestionTypes.get(section.id)?.add(selectedTypeId); // Added null check
      questionTypeUsage.set(selectedTypeId, (questionTypeUsage.get(selectedTypeId) || 0) + 1); // Correct usage update

      // Decrement question count by 2
      const newCount = Math.max(0, currentCount - 2);
      chapterQuestionTypes.set(selectedTypeId, newCount);
      // --- Allocation Logic End --- 

      return true; // Allocation successful
    }

    return false; // No suitable section/type found for exact match
  }

  async distributeChapterMarks(filter: ChapterMarksRequestDto): Promise<ChapterMarksDistributionResponseDto> {
    const { patternId, chapterIds, mediumIds, requestedMarks, questionOrigin } = filter;

    if (!patternId || !chapterIds || !requestedMarks || chapterIds.length === 0 || requestedMarks.length === 0) {
      throw new BadRequestException('Missing required parameters');
    }

    this.logger.debug(`Processing chapter marks distribution with medium IDs: ${mediumIds.join(', ')}`);

    try {
      // Validate pattern exists
      const pattern = await this.prisma.pattern.findUnique({
        where: { id: patternId },
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
        throw new NotFoundException(`Pattern with ID ${patternId} not found`);
      }

      // Calculate total marks
      const totalMarks = pattern.sections.reduce((sum, section) => 
        sum + (section.marks_per_question * section.total_questions), 0);

      // Validate requested marks
      const totalRequestedMarks = requestedMarks.reduce((sum, marks) => sum + marks, 0);
      if (totalRequestedMarks !== totalMarks) {
        throw new BadRequestException(
          `Total requested marks (${totalRequestedMarks}) do not match pattern total marks (${totalMarks})`
        );
      }

      // Fetch medium details for response
      let mediumDetails: { id: number; instruction_medium: string }[] = [];
      if (mediumIds && mediumIds.length > 0) {
        try {
          mediumDetails = await this.prisma.instruction_Medium.findMany({
            where: { id: { in: mediumIds } },
            select: { id: true, instruction_medium: true },
          });
          // Log the medium details for debugging
          this.logger.debug(`Found medium details: ${JSON.stringify(mediumDetails)}`);
        } catch (error) {
          this.logger.warn(`Could not fetch medium details for IDs: ${mediumIds}`, error);
          // Continue without medium details if fetch fails
        }
      }

      // 4. Get chapter question type counts
      const chapterQuestionTypeMap = await this.getChapterQuestionTypeCounts(
        chapterIds,
        mediumIds,
        pattern,
        questionOrigin
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

      // 6. Initialize tracking variables
      const sectionAllocations: SectionAllocationDto[] = pattern.sections.map(section => {
        const sectionAlloc = this.ensureSectionProperties({
          sectionId: section.id,
          pattern_id: section.pattern_id,
          sectionName: section.section_name,
          sequentialNumber: section.sequence_number,
          section_number: section.section_number,
          subSection: section.sub_section,
          totalQuestions: section.total_questions,
          mandotory_questions: section.mandotory_questions,
          marks_per_question: section.marks_per_question,
          absoluteMarks: section.marks_per_question * section.total_questions,
          totalMarks: section.marks_per_question * section.mandotory_questions,
          subsectionAllocations: section.subsection_question_types.map(sqt => 
            this.ensureSubsectionProperties({
              subsectionQuestionTypeId: sqt.id,
              section_id: sqt.section_id,
              questionTypeName: sqt.question_type.type_name,
              sequentialNumber: sqt.seqencial_subquestion_number,
              question_type_id: sqt.question_type_id,
              question_type: {
                id: sqt.question_type.id,
                type_name: sqt.question_type.type_name
              },
              allocatedChapters: []
            })
          )
        });
        return sectionAlloc;
      });

      // 7. Get unique marks per question
      const uniqueMarks = [...new Set(pattern.sections.map(s => s.marks_per_question))].sort((a, b) => a - b);
      const highestMark = uniqueMarks.length > 0 ? uniqueMarks[uniqueMarks.length - 1] : 0; // Calculate highest mark

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

        // Randomly decide if we'll fill marks in ascending or descending order for this chapter
        const isAscendingMarkOrder = Math.random() < 0.5;

        // If we still have unallocated marks from previous chapters, try to add them to this chapter's request
        if (unallocatedMarks > 0) {
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
          }
          
          let currentMarkIndex = 0;

          // Try to allocate one question of each mark type in sequence
          while (currentMarkIndex < marksToTry.length) {
            const mark = marksToTry[currentMarkIndex];

            if (mark > remainingMarks) {
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
              currentMarkIndex++;
              continue;
            }

            // Select the best question type to use (prioritizing unused types)
            const selectedType = this.selectBestQuestionType(availableQuestionTypes);
            
            if (!selectedType) {
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
              currentMarkIndex++;
                continue;
              }

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

              // *** NEW CHECK START ***
              if (remainingMarks > 0 && remainingMarks <= highestMark) {
                const exactMatchSuccess = await this.tryAllocateExactMarks(
                  remainingMarks, // Target the remaining marks
                  chapterId,
                  pattern,
                  sectionAllocations,
                  chapterQuestionTypes,
                  usedQuestionTypes,
                  questionTypeUsage
                );
                if (exactMatchSuccess) {
                  remainingMarks = 0; // Chapter is done, mark as complete
                }
                // If exactMatchSuccess is false, do nothing special, 
                // let the loop continue or finish normally
              }
              // *** NEW CHECK END ***

            currentMarkIndex++;
        }

        // If we couldn't allocate any marks in this iteration, try to handle remaining marks
        if (!marksAllocatedInIteration && remainingMarks > 0) {
          
          // Try to allocate sections that exactly match the remaining marks first (using the new helper)
          let exactMatchAllocated = await this.tryAllocateExactMarks(
            remainingMarks,
            chapterId,
            pattern,
            sectionAllocations,
            chapterQuestionTypes,
            usedQuestionTypes,
            questionTypeUsage
          );

          if (exactMatchAllocated) {
            remainingMarks = 0; // Mark as done if exact match found here
          }
          
          // Skip the old direct allocation and go to the replacement logic if we couldn't do exact match
          if (!exactMatchAllocated && remainingMarks > 0) {
            // Try to replace existing allocations
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
                  break;
                }
              }
              if (remainingMarks === 0) break;
            }
          }

          if (remainingMarks > 0) {
            // If still marks remain after all fallbacks, break the loop for this chapter
            break;
          }
        }
      }

      // If we still have unallocated marks after all attempts, store them for redistribution
      if (remainingMarks > 0) {
        unallocatedMarks += remainingMarks;
        remainingMarks = 0;
      }
    }

    // Handle any remaining unallocated marks after processing all chapters
    if (unallocatedMarks > 0) {
      
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
              // Remove this type from the available types
              availableQuestionTypes = availableQuestionTypes.filter(t => 
                !(t.sectionId === selectedType.sectionId && t.questionTypeId === questionTypeId)
              );
              continue;
            }
            
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
            
            // Update marks (Only track unallocatedMarks now)
            unallocatedMarks -= markValue;
            
            // Update the question count for this type directly in the existing map (Decrement by 2, changed from 3)
            const newCount = Math.max(0, currentCount - 2);
            chapterTypes.set(questionTypeId, newCount);
            
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
        this.logger.warn(`Unable to allocate ${unallocatedMarks} marks due to insufficient questions.`);
      }
    }

    // 10. Prepare final response

    // Recalculate actual allocated marks from the final sectionAllocations
    const finalChapterMarksMap = new Map<number, number>();
    sectionAllocations.forEach(section => {
      section.subsectionAllocations.forEach(subsection => {
        subsection.allocatedChapters.forEach(allocatedChapter => {
          const chapterId = allocatedChapter.chapterId;
          const marksPerQuestion = section.marks_per_question;
          finalChapterMarksMap.set(chapterId, (finalChapterMarksMap.get(chapterId) || 0) + marksPerQuestion);
        });
      });
    });

    const chapterMarks: ChapterMarksDto[] = [];
    for (const chapterId of filter.chapterIds) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId }
      });
      if (!chapter) continue;

      // Find the originally requested marks for this chapter
      const chapterIndex = filter.chapterIds.indexOf(chapterId);
      const requestedMark = chapterIndex !== -1 ? filter.requestedMarks[chapterIndex] : 0;

      chapterMarks.push({
        chapterId,
        chapterName: chapter.name,
        absoluteMarks: finalChapterMarksMap.get(chapterId) || 0, // Use the recalculated map
        requestedMarks: requestedMark
      });
    }

    // Create response with allocation issue information
    const response: ChapterMarksDistributionResponseDto = {
      patternId,
      patternName: pattern.pattern_name,
      totalMarks,
      absoluteMarks: totalMarks,
      questionOrigin: questionOrigin, // Add questionOrigin to response
      mediums: mediumDetails,
      sectionAllocations: sectionAllocations.map(section => {
        // Apply the section helper
        this.ensureSectionProperties(section);
        
        // Apply the subsection helper to all subsections
        section.subsectionAllocations = section.subsectionAllocations.map(subsection => {
          // Randomize the allocated chapters order
          if (subsection.allocatedChapters && subsection.allocatedChapters.length > 1) {
            subsection.allocatedChapters = this.generateRandomSequence(subsection.allocatedChapters);
          }
          return this.ensureSubsectionProperties(subsection);
        });
        
        return section;
      }),
      chapterMarks
    };
    
    // Add allocation issue information if there were unallocated marks
    if (unallocatedMarks > 0) {
      // Return only the error message without any other data
      return {
        insufficientQuestions: true,
        allocationMessage: `Unable to allocate ${unallocatedMarks} marks due to insufficient questions. Consider reducing the requested marks or adding more questions.`
      } as ChapterMarksDistributionResponseDto;
    }
    
    return response;
  } catch (error) {
    this.logger.error(`Error in distributeChapterMarks: ${error.message}`, error.stack);
    throw error;
  }
}

  // Utility method to remove all image_url properties from an object hierarchy
  private removeImageUrlProperties(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    // If array, process each element
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeImageUrlProperties(item));
    }
    
    // For objects, create a new object without image_url properties
    const result = {};
    for (const key in obj) {
      // Skip image_url and similar properties
      if (key === 'image_url' || key === 'left_image_url' || key === 'right_image_url') {
        continue;
      }
      
      // Recursively process nested objects
      result[key] = this.removeImageUrlProperties(obj[key]);
    }
    
    return result;
  }

  // Helper method to clean the response data
  private cleanResponseData(responseDto: ChapterMarksDistributionResponseDto): ChapterMarksDistributionResponseDto {
    // Make a deep clone to avoid modifying the original
    const cleanedResponse = { ...responseDto };
    
    // Preserve allocation issue information
    if (responseDto.insufficientQuestions) {
      cleanedResponse.insufficientQuestions = responseDto.insufficientQuestions;
    }
    if (responseDto.allocationMessage) {
      cleanedResponse.allocationMessage = responseDto.allocationMessage;
    }
    
    // Process each section allocation
    if (cleanedResponse.sectionAllocations) {
      cleanedResponse.sectionAllocations = cleanedResponse.sectionAllocations.map(section => {
        const cleanedSection = { ...section };
        
        // Process each subsection
        if (cleanedSection.subsectionAllocations) {
          cleanedSection.subsectionAllocations = cleanedSection.subsectionAllocations.map(subsection => {
            const cleanedSubsection = { ...subsection };
            
            // Process each allocated chapter
            if (cleanedSubsection.allocatedChapters) {
              cleanedSubsection.allocatedChapters = cleanedSubsection.allocatedChapters.map(chapter => {
                const cleanedChapter = { ...chapter };
                
                // Process question if exists
                if (cleanedChapter.question) {
                  // Remove board_question, created_at, updated_at
                  const { board_question, created_at, updated_at, ...questionData } = cleanedChapter.question;
                  cleanedChapter.question = questionData;
                  
                  // Process question_texts if exists
                  if (cleanedChapter.question.question_texts) {
                    cleanedChapter.question.question_texts = cleanedChapter.question.question_texts.map(text => {
                      const { created_at, updated_at, image_url, ...textData } = text;
                      
                      // Process image to only include id and presigned_url
                      if (textData.image) {
                        const presignedUrl = textData.image.presigned_url || textData.image.image_url;
                        textData.image = {
                          id: textData.image.id,
                          presigned_url: presignedUrl
                        };
                        // Don't include image_url at all
                      }
                      
                      // Process mcq_options and their images
                      if (textData.mcq_options) {
                        textData.mcq_options = textData.mcq_options.map(option => {
                          const { created_at, updated_at, image_url, ...optionData } = option;
                          
                          if (optionData.image) {
                            const presignedUrl = optionData.image.presigned_url || optionData.image.image_url;
                            optionData.image = {
                              id: optionData.image.id,
                              presigned_url: presignedUrl
                            };
                            // Don't include image_url at all
                          }
                          
                          return optionData;
                        });
                      }
                      
                      // Process match_pairs and their images
                      if (textData.match_pairs) {
                        textData.match_pairs = textData.match_pairs.map(pair => {
                          const { 
                            created_at, 
                            updated_at, 
                            left_image_url, 
                            right_image_url, 
                            ...pairData 
                          } = pair;
                          
                          if (pairData.left_image) {
                            const presignedUrl = pairData.left_image.presigned_url || pairData.left_image.image_url;
                            pairData.left_image = {
                              id: pairData.left_image.id,
                              presigned_url: presignedUrl
                            };
                            // Don't include left_image_url at all
                          }
                          
                          if (pairData.right_image) {
                            const presignedUrl = pairData.right_image.presigned_url || pairData.right_image.image_url;
                            pairData.right_image = {
                              id: pairData.right_image.id,
                              presigned_url: presignedUrl
                            };
                            // Don't include right_image_url at all
                          }
                          
                          return pairData;
                        });
                      }
                      
                      // Keep only simplified question_text_topics
                      if (textData.question_text_topics) {
                        textData.question_text_topics = textData.question_text_topics.map(topic => {
                          const { id, question_text_id, question_topic_id, instruction_medium_id } = topic;
                          return { id, question_text_id, question_topic_id, instruction_medium_id };
                        });
                      }
                      
                      return textData;
                    });
                  }
                  
                  // Remove question_topics completely if exists
                  if (cleanedChapter.question.question_topics) {
                    delete cleanedChapter.question.question_topics;
                  }
                }
                
                return cleanedChapter;
              });
            }
            
            return cleanedSubsection;
          });
        }
        
        return cleanedSection;
      });
    }
    
    // As a final step, do a deep scan to remove any remaining image_url properties
    return this.removeImageUrlProperties(cleanedResponse);
  }

  // Filter question texts to include ONLY texts with the requested medium IDs
  private filterQuestionTextsByMedium(
    responseDto: ChapterMarksDistributionResponseDto,
    mediumIds: number[]
  ): void {
    // Only process if medium IDs are provided
    if (!mediumIds || mediumIds.length === 0) return;
    
    this.logger.debug(`Filtering question texts for medium IDs: [${mediumIds.join(', ')}]`);
    
    for (const section of responseDto.sectionAllocations) {
      for (const subsection of section.subsectionAllocations) {
        for (const chapter of subsection.allocatedChapters) {
          if (chapter.question && chapter.question.question_texts) {
            // Filter question texts to only include those matching the requested mediums
            const filteredTexts = chapter.question.question_texts.filter(text => {
              // Check if any of the question_text_topics match any of the requested medium IDs
              return text.question_text_topics?.some(topic => 
                mediumIds.includes(topic.instruction_medium_id)
              );
            });
            
            // Sort texts by matching the order of mediumIds (first medium first, etc.)
            filteredTexts.sort((a, b) => {
              // Find the first medium ID that matches text A
              const mediumIndexA = a.question_text_topics ? 
                mediumIds.findIndex(id => 
                  a.question_text_topics.some(topic => topic.instruction_medium_id === id)
                ) : -1;
              
              // Find the first medium ID that matches text B
              const mediumIndexB = b.question_text_topics ? 
                mediumIds.findIndex(id => 
                  b.question_text_topics.some(topic => topic.instruction_medium_id === id)
                ) : -1;
              
              // Sort by medium index (lower index first)
              return mediumIndexA - mediumIndexB;
            });
            
            // Replace the original texts with the filtered ones
            chapter.question.question_texts = filteredTexts;
            
            // Log the result for debugging
            this.logger.debug(
              `Filtered question ${chapter.question.id} texts: original=${chapter.question.question_texts.length}, ` + 
              `filtered=${filteredTexts.length}, mediums=[${filteredTexts.map(
                t => t.question_text_topics?.[0]?.instruction_medium_id
              ).join(', ')}]`
            );
          }
        }
      }
    }
  }

  // Add this method before the processFinalQuestionsDistribution method
  private async validateAvailableQuestions(
    allocationMap: Map<string, any[]>,
    chapterQuestionTypePairs: Array<{ chapterId: number, questionTypeId: number }>,
    mediumIds: number[] = [],
    questionOrigin?: 'board' | 'other' | 'both'
  ): Promise<void> {
    if (mediumIds.length === 0) {
      return; // No medium IDs to validate
    }
    
    this.logger.debug(`Validating available questions for medium IDs: [${mediumIds.join(', ')}]`);
    
    // Build allocation needs map - how many questions we need for each combination
    const allocationNeeds = new Map<string, number>();
    allocationMap.forEach((allocations, key) => {
      allocationNeeds.set(key, allocations.length);
    });
    
    // Validate each chapter-questionType pair has enough questions in each medium
    for (const { chapterId, questionTypeId } of chapterQuestionTypePairs) {
      const key = `${chapterId}-${questionTypeId}`;
      const neededCount = allocationNeeds.get(key) || 0;
      
      if (neededCount === 0) continue;
      
      // Check for questions that have text in ALL required mediums
      const mediumConditions = mediumIds.map(mediumId => ({
        question_texts: {
          some: {
            question_text_topics: {
              some: {
                instruction_medium_id: mediumId,
                is_verified: true
              }
            }
          }
        }
      }));
      
      const whereClause: any = {
        question_type_id: questionTypeId,
        question_topics: {
          some: {
            topic: {
              chapter_id: chapterId
            }
          }
        },
        AND: mediumConditions
      };
      
      // Add board_question condition if questionOrigin specified
      if (questionOrigin === 'board') {
        whereClause.board_question = true;
      } else if (questionOrigin === 'other') {
        whereClause.board_question = false;
      }
      
      const count = await this.prisma.question.count({
        where: whereClause
      });
      
      this.logger.debug(`Chapter ${chapterId}, Type ${questionTypeId}: Found ${count} questions matching all mediums [${mediumIds.join(', ')}], need ${neededCount}`);
      
      if (count < neededCount) {
        throw new BadRequestException(
          `Insufficient unique questions available for chapter ${chapterId}, type ${questionTypeId} matching all required mediums (${mediumIds.join(', ')}). Found ${count}, needed ${neededCount}.`
        );
      }
    }
  }

  async processFinalQuestionsDistribution(requestBody: FinalQuestionsDistributionBodyDto): Promise<ChapterMarksDistributionResponseDto> {
    // Extract mediumIds correctly, either from mediumIds field or from mediums array
    let mediumIds: number[] = [];
    if (requestBody.mediumIds && requestBody.mediumIds.length > 0) {
      mediumIds = requestBody.mediumIds;
    } else if (requestBody.mediums && requestBody.mediums.length > 0) {
      mediumIds = requestBody.mediums.map(medium => medium.id).filter(id => id !== undefined);
    }

    this.logger.debug(`Processing final questions distribution with medium IDs: ${mediumIds.join(', ')}`);
    const usedQuestionIds = new Set<number>();

    try {
      // --- Fetch Medium Details Early ---
      let mediumDetails: { id: number; instruction_medium: string }[] = [];
      if (mediumIds && mediumIds.length > 0) {
        try {
          mediumDetails = await this.prisma.instruction_Medium.findMany({
            where: { id: { in: mediumIds } },
            select: { id: true, instruction_medium: true },
          });
          
          // Ensure the order matches the input mediumIds array
          const orderMap = new Map(mediumIds.map((id, index) => [id, index]));
          mediumDetails.sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity));
          
          // Log the medium details for debugging
          this.logger.debug(`Found medium details: ${JSON.stringify(mediumDetails)}`);
        } catch (error) {
          this.logger.warn(`Could not fetch medium details for IDs: ${mediumIds}`, error);
          // Continue without medium details if fetch fails, but filtering might be affected
        }
      }
      // --- End Fetch Medium Details ---

      // Create new response DTO using data from request
      const responseDto = new ChapterMarksDistributionResponseDto();
      responseDto.patternId = requestBody.patternId;
      responseDto.patternName = requestBody.patternName;
      responseDto.totalMarks = requestBody.totalMarks;
      responseDto.absoluteMarks = requestBody.absoluteMarks;
      responseDto.questionOrigin = requestBody.questionOrigin; // Add questionOrigin to response
      responseDto.mediums = mediumDetails; // Add mediums to response DTO
      responseDto.sectionAllocations = [];
      responseDto.chapterMarks = requestBody.chapterMarks.map(chapter => {
        const chapterMark = new ChapterMarksDto();
        chapterMark.chapterId = chapter.chapterId;
        chapterMark.chapterName = chapter.chapterName;
        chapterMark.absoluteMarks = chapter.absoluteMarks;
        return chapterMark;
      });

      // Collect all chapter-questionType pairs that need questions
      const chapterQuestionTypePairs = [];
      const allocationMap = new Map();
      
      // First pass: collect all required chapter-questionType pairs and build allocation map
      for (const section of requestBody.sectionAllocations) {
        for (const subsection of section.subsectionAllocations) {
          for (const allocatedChapter of subsection.allocatedChapters) {
            // No need to check if question exists - we know it doesn't
            const chapterId = allocatedChapter.chapterId;
            const questionTypeId = subsection.question_type_id;
            const key = `${chapterId}-${questionTypeId}`;
            
            // Create an entry in the allocation map to track all places where 
            // this chapter-questionType combination is needed
            if (!allocationMap.has(key)) {
              allocationMap.set(key, []);
              // Only add to pairs for fetching if we haven't seen this combination before
              chapterQuestionTypePairs.push({ chapterId, questionTypeId });
            }
            
            // Record this allocation position for later assignment
            allocationMap.get(key).push({
              sectionIndex: responseDto.sectionAllocations.length,
              subsectionId: subsection.subsectionQuestionTypeId,
              allocationIndex: allocationMap.get(key).length
            });
          }
        }
        
        // Add section to response as we go to maintain the order
        responseDto.sectionAllocations.push(this.mapSectionAllocation(section));
      }
      
      // Validate that we have enough questions for all required pairs that match ALL requested mediums
      try {
        await this.validateAvailableQuestions(allocationMap, chapterQuestionTypePairs, mediumIds, requestBody.questionOrigin);
      } catch (error) {
        if (error instanceof BadRequestException && error.message.includes("Insufficient unique questions available")) {
          this.logger.warn(`Validation failed due to insufficient questions: ${error.message}`);
          
          // Return only the error message without any other data
          return {
            insufficientQuestions: true,
            allocationMessage: error.message
          } as ChapterMarksDistributionResponseDto;
        }
        // If it's not the specific error we're handling, rethrow it
        throw error;
      }
      
      // --- Add Log Before Call --- 
      this.logger.debug(
        `[processFinalQuestionsDistribution] Calling bulkFetchQuestions with mediumIds: [${mediumIds?.join(', ') ?? 'undefined/null'}]`
      );
      // --- End Log ---

      // Bulk fetch questions for all chapter-questionType pairs (only IDs and minimal data)
      const questionsMap = await this.bulkFetchQuestions(
        chapterQuestionTypePairs, 
        mediumIds,
        usedQuestionIds,
        requestBody.questionOrigin
      );
      
      // Track selected question IDs for detailed fetch
      const selectedQuestionIds = new Set<number>();
      
      // Assign fetched questions to their allocation positions
      for (const [key, allocations] of allocationMap.entries()) {
        const [chapterId, questionTypeId] = key.split('-').map(Number);
        const questions = questionsMap.get(key) || [];
        
        // Track used question IDs for this chapter-questionType combination
        const usedIds = new Set<number>();
        
        for (const allocation of allocations) {
          const { sectionIndex, subsectionId, allocationIndex } = allocation;
          
          // Find the subsection in the response
          const section = responseDto.sectionAllocations[sectionIndex];
          const subsection = section.subsectionAllocations.find(
            sub => sub.subsectionQuestionTypeId === subsectionId
          );
          
          if (!subsection) continue;
          
          // Find a question that hasn't been used yet
          const availableQuestions = questions.filter(q => !usedIds.has(q.id));
          
          if (availableQuestions.length > 0) {
            // Get a random question from available ones
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            const questionMin = availableQuestions[randomIndex];
            
            // Add the question to the allocation
            const chapterAllocation = new AllocatedChapterDto();
            chapterAllocation.chapterId = chapterId;
            
            // Find the original chapter name from request
            const originalChapter = requestBody.sectionAllocations[sectionIndex]
              .subsectionAllocations.find(sub => sub.subsectionQuestionTypeId === subsectionId)
              ?.allocatedChapters.find(ch => ch.chapterId === chapterId);
              
            chapterAllocation.chapterName = originalChapter ? originalChapter.chapterName : `Chapter ${chapterId}`;
            
            // Initially set with minimal question data
            chapterAllocation.question = questionMin;
            
            // Track this question ID for detailed fetch
            selectedQuestionIds.add(questionMin.id);
            
            // Track used IDs
            usedIds.add(questionMin.id);
            usedQuestionIds.add(questionMin.id);
            
            // Add to response
            subsection.allocatedChapters.push(chapterAllocation);
          } else {
            this.logger.error(
              `Internal inconsistency: Not enough questions for chapter ${chapterId}, type ${questionTypeId} despite passing validation check.`
            );
            
            // Return only the error message without any other data
            return {
              insufficientQuestions: true,
              allocationMessage: `Insufficient unique questions available for chapter ${chapterId}, type ${questionTypeId}. This is likely due to questions being used by other sections.`
            } as ChapterMarksDistributionResponseDto;
          }
        }
      }
      
      // OPTIMIZATION: Now fetch complete data only for selected questions
      if (selectedQuestionIds.size > 0) {
        const detailedQuestionsMap = await this.fetchDetailedQuestions(Array.from(selectedQuestionIds));
        
        // Replace minimal question data with detailed data
        this.updateQuestionsWithDetailedData(responseDto, detailedQuestionsMap);

        // Filter question texts based on requested mediums only if mediums are specified
        if (mediumIds.length > 0) {
          this.filterQuestionTextsByMedium(responseDto, mediumIds);
        }
        
        // Process all images in the questions to add presigned URLs
        await this.processQuestionsInResponse(responseDto);
      }
      
      // Clean up the response data
      const cleanedResponseDto = this.cleanResponseData(responseDto);
      
      return cleanedResponseDto;
    } catch (error) {
      this.logger.error(`Error in processFinalQuestionsDistribution: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  // New method to fetch detailed question data
  private async fetchDetailedQuestions(questionIds: number[]): Promise<Map<number, any>> {
    const questionsMap = new Map<number, any>();
    
    if (questionIds.length === 0) {
      return questionsMap;
    }
    
    try {
      const detailedQuestions = await this.prisma.question.findMany({
        where: {
          id: {
            in: questionIds
          }
        },
        select: {
          id: true,
          question_type_id: true,
          question_type: {
            select: {
              id: true,
              type_name: true
            }
          },
          question_texts: {
            select: {
              id: true,
              question_id: true,
              question_text: true,
              image_id: true,
              image: {
                select: {
                  id: true,
                  image_url: true  // Needed to generate presigned URL
                }
              },
              mcq_options: {
                select: {
                  id: true,
                  question_text_id: true,
                  option_text: true,
                  is_correct: true,
                  image_id: true,
                  image: {
                    select: {
                      id: true,
                      image_url: true  // Needed to generate presigned URL
                    }
                  }
                }
              },
              match_pairs: {
                select: {
                  id: true,
                  question_text_id: true,
                  left_text: true,
                  right_text: true,
                  left_image_id: true,
                  right_image_id: true,
                  left_image: {
                    select: {
                      id: true,
                      image_url: true  // Needed to generate presigned URL
                    }
                  },
                  right_image: {
                    select: {
                      id: true,
                      image_url: true  // Needed to generate presigned URL
                    }
                  }
                }
              },
              question_text_topics: {
                select: {
                  id: true,
                  question_text_id: true,
                  question_topic_id: true,
                  instruction_medium_id: true,
                  is_verified: true // Include verification status
                }
              }
            }
          }
        }
      });
      
      // Map questions by ID for easy lookup
      for (const question of detailedQuestions) {
        questionsMap.set(question.id, question);
      }
      
      return questionsMap;
    } catch (error) {
      this.logger.error(`Error in fetchDetailedQuestions: ${error.message}`, error.stack);
      return questionsMap;
    }
  }
  
  // New method to update questions with detailed data
  private updateQuestionsWithDetailedData(
    responseDto: ChapterMarksDistributionResponseDto,
    detailedQuestionsMap: Map<number, any>
  ): void {
    for (const section of responseDto.sectionAllocations) {
      for (const subsection of section.subsectionAllocations) {
        for (let i = 0; i < subsection.allocatedChapters.length; i++) {
          const chapter = subsection.allocatedChapters[i];
          if (chapter.question && chapter.question.id) {
            const detailedQuestion = detailedQuestionsMap.get(chapter.question.id);
            if (detailedQuestion) {
              subsection.allocatedChapters[i].question = detailedQuestion;
            }
          }
        }
      }
    }
  }

  // Helper method to map section data from request to response
  private mapSectionAllocation(section: any): SectionAllocationDto {
    const sectionAllocation = new SectionAllocationDto();
    sectionAllocation.sectionId = section.sectionId;
    sectionAllocation.pattern_id = section.pattern_id;
    sectionAllocation.sectionName = section.sectionName;
    sectionAllocation.sequentialNumber = section.sequentialNumber;
    sectionAllocation.section_number = section.section_number;
    sectionAllocation.subSection = section.subSection;
    sectionAllocation.totalQuestions = section.totalQuestions;
    sectionAllocation.mandotory_questions = section.mandotory_questions;
    sectionAllocation.marks_per_question = section.marks_per_question;
    sectionAllocation.absoluteMarks = section.absoluteMarks;
    sectionAllocation.totalMarks = section.totalMarks;
    sectionAllocation.subsectionAllocations = section.subsectionAllocations.map(subsection => {
      const subsectionAllocation = new SubsectionAllocationDto();
      subsectionAllocation.subsectionQuestionTypeId = subsection.subsectionQuestionTypeId;
      subsectionAllocation.section_id = section.sectionId;
      subsectionAllocation.questionTypeName = subsection.questionTypeName;
      subsectionAllocation.sequentialNumber = subsection.sequentialNumber;
      subsectionAllocation.question_type_id = subsection.question_type_id;
      subsectionAllocation.question_type = subsection.question_type;
      subsectionAllocation.allocatedChapters = [];
      
      // We don't need to check for existing questions in the request
      // as all questions will be newly fetched
      
      return subsectionAllocation;
    });
    
    return sectionAllocation;
  }
  
  // Renamed from processExistingQuestionsInResponse to reflect its true purpose
  private async processQuestionsInResponse(responseDto: ChapterMarksDistributionResponseDto): Promise<void> {
    for (const section of responseDto.sectionAllocations) {
      for (const subsection of section.subsectionAllocations) {
        for (let i = 0; i < subsection.allocatedChapters.length; i++) {
          const chapter = subsection.allocatedChapters[i];
          if (chapter.question) {
            subsection.allocatedChapters[i].question = await this.processExistingQuestion(chapter.question);
          }
        }
      }
    }
  }
  
  // Bulk fetch questions for multiple chapter-questionType pairs
  private async bulkFetchQuestions(
    chapterQuestionTypePairs: Array<{ chapterId: number, questionTypeId: number }>,
    mediumIds: number[] = [],
    usedQuestionIds: Set<number> = new Set(),
    questionOrigin?: 'board' | 'other' | 'both'
  ): Promise<Map<string, any[]>> {
    // Create a map to store results
    const questionsMap = new Map<string, any[]>();
    
    // No pairs to fetch
    if (chapterQuestionTypePairs.length === 0) {
      return questionsMap;
    }
    
    try {
      // Group by question type to minimize queries
      const questionTypeGroups = new Map<number, number[]>();
      
      for (const pair of chapterQuestionTypePairs) {
        if (!questionTypeGroups.has(pair.questionTypeId)) {
          questionTypeGroups.set(pair.questionTypeId, []);
        }
        questionTypeGroups.get(pair.questionTypeId).push(pair.chapterId);
      }
      
      // For each question type, fetch questions for all its chapters
      for (const [questionTypeId, chapterIds] of questionTypeGroups.entries()) {
        // Build the where clause for Prisma
        const whereClause: any = {
          question_type_id: questionTypeId,
          question_topics: {
            some: {
              topic: {
                chapter_id: { in: chapterIds }
              }
            }
          }
        };
        
        // Add board_question condition based on questionOrigin
        if (questionOrigin === 'board') {
          whereClause.board_question = true;
        } else if (questionOrigin === 'other') {
          whereClause.board_question = false;
        }
        
        // Add medium IDs filter if provided - create a condition for EACH medium
        if (mediumIds && mediumIds.length > 0) {
          // Create a condition for each medium ID that requires questions to have texts
          // in THAT specific medium
          const mediumConditions = mediumIds.map(mediumId => ({
            question_texts: {
              some: {
                question_text_topics: {
                  some: {
                    instruction_medium_id: mediumId,
                    is_verified: true
                  }
                }
              }
            }
          }));
          
          // Add AND array with all medium conditions to ensure questions match ALL mediums
          whereClause.AND = mediumConditions;
        }
        
        // Exclude already used questions
        if (usedQuestionIds.size > 0) {
          whereClause.id = {
            notIn: Array.from(usedQuestionIds)
          };
        }
        
        // OPTIMIZATION: First fetch only IDs and minimal data
        const minimumQuestions = await this.prisma.question.findMany({
          where: whereClause,
          select: {
            id: true,
            question_type_id: true,
            question_topics: {
              select: {
                topic_id: true,
                topic: {
                  select: {
                    chapter_id: true
                  }
                }
              }
            }
          }
        });
        
        // --- Added Logging --- 
        this.logger.debug(
          `[bulkFetchQuestions] Query for TypeID: ${questionTypeId}, Chapters: [${chapterIds.join(', ')}], Mediums: [${mediumIds.join(', ')}] ` +
          `returned ${minimumQuestions.length} question IDs: [${minimumQuestions.map(q => q.id).join(', ')}] ` +
          `using whereClause: ${JSON.stringify(whereClause, null, 2)}` // Log the where clause for detailed inspection
        );
        // --- End Logging ---

        // Filter out questions already used
        const availableQuestions = minimumQuestions.filter(q => !usedQuestionIds.has(q.id));
        
        // Organize minimum questions by chapter
        for (const question of availableQuestions) { // Use filtered list
          // Find which chapter(s) this question belongs to
          const questionChapterIds = question.question_topics
            .map(qt => qt.topic?.chapter_id)
            .filter(id => id !== undefined && chapterIds.includes(id));
          
          // Add question to each relevant chapter-questionType pair
          for (const chapterId of questionChapterIds) {
            const key = `${chapterId}-${questionTypeId}`;
            
            if (!questionsMap.has(key)) {
              questionsMap.set(key, []);
            }
            
            questionsMap.get(key).push({
              id: question.id,
              question_type_id: question.question_type_id
            });
          }
        }
      }
      
      // If some chapter-questionType pairs have no questions, try without medium filter
      if (mediumIds && mediumIds.length > 0) {
        // Check which pairs have no questions
        const emptyPairs = chapterQuestionTypePairs.filter(pair => {
          const key = `${pair.chapterId}-${pair.questionTypeId}`;
          // Check if the key exists and has questions AFTER filtering used IDs
          return !questionsMap.has(key) || questionsMap.get(key).length === 0;
        });

        if (emptyPairs.length > 0) {
          this.logger.warn(`No questions found for some chapter-type pairs with all specified mediums ${mediumIds}. Checking with individual mediums.`);
          
          // First try with each medium individually
          for (const mediumId of mediumIds) {
            const individualMediumMap = await this.bulkFetchQuestions(emptyPairs, [mediumId], usedQuestionIds, questionOrigin);
            
            // Merge results, giving priority to the original results if they exist
            for (const [key, questions] of individualMediumMap.entries()) {
              if (!questionsMap.has(key) || questionsMap.get(key).length === 0) {
                questionsMap.set(key, questions);
                this.logger.debug(`Using questions with medium ${mediumId} only for ${key}`);
              }
            }
          }
          
          // Check if there are still empty pairs after trying individual mediums
          const stillEmptyPairs = chapterQuestionTypePairs.filter(pair => {
            const key = `${pair.chapterId}-${pair.questionTypeId}`;
            return !questionsMap.has(key) || questionsMap.get(key).length === 0;
          });
          
          // As a last resort, try without any medium filter for the remaining empty pairs
          if (stillEmptyPairs.length > 0) {
            this.logger.warn(`Still no questions found with any medium for some pairs. Trying without medium filter as last resort.`);
            const noMediumMap = await this.bulkFetchQuestions(stillEmptyPairs, [], usedQuestionIds, questionOrigin);
            
            // Merge results from no-medium query
            for (const [key, questions] of noMediumMap.entries()) {
              if (!questionsMap.has(key) || questionsMap.get(key).length === 0) {
                questionsMap.set(key, questions);
                this.logger.debug(`Using questions with no medium constraint for ${key}`);
              }
            }
          }
        }
      }
      
      return questionsMap;
    } catch (error) {
      this.logger.error(`Error in bulkFetchQuestions: ${error.message}`, error.stack);
      return questionsMap;
    }
  }

  // Helper method to process an existing question (add presigned URLs to images)
  private async processExistingQuestion(question: any): Promise<any> {
    if (!question) return null;
    
    // Clone to avoid mutation
    const processedQuestion = { ...question };
    
    // Process question texts and their images
    if (processedQuestion.question_texts && processedQuestion.question_texts.length > 0) {
      processedQuestion.question_texts = await Promise.all(processedQuestion.question_texts.map(async (text) => {
        if (!text) return null;
        
        // Clone text to avoid mutation and remove image_url if present
        const { image_url, ...textResult } = { ...text };
        
        // Process main image
        if (textResult.image && textResult.image.image_url) { // Check if image_url exists
          try {
            const presignedUrl = await this.awsS3Service.generatePresignedUrl(textResult.image.image_url, 3600);
            textResult.image = {
              id: textResult.image.id,
              presigned_url: presignedUrl
            };
          } catch (error) {
             this.logger.error(`Failed to generate presigned URL for image ${textResult.image.id}:`, error);
             // Keep minimal image data if URL generation fails
             textResult.image = { id: textResult.image.id };
          }
        } else if (textResult.image) {
             // If image exists but has no URL, keep minimal data
             textResult.image = { id: textResult.image.id };
        }
        
        // Process MCQ option images
        if (textResult.mcq_options && textResult.mcq_options.length > 0) {
          textResult.mcq_options = await Promise.all(textResult.mcq_options.map(async (option) => {
            if (!option) return null;
            
            // Remove image_url if present
            const { image_url, ...optionResult } = { ...option };
            
            if (optionResult.image && optionResult.image.image_url) { // Check if image_url exists
              try {
                const presignedUrl = await this.awsS3Service.generatePresignedUrl(optionResult.image.image_url, 3600);
                optionResult.image = {
                  id: optionResult.image.id,
                  presigned_url: presignedUrl
                };
              } catch (error) {
                this.logger.error(`Failed to generate presigned URL for MCQ option image ${optionResult.image.id}:`, error);
                optionResult.image = { id: optionResult.image.id };
              }
            } else if (optionResult.image) {
              optionResult.image = { id: optionResult.image.id };
            }
            return optionResult;
          }));
        }
        
        // Process match pair images
        if (textResult.match_pairs && textResult.match_pairs.length > 0) {
          textResult.match_pairs = await Promise.all(textResult.match_pairs.map(async (pair) => {
            if (!pair) return null;
            
            // Remove left_image_url and right_image_url if present
            const { left_image_url, right_image_url, ...pairResult } = { ...pair };
            
            if (pairResult.left_image && pairResult.left_image.image_url) { // Check if image_url exists
               try {
                  const leftPresignedUrl = await this.awsS3Service.generatePresignedUrl(pairResult.left_image.image_url, 3600);
                  pairResult.left_image = {
                    id: pairResult.left_image.id,
                    presigned_url: leftPresignedUrl
                  };
               } catch (error) {
                  this.logger.error(`Failed to generate presigned URL for match pair left image ${pairResult.left_image.id}:`, error);
                  pairResult.left_image = { id: pairResult.left_image.id };
               }
            } else if (pairResult.left_image) {
               pairResult.left_image = { id: pairResult.left_image.id };
            }
            
            if (pairResult.right_image && pairResult.right_image.image_url) { // Check if image_url exists
               try {
                  const rightPresignedUrl = await this.awsS3Service.generatePresignedUrl(pairResult.right_image.image_url, 3600);
                  pairResult.right_image = {
                    id: pairResult.right_image.id,
                    presigned_url: rightPresignedUrl
                  };
               } catch (error) {
                  this.logger.error(`Failed to generate presigned URL for match pair right image ${pairResult.right_image.id}:`, error);
                  pairResult.right_image = { id: pairResult.right_image.id };
               }
            } else if (pairResult.right_image) {
                pairResult.right_image = { id: pairResult.right_image.id };
            }
            
            return pairResult;
          }));
        }
        
        return textResult;
      }));
    }
    
    return processedQuestion;
  }

  // Helper method to ensure a SubsectionAllocationDto has all required properties
  private ensureSubsectionProperties(subsection: any): SubsectionAllocationDto {
    if (!subsection.sequentialNumber && subsection.sequentialNumber !== 0) {
      subsection.sequentialNumber = 0; // Default value
    }
    if (!subsection.section_id) {
      subsection.section_id = 0;
    }
    if (!subsection.question_type_id) {
      subsection.question_type_id = 0;
    }
    if (!subsection.question_type) {
      subsection.question_type = { id: 0, type_name: '' };
    }
    return subsection;
  }

  // Helper method to ensure a SectionAllocationDto has all required properties
  private ensureSectionProperties(section: any): SectionAllocationDto {
    if (!section.sequentialNumber && section.sequentialNumber !== 0) {
      section.sequentialNumber = 0; // Default value
    }
    if (!section.subSection) {
      section.subSection = ''; // Default value
    }
    if (!section.pattern_id) {
      section.pattern_id = 0;
    }
    if (!section.section_number) {
      section.section_number = 0;
    }
    if (!section.mandotory_questions) {
      section.mandotory_questions = 0;
    }
    if (!section.marks_per_question) {
      section.marks_per_question = 0;
    }
    return section;
  }

  async changeQuestion(request: ChangeQuestionRequestDto): Promise<ChangeQuestionResponseDto> {
    const { questionTextIds, mediumIds, chapterId, questionOrigin = 'both' } = request;
    
    if (questionTextIds.length === 0) {
      throw new BadRequestException('At least one question text ID must be provided');
    }
    
    // Verify that the chapter exists
    const chapterInfo = await this.prisma.chapter.findUnique({
      where: { id: chapterId }
    });

    if (!chapterInfo) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }

    // Get medium information for the response
    const mediumInfo = await this.prisma.instruction_Medium.findMany({
      where: { id: { in: mediumIds } }
    });

    if (!mediumInfo || mediumInfo.length === 0) {
      throw new NotFoundException(`No mediums found for the provided medium IDs`);
    }

    // Get the question IDs to exclude based on the provided question text IDs
    const questionsToExclude = await this.prisma.question_Text.findMany({
      where: {
        id: { in: questionTextIds }
      },
      select: {
        question_id: true
      }
    });
    
    const questionIdsToExclude = questionsToExclude.map(qt => qt.question_id);

    // Get question type ID from the first question text to match the same type
    const firstQuestionText = await this.prisma.question_Text.findUnique({
      where: { id: questionTextIds[0] },
      include: {
        question: {
          include: {
            question_type: true
          }
        }
      }
    });

    if (!firstQuestionText || !firstQuestionText.question) {
      throw new NotFoundException(`Question text with ID ${questionTextIds[0]} not found`);
    }

    const questionTypeId = firstQuestionText.question.question_type_id;
    const questionType = firstQuestionText.question.question_type;

    this.logger.log(`Original question has type ID ${questionTypeId} (${questionType?.type_name || 'unknown'})`);

    // Create medium conditions to ensure the question is available in ALL requested mediums
    const mediumConditions = mediumIds.map(mediumId => ({
      question_texts: {
        some: {
          question_text_topics: {
            some: {
              instruction_medium_id: mediumId,
              is_verified: true
            }
          }
        }
      }
    }));

    this.logger.log(`Searching for replacement question with chapter ID ${chapterId}, question type ID ${questionTypeId}, medium IDs ${mediumIds.join(',')}, and origin type "${questionOrigin}"`);
    
    // Build query conditions
    const whereClause: any = {
      id: { notIn: questionIdsToExclude }, // Exclude questions associated with the provided question text IDs
      question_type_id: questionTypeId, // Ensure the question has the same type as the original
      question_topics: {
        some: {
          topic: {
            chapter_id: chapterId
          }
        }
      },
      AND: mediumConditions // Ensure the question is available in ALL requested mediums
    };
    
    // Add board_question condition based on questionOrigin
    if (questionOrigin === 'board') {
      whereClause.board_question = true;
      this.logger.log('Filtering to include only board questions');
    } else if (questionOrigin === 'other') {
      whereClause.board_question = false;
      this.logger.log('Filtering to include only non-board questions');
    } else {
      this.logger.log('Including both board and non-board questions');
    }

    // Get all potential replacement questions
    const replacementQuestions = await this.prisma.question.findMany({
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
                instruction_medium: true,
                question_topic: {
                  include: {
                    topic: {
                      include: {
                        chapter: true
                      }
                    }
                  }
                }
              },
              where: {
                instruction_medium_id: { in: mediumIds },
                is_verified: true
              }
            }
          },
          where: {
            question_text_topics: {
              some: {
                instruction_medium_id: { in: mediumIds },
                is_verified: true
              }
            }
          }
        },
        question_topics: {
          include: {
            topic: {
              include: {
                chapter: true
              }
            }
          }
        }
      }
    });

    if (!replacementQuestions || replacementQuestions.length === 0) {
      throw new NotFoundException(
        `No replacement questions found for chapter ID ${chapterId}, question type ID ${questionTypeId}, medium IDs ${mediumIds.join(',')}, and origin type "${questionOrigin}"`
      );
    }

    this.logger.log(`Found ${replacementQuestions.length} potential replacement questions with the same question type`);

    // Select a random question from the available pool
    const randomIndex = Math.floor(Math.random() * replacementQuestions.length);
    const selectedQuestion = replacementQuestions[randomIndex];
    
    // Verify the selected question has the same question type as the original
    if (selectedQuestion.question_type_id !== questionTypeId) {
      this.logger.error(`Question type mismatch: Expected ${questionTypeId}, got ${selectedQuestion.question_type_id}`);
      throw new BadRequestException(`Selected question does not have the expected question type`);
    }
    
    // Process images with presigned URLs if they exist
    const processedQuestion = await this.processExistingQuestion(selectedQuestion);

    // Format the response according to the DTO
    const response: ChangeQuestionResponseDto = {
      question: processedQuestion,
      questionType: {
        id: selectedQuestion.question_type.id,
        type_name: selectedQuestion.question_type.type_name
      },
      chapter: {
        id: chapterInfo.id,
        name: chapterInfo.name
      },
      medium: {
        id: mediumInfo[0].id,
        instruction_medium: mediumInfo[0].instruction_medium
      }
    };

    // Remove any image_url properties that might still be present
    return this.removeImageUrlProperties(response);
  }
} 