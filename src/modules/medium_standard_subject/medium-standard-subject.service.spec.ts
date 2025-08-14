import { Test, TestingModule } from '@nestjs/testing';
import { MediumStandardSubjectService } from './medium-standard-subject.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('MediumStandardSubjectService', () => {
  let service: MediumStandardSubjectService;

  const mockPrismaService = {
    medium_Standard_Subject: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    instruction_Medium: {
      findUnique: jest.fn(),
    },
    standard: {
      findUnique: jest.fn(),
    },
    subject: {
      findUnique: jest.fn(),
    },
    teacher_Subject: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediumStandardSubjectService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MediumStandardSubjectService>(MediumStandardSubjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      instruction_medium_id: 1,
      standard_id: 1,
      subject_id: 1,
    };

    it('should create a new medium-standard-subject association', async () => {
      const expectedResult = {
        id: 1,
        ...createDto,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.instruction_Medium.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.standard.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.subject.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.medium_Standard_Subject.create.mockResolvedValue(expectedResult);

      const result = await service.create(createDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when instruction medium not found', async () => {
      mockPrismaService.instruction_Medium.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    // Add more test cases...
  });

  describe('findAll', () => {
    it('should return all associations when query params provided', async () => {
      const query = {
        instruction_medium_id: 1,
        standard_id: 1,
        subject_id: 1
      };
      const expectedResults = [
        {
          id: 1,
          ...query,
        },
      ];

      mockPrismaService.medium_Standard_Subject.findMany.mockResolvedValue(expectedResults);

      const result = await service.findAll(query.instruction_medium_id.toString(), query.standard_id.toString(), query.subject_id.toString());
      expect(result).toEqual(expectedResults);
      expect(mockPrismaService.medium_Standard_Subject.findMany).toHaveBeenCalledWith({
        where: query,
        select: service['mssSelect']
      });
    });

    // Add more test cases...
  });

  // Add more describe blocks for other methods...
}); 