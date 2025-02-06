import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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
    it('should return all users', async () => {
      const expectedUsers = [{ id: 1, name: 'User 1' }];
      mockUserService.findAll.mockResolvedValue(expectedUsers);

      const result = await controller.findAll(undefined);
      expect(result).toEqual(expectedUsers);
    });

    it('should return users filtered by school ID', async () => {
      const schoolId = '1';
      const expectedUsers = [{ id: 1, name: 'User 1' }];
      mockUserService.findAll.mockResolvedValue(expectedUsers);

      const result = await controller.findAll(schoolId);
      expect(result).toEqual(expectedUsers);
      expect(service.findAll).toHaveBeenCalledWith(1);
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
}); 