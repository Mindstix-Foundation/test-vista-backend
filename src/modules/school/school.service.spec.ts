import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from './school.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';

describe('SchoolService', () => {
  let service: SchoolService;
  let prisma: PrismaService;

  const mockPrismaService = {
    school: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SchoolService>(SchoolService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  describe('findAll', () => {
    it('should return paginated schools in alphabetical order', async () => {
      const mockSchools = [
        { id: 2, name: 'School A' },
        { id: 1, name: 'School B' },
      ];
      
      mockPrismaService.school.count.mockResolvedValue(2);
      mockPrismaService.school.findMany.mockResolvedValue(mockSchools);

      const result = await service.findAll(undefined, 1, 15);
      
      expect(result).toEqual({
        data: mockSchools,
        meta: {
          total: 2,
          page: 1,
          page_size: 15,
          total_pages: 1,
          sort_by: SortField.NAME,
          sort_order: SortOrder.ASC
        }
      });
      
      expect(mockPrismaService.school.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 15,
        where: {},
        orderBy: { name: 'asc' },
        include: expect.any(Object)
      });
    });
    
    it('should filter schools by boardId', async () => {
      const mockSchools = [
        { id: 1, name: 'School A', board_id: 1 },
      ];
      
      mockPrismaService.school.count.mockResolvedValue(1);
      mockPrismaService.school.findMany.mockResolvedValue(mockSchools);

      const result = await service.findAll(1, 1, 15);
      
      expect(result.data).toEqual(mockSchools);
      expect(mockPrismaService.school.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 15,
        where: { board_id: 1 },
        orderBy: { name: 'asc' },
        include: expect.any(Object)
      });
    });
    
    it('should sort schools by created_at in descending order', async () => {
      const mockSchools = [
        { id: 1, name: 'School A', created_at: new Date('2023-01-02') },
        { id: 2, name: 'School B', created_at: new Date('2023-01-01') },
      ];
      
      mockPrismaService.school.count.mockResolvedValue(2);
      mockPrismaService.school.findMany.mockResolvedValue(mockSchools);

      const result = await service.findAll(undefined, 1, 15, SortField.CREATED_AT, SortOrder.DESC);
      
      expect(result.data).toEqual(mockSchools);
      expect(mockPrismaService.school.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 15,
        where: {},
        orderBy: { created_at: 'desc' },
        include: expect.any(Object)
      });
    });
  });
});
