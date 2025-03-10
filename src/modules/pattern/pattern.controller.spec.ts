import { Test, TestingModule } from '@nestjs/testing';
import { PatternController } from './pattern.controller';
import { PatternService } from './pattern.service';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';

describe('PatternController', () => {
  let controller: PatternController;
  let service: PatternService;

  const mockPatternService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatternController],
      providers: [
        {
          provide: PatternService,
          useValue: mockPatternService,
        },
      ],
    }).compile();

    controller = module.get<PatternController>(PatternController);
    service = module.get<PatternService>(PatternService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new pattern', async () => {
      const createDto: CreatePatternDto = {
        pattern_name: 'Test Pattern',
        board_id: 1,
        standard_id: 1,
        subject_id: 1,
        total_marks: 100
      };
      const expectedResult = { id: 1, ...createDto };

      mockPatternService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);
      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated patterns with default values', async () => {
      const mockPaginatedResponse = {
        data: [{ id: 1, pattern_name: 'Pattern 1' }],
        meta: { 
          total: 1, 
          page: 1, 
          page_size: 10, 
          total_pages: 1,
          sort_by: SortField.CREATED_AT,
          sort_order: SortOrder.DESC
        }
      };
      
      mockPatternService.findAll.mockResolvedValue(mockPaginatedResponse);
      
      const result = await controller.findAll({});
      
      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith({
        boardId: undefined,
        standardId: undefined,
        subjectId: undefined,
        totalMarks: undefined,
        page: 1,
        page_size: 10,
        sort_by: SortField.CREATED_AT,
        sort_order: SortOrder.DESC
      });
    });

    it('should return patterns filtered by board ID with pagination', async () => {
      const mockPaginatedResponse = {
        data: [{ id: 1, pattern_name: 'Pattern 1', board_id: 1 }],
        meta: { 
          total: 1, 
          page: 2, 
          page_size: 10, 
          total_pages: 1,
          sort_by: SortField.CREATED_AT,
          sort_order: SortOrder.DESC
        }
      };
      
      mockPatternService.findAll.mockResolvedValue(mockPaginatedResponse);
      
      const result = await controller.findAll({ boardId: 1, page: 2 });
      
      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith({
        boardId: 1,
        standardId: undefined,
        subjectId: undefined,
        totalMarks: undefined,
        page: 2,
        page_size: 10,
        sort_by: SortField.CREATED_AT,
        sort_order: SortOrder.DESC
      });
    });
    
    it('should return patterns with custom sorting', async () => {
      const mockPaginatedResponse = {
        data: [{ id: 1, pattern_name: 'Pattern 1' }],
        meta: { 
          total: 1, 
          page: 1, 
          page_size: 10, 
          total_pages: 1,
          sort_by: SortField.NAME,
          sort_order: SortOrder.ASC
        }
      };
      
      mockPatternService.findAll.mockResolvedValue(mockPaginatedResponse);
      
      const result = await controller.findAll({ 
        sort_by: SortField.NAME, 
        sort_order: SortOrder.ASC 
      });
      
      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith({
        boardId: undefined,
        standardId: undefined,
        subjectId: undefined,
        totalMarks: undefined,
        page: 1,
        page_size: 10,
        sort_by: SortField.NAME,
        sort_order: SortOrder.ASC
      });
    });
  });

  describe('findOne', () => {
    it('should return a pattern by ID', async () => {
      const patternId = 1;
      const expectedPattern = { id: patternId, pattern_name: 'Test Pattern' };
      mockPatternService.findOne.mockResolvedValue(expectedPattern);

      const result = await controller.findOne(patternId);
      expect(result).toEqual(expectedPattern);
      expect(service.findOne).toHaveBeenCalledWith(patternId);
    });
  });

  describe('update', () => {
    it('should update a pattern', async () => {
      const patternId = 1;
      const updateDto: UpdatePatternDto = {
        pattern_name: 'Updated Pattern',
      };
      const expectedResult = { id: patternId, pattern_name: 'Updated Pattern' };

      mockPatternService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(patternId, updateDto);
      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(patternId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a pattern', async () => {
      const patternId = 1;
      const expectedResult = { message: 'Pattern deleted successfully' };
      mockPatternService.remove.mockResolvedValue(expectedResult);
      
      const result = await controller.remove(patternId);
      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(patternId);
    });
  });
}); 