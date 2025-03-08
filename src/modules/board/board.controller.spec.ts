import { Test, TestingModule } from '@nestjs/testing';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';

describe('BoardController', () => {
  let controller: BoardController;
  let boardService: BoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardController],
      providers: [
        {
          provide: BoardService,
          useValue: {
            // Mock BoardService methods used in controller
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BoardController>(BoardController);
    boardService = module.get<BoardService>(BoardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  
  describe('findAll', () => {
    it('should call boardService.findAll with default pagination values', async () => {
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
      
      jest.spyOn(boardService, 'findAll').mockResolvedValue(mockPaginatedResponse);
      
      await controller.findAll({});
      
      expect(boardService.findAll).toHaveBeenCalledWith(1, 15);
    });
    
    it('should call boardService.findAll with provided pagination values', async () => {
      const mockPaginatedResponse = {
        data: [],
        meta: { 
          total: 0, 
          page: 2, 
          page_size: 15, 
          total_pages: 0,
          sort_by: SortField.CREATED_AT,
          sort_order: SortOrder.DESC
        }
      };
      
      jest.spyOn(boardService, 'findAll').mockResolvedValue(mockPaginatedResponse);
      
      await controller.findAll({ page: 2, page_size: 15 });
      
      expect(boardService.findAll).toHaveBeenCalledWith(2, 15);
    });

    it('should call boardService.findAll with provided pagination and sorting values', async () => {
      const mockPaginatedResponse = {
        data: [],
        meta: { 
          total: 0, 
          page: 2, 
          page_size: 15, 
          total_pages: 0, 
          sort_by: SortField.CREATED_AT, 
          sort_order: SortOrder.DESC 
        }
      };
      
      jest.spyOn(boardService, 'findAll').mockResolvedValue(mockPaginatedResponse);
      
      await controller.findAll({ 
        page: 2, 
        page_size: 15, 
        sort_by: SortField.CREATED_AT, 
        sort_order: SortOrder.DESC 
      });
      
      expect(boardService.findAll).toHaveBeenCalledWith(2, 15, SortField.CREATED_AT, SortOrder.DESC);
    });
  });
});
