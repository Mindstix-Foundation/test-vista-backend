import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SmartTestService } from './smart-test.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestPaperService } from '../create_test_paper/create-test-paper.service';
import { ChapterMarksDistributionService } from '../chapter-marks-distribution/chapter-marks-distribution.service';
import { ChapterMarksRangeService } from '../chapter-marks-range/chapter-marks-range.service';
import { PaperTemplateService } from '../paper-template/paper-template.service';

describe('SmartTestService', () => {
  let service: SmartTestService;
  const prisma = {
    student: { findUnique: jest.fn() },
    test_Assignment: { findMany: jest.fn() },
    school_Instruction_Medium: { findMany: jest.fn() },
    medium_Standard_Subject: { findMany: jest.fn() },
    chapter: { findMany: jest.fn() },
    pattern: { findMany: jest.fn(), findUnique: jest.fn() },
    paper_Template: { findMany: jest.fn() },
  };
  const createTestPaperService = { getTestPaperAllocation: jest.fn() };
  const chapterMarksDistributionService = {
    processFinalQuestionsDistribution: jest.fn(),
    distributeChapterMarks: jest.fn(),
  };
  const chapterMarksRangeService = { getChapterMarksRanges: jest.fn() };
  const paperTemplateService = { filter: jest.fn(), findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartTestService,
        { provide: PrismaService, useValue: prisma },
        { provide: CreateTestPaperService, useValue: createTestPaperService },
        {
          provide: ChapterMarksDistributionService,
          useValue: chapterMarksDistributionService,
        },
        { provide: ChapterMarksRangeService, useValue: chapterMarksRangeService },
        { provide: PaperTemplateService, useValue: paperTemplateService },
      ],
    }).compile();

    service = module.get(SmartTestService);
    jest.clearAllMocks();
  });

  it('rejects template lookup for unenrolled programs', async () => {
    prisma.student.findUnique.mockResolvedValue({
      id: 1,
      school_standard: {
        school_id: 1,
        standard_id: 1,
        school: { id: 1, name: 'School', board_id: 1, board: { name: 'Board' } },
        standard: { id: 1, name: '10' },
      },
      participant: {
        participant_type: 'ASPIRANT',
        participant_programs: [{ exam_program_id: 9 }],
      },
    });

    await expect(service.getEnrolledProgramTemplates(10, 99)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns context for school students', async () => {
    prisma.student.findUnique.mockResolvedValue({
      id: 5,
      school_standard: {
        school_id: 2,
        standard_id: 3,
        school: { id: 2, name: 'ABC School', board_id: 1, board: { name: 'MSBSHSE' } },
        standard: { id: 3, name: 'Class 10' },
      },
      participant: null,
    });

    const ctx = await service.getContext(42);
    expect(ctx.student_id).toBe(5);
    expect(ctx.is_aspirant).toBe(false);
    expect(ctx.school.name).toBe('ABC School');
    expect(ctx.standard.name).toBe('Class 10');
  });
});
