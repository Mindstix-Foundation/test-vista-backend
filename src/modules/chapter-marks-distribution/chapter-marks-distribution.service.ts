import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChapterMarksRequestDto, ChapterMarksDistributionResponseDto, SectionAllocationDto, SubsectionAllocationDto, AllocatedChapterDto, ChapterMarksDto } from './dto/chapter-marks-distribution.dto';

@Injectable()
export class ChapterMarksDistributionService {
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
    
    return result;
  }

  private async getChapterQuestionTypeCounts(
    chapterIds: number[],
    mediumIds: number[]
  ): Promise<Map<number, Map<number, number>>> {
    const result = await this.prisma.$queryRaw<{ chapter_id: bigint, question_type_id: bigint, count: bigint }[]>`
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

    const chapterQuestionTypeMap = new Map<number, Map<number, number>>();
    
    for (const row of result) {
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

  async distributeChapterMarks(filter: ChapterMarksRequestDto): Promise<ChapterMarksDistributionResponseDto> {
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

    // 2. Calculate total pattern marks
    const patternTotalMarks = pattern.sections.reduce((total, section) => {
      return total + (section.total_questions * section.marks_per_question);
    }, 0);

    // 3. Calculate total requested marks
    const totalRequestedMarks = filter.requestedMarks.reduce((sum, marks) => sum + marks, 0);

    // 4. Validate total marks
    if (totalRequestedMarks !== patternTotalMarks) {
      throw new BadRequestException(`Total requested marks (${totalRequestedMarks}) must equal pattern total marks (${patternTotalMarks})`);
    }

    // 5. Get chapter question type counts
    const chapterQuestionTypeMap = await this.getChapterQuestionTypeCounts(
      filter.chapterIds,
      filter.mediumIds
    );

    // 6. Initialize chapter marks tracking
    const chapterMarksMap = new Map<number, number>();
    filter.chapterIds.forEach(chapterId => chapterMarksMap.set(chapterId, 0));

    // 7. Create random sections array
    const randomSections = this.generateRandomSequence(pattern.sections);

    // 8. Process each section
    const sectionAllocations: SectionAllocationDto[] = [];

    for (const section of randomSections) {
      const sectionAbsoluteMarks = section.total_questions * section.marks_per_question;
      let randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);

      const subsectionAllocations: SubsectionAllocationDto[] = [];

      for (const sqt of section.subsection_question_types) {
        const questionTypeId = sqt.question_type_id;
        let remainingQuestions = section.subsection_question_types.length === 1 
          ? section.total_questions 
          : 1;

        const allocatedChapters: AllocatedChapterDto[] = [];

        while (remainingQuestions > 0) {
          if (randomChapters.length === 0) {
            randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);
          }

          let currentIndex = 0;
          let chapterAllocated = false;

          while (currentIndex < randomChapters.length && !chapterAllocated) {
            const currentChapterId = randomChapters[currentIndex];
            const chapterQuestionTypes = chapterQuestionTypeMap.get(currentChapterId);
            
            if (chapterQuestionTypes && chapterQuestionTypes.has(questionTypeId)) {
              const questionCount = chapterQuestionTypes.get(questionTypeId)!;
              
              if (questionCount > 0) {
                const chapter = await this.prisma.chapter.findUnique({
                  where: { id: currentChapterId }
                });

                if (!chapter) {
                  throw new NotFoundException(`Chapter with ID ${currentChapterId} not found`);
                }

                allocatedChapters.push({
                  chapterId: currentChapterId,
                  chapterName: chapter.name
                });

                const currentMarks = chapterMarksMap.get(currentChapterId) || 0;
                chapterMarksMap.set(currentChapterId, currentMarks + section.marks_per_question);

                chapterQuestionTypes.set(questionTypeId, questionCount - 1);
                
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

          if (!chapterAllocated) {
            randomChapters = this.getRandomChaptersByMarks(chapterMarksMap);
          }
        }

        subsectionAllocations.push({
          subsectionQuestionTypeId: sqt.id,
          questionTypeName: sqt.question_type.type_name,
          allocatedChapters
        });
      }

      sectionAllocations.push({
        sectionId: section.id,
        sectionName: section.section_name,
        totalQuestions: section.total_questions,
        absoluteMarks: sectionAbsoluteMarks,
        totalMarks: section.total_questions * section.marks_per_question,
        subsectionAllocations
      });
    }

    // 9. Prepare chapter marks
    const chapterMarks: ChapterMarksDto[] = [];
    for (let i = 0; i < filter.chapterIds.length; i++) {
      const chapterId = filter.chapterIds[i];
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId }
      });

      if (!chapter) {
        throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
      }

      chapterMarks.push({
        chapterId,
        chapterName: chapter.name,
        absoluteMarks: chapterMarksMap.get(chapterId) || 0
      });
    }

    return {
      patternId: pattern.id,
      patternName: pattern.pattern_name,
      totalMarks: patternTotalMarks,
      absoluteMarks: patternTotalMarks,
      sectionAllocations,
      chapterMarks
    };
  }
} 