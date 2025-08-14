import { Test, TestingModule } from '@nestjs/testing';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';

describe('SchoolController', () => {
  let controller: SchoolController;
  let schoolService: SchoolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolController],
      providers: [
        {
          provide: SchoolService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SchoolController>(SchoolController);
    schoolService = module.get<SchoolService>(SchoolService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  
  describe('findAll', () => {
    it('should call schoolService.findAll with default pagination values', async () => {
      const mockPaginatedResponse = {
        data: [],
        meta: { 
          total: 0, 
          page: 1, 
          page_size: 15, 
          total_pages: 0,
          sort_by: SortField.NAME,
          sort_order: SortOrder.ASC
        }
      };
      
      jest.spyOn(schoolService, 'findAll').mockResolvedValue(mockPaginatedResponse);
      
      await controller.findAll({});
      
      expect(schoolService.findAll).toHaveBeenCalledWith(undefined, 1, 15, SortField.NAME, SortOrder.ASC);
    });
    
    it('should call schoolService.findAll with provided boardId and pagination values', async () => {
      const mockPaginatedResponse = {
        data: [],
        meta: { 
          total: 0, 
          page: 2, 
          page_size: 15, 
          total_pages: 0,
          sort_by: SortField.NAME,
          sort_order: SortOrder.ASC
        }
      };
      
      jest.spyOn(schoolService, 'findAll').mockResolvedValue(mockPaginatedResponse);
      
      await controller.findAll({ boardId: 1, page: 2, page_size: 15 });
      
      expect(schoolService.findAll).toHaveBeenCalledWith(1, 2, 15, SortField.NAME, SortOrder.ASC);
    });
    
    it('should call schoolService.findAll with provided sorting values', async () => {
      const mockPaginatedResponse = {
        data: [],
        meta: { 
          total: 0, 
          page: 1, 
          page_size: 15, 
          total_pages: 0, 
          sort_by: SortField.CREATED_AT, 
          sort_order: SortOrder.DESC 
        }
      };
      
      jest.spyOn(schoolService, 'findAll').mockResolvedValue(mockPaginatedResponse);
      
      await controller.findAll({ 
        sort_by: SortField.CREATED_AT, 
        sort_order: SortOrder.DESC 
      });
      
      expect(schoolService.findAll).toHaveBeenCalledWith(undefined, 1, 15, SortField.CREATED_AT, SortOrder.DESC);
    });
  });
});
