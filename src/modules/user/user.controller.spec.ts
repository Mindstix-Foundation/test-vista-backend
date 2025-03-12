import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    checkEmailAvailability: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto: CreateUserDto = {
        email_id: 'test@example.com',
        name: 'Test User',
        contact_number: '1234567890',
        password: 'Password123!',
        status: true,
      };
      const expectedResult = { id: 1, ...createDto };

      mockUserService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);
      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users with default values', async () => {
      const mockPaginatedResponse = {
        data: [{ id: 1, name: 'User 1' }],
        meta: { 
          total: 1, 
          page: 1, 
          page_size: 15, 
          total_pages: 1,
          sort_by: SortField.NAME,
          sort_order: SortOrder.ASC
        }
      };
      
      mockUserService.findAll.mockResolvedValue(mockPaginatedResponse);
      
      const result = await controller.findAll({});
      
      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith(undefined, 1, 15, SortField.NAME, SortOrder.ASC);
    });

    it('should return users filtered by school ID with pagination', async () => {
      const mockPaginatedResponse = {
        data: [{ id: 1, name: 'User 1' }],
        meta: { 
          total: 1, 
          page: 2, 
          page_size: 15, 
          total_pages: 1,
          sort_by: SortField.NAME,
          sort_order: SortOrder.ASC
        }
      };
      
      mockUserService.findAll.mockResolvedValue(mockPaginatedResponse);
      
      const result = await controller.findAll({ schoolId: 1, page: 2 });
      
      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith(1, 2, 15, SortField.NAME, SortOrder.ASC);
    });
    
    it('should return users with custom sorting', async () => {
      const mockPaginatedResponse = {
        data: [{ id: 1, name: 'User 1' }],
        meta: { 
          total: 1, 
          page: 1, 
          page_size: 15, 
          total_pages: 1,
          sort_by: SortField.CREATED_AT,
          sort_order: SortOrder.DESC
        }
      };
      
      mockUserService.findAll.mockResolvedValue(mockPaginatedResponse);
      
      const result = await controller.findAll({ 
        sort_by: SortField.CREATED_AT, 
        sort_order: SortOrder.DESC 
      });
      
      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith(
        undefined, 1, 15, SortField.CREATED_AT, SortOrder.DESC
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const userId = 1;
      const expectedUser = { id: userId, name: 'Test User' };
      mockUserService.findOne.mockResolvedValue(expectedUser);

      const result = await controller.findOne(userId);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = 1;
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      const expectedResult = { id: userId, ...updateDto };

      mockUserService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(userId, updateDto);
      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(userId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = 1;
      await controller.remove(userId);
      expect(service.remove).toHaveBeenCalledWith(userId);
    });
  });

  describe('checkEmailAvailability', () => {
    it('should check if an email is available', async () => {
      const email = 'test@example.com';
      const expectedResult = { 
        email, 
        available: true,
        message: `Email ${email} is available`
      };
      
      mockUserService.checkEmailAvailability.mockResolvedValue(expectedResult);
      
      const result = await controller.checkEmailAvailability(email);
      expect(result).toEqual(expectedResult);
      expect(service.checkEmailAvailability).toHaveBeenCalledWith(email);
    });
  });
}); 