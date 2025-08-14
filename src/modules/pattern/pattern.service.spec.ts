import { Test, TestingModule } from '@nestjs/testing';
import { PatternService } from './pattern.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';

describe('PatternService', () => {
  let service: PatternService;
  let prisma: PrismaService;

  const mockPrismaService = {
    pattern: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    board: {
      findUnique: jest.fn(),
    },
    standard: {
      findUnique: jest.fn(),
    },
    subject: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatternService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PatternService>(PatternService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreatePatternDto = {
      pattern_name: 'Test Pattern',
      board_id: 1,
      standard_id: 1,
      subject_id: 1,
      total_marks: 100,
    };

    it('should create a new pattern successfully', async () => {
      const expectedResult = {
        id: 1,
        ...createDto,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.board.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.standard.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.subject.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.pattern.create.mockResolvedValue(expectedResult);

      const result = await service.create(createDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when board not found', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.board.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.board_id },
      });
    });

    it('should throw NotFoundException when standard not found', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.standard.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.standard.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.standard_id },
      });
    });

    it('should throw NotFoundException when subject not found', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.standard.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.subject.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.subject.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.subject_id },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated patterns with default sorting', async () => {
      const mockPatterns = [
        { id: 1, pattern_name: 'Pattern A', created_at: new Date('2023-01-02') },
        { id: 2, pattern_name: 'Pattern B', created_at: new Date('2023-01-01') },
      ];
      
      mockPrismaService.pattern.count.mockResolvedValue(2);
      mockPrismaService.pattern.findMany.mockResolvedValue(mockPatterns);

      const result = await service.findAll({});
      
      expect(result).toEqual({
        data: mockPatterns,
        meta: {
          total: 2,
          page: 1,
          page_size: 10,
          total_pages: 1,
          sort_by: SortField.CREATED_AT,
          sort_order: SortOrder.DESC
        }
      });
      
      expect(mockPrismaService.pattern.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        include: expect.any(Object),
        orderBy: { created_at: 'desc' }
      });
    });
    
    it('should filter patterns by boardId', async () => {
      const mockPatterns = [
        { id: 1, pattern_name: 'Pattern A', board_id: 1 },
      ];
      
      mockPrismaService.pattern.count.mockResolvedValue(1);
      mockPrismaService.pattern.findMany.mockResolvedValue(mockPatterns);

      const result = await service.findAll({ boardId: 1 });
      
      expect(result.data).toEqual(mockPatterns);
      expect(mockPrismaService.pattern.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { board_id: 1 },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' }
      });
    });
    
    it('should sort patterns by name in ascending order', async () => {
      const mockPatterns = [
        { id: 1, pattern_name: 'Pattern A' },
        { id: 2, pattern_name: 'Pattern B' },
      ];
      
      mockPrismaService.pattern.count.mockResolvedValue(2);
      mockPrismaService.pattern.findMany.mockResolvedValue(mockPatterns);

      const result = await service.findAll({ 
        sort_by: SortField.NAME, 
        sort_order: SortOrder.ASC 
      });
      
      expect(result.data).toEqual(mockPatterns);
      expect(mockPrismaService.pattern.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        include: expect.any(Object),
        orderBy: { pattern_name: 'asc' }
      });
    });
  });

  describe('findOne', () => {
    it('should return a pattern by ID', async () => {
      const patternId = 1;
      const expectedPattern = { id: patternId, pattern_name: 'Test Pattern' };

      mockPrismaService.pattern.findUnique.mockResolvedValue(expectedPattern);

      const result = await service.findOne(patternId);
      expect(result).toEqual(expectedPattern);
      expect(mockPrismaService.pattern.findUnique).toHaveBeenCalledWith({
        where: { id: patternId },
        include: expect.any(Object)
      });
    });

    it('should throw NotFoundException when pattern not found', async () => {
      const patternId = 999;
      mockPrismaService.pattern.findUnique.mockResolvedValue(null);

      await expect(service.findOne(patternId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdatePatternDto = {
      pattern_name: 'Updated Pattern',
    };

    it('should update a pattern successfully', async () => {
      const patternId = 1;
      const existingPattern = { id: patternId, pattern_name: 'Old Pattern' };
      const updatedPattern = { ...existingPattern, ...updateDto };

      mockPrismaService.pattern.findUnique.mockResolvedValue(existingPattern);
      mockPrismaService.pattern.update.mockResolvedValue(updatedPattern);

      const result = await service.update(patternId, updateDto);
      expect(result).toEqual(updatedPattern);
    });

    it('should throw NotFoundException when updating non-existent pattern', async () => {
      const patternId = 999;
      mockPrismaService.pattern.findUnique.mockResolvedValue(null);

      await expect(service.update(patternId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a pattern successfully', async () => {
      const patternId = 1;
      mockPrismaService.pattern.findUnique.mockResolvedValue({ id: patternId });
      mockPrismaService.pattern.delete.mockResolvedValue({ id: patternId });

      const result = await service.remove(patternId);
      expect(result).toEqual({ message: 'Pattern deleted successfully' });
      expect(mockPrismaService.pattern.delete).toHaveBeenCalledWith({
        where: { id: patternId },
      });
    });

    it('should throw NotFoundException when deleting non-existent pattern', async () => {
      const patternId = 999;
      mockPrismaService.pattern.findUnique.mockResolvedValue(null);

      await expect(service.remove(patternId)).rejects.toThrow(NotFoundException);
    });
  });
}); 