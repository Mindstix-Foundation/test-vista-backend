import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';
import { AddTeacherDto } from './dto/add-teacher.dto';
import { EditTeacherDto } from './dto/edit-teacher.dto';

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
    addTeacher: jest.fn(),
    editTeacher: jest.fn(),
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

  describe('addTeacher', () => {
    it('should create a new teacher', async () => {
      const addTeacherDto: AddTeacherDto = {
        name: 'John Teacher',
        email_id: 'john.teacher@example.com',
        password: 'StrongPassword123!',
        contact_number: '+911234567890',
        alternate_contact_number: '+919876543210',
        highest_qualification: 'M.Tech',
        status: true,
        school_id: 1,
        start_date: new Date('2023-01-01'),
        end_date: new Date('2024-12-31'),
        standard_subjects: [
          { schoolStandardId: 1, subjectIds: [1, 2] }
        ]
      };

      const mockResult = {
        id: 1,
        name: 'John Teacher',
        email_id: 'john.teacher@example.com',
        contact_number: '+911234567890',
        alternate_contact_number: '+919876543210',
        highest_qualification: 'M.Tech',
        status: true,
        role: 'TEACHER',
        school: 'Test School',
        assigned_standards: ['Class 1'],
        message: 'Teacher added successfully'
      };

      jest.spyOn(service, 'addTeacher').mockResolvedValue(mockResult);

      expect(await controller.addTeacher(addTeacherDto)).toBe(mockResult);
      expect(service.addTeacher).toHaveBeenCalledWith(addTeacherDto);
    });
  });

  describe('editTeacher', () => {
    it('should update an existing teacher', async () => {
      const editTeacherDto: EditTeacherDto = {
        id: 1,
        name: 'Updated Teacher Name',
        email_id: 'updated.teacher@example.com',
        contact_number: '+911234567890',
        status: true,
        school_id: 2,
        start_date: new Date('2023-02-01'),
        standard_subjects: [
          { schoolStandardId: 3, subjectIds: [4, 5] }
        ]
      };

      const mockResult = {
        id: 1,
        name: 'Updated Teacher Name',
        email_id: 'updated.teacher@example.com',
        contact_number: '+911234567890',
        alternate_contact_number: '+919876543210',
        highest_qualification: 'M.Tech',
        status: true,
        role: 'TEACHER',
        school: 'New School',
        assigned_standards: ['Class 3'],
        message: 'Teacher updated successfully'
      };

      jest.spyOn(service, 'editTeacher').mockResolvedValue(mockResult);

      expect(await controller.editTeacher(editTeacherDto)).toBe(mockResult);
      expect(service.editTeacher).toHaveBeenCalledWith(editTeacherDto);
    });
  });
}); 