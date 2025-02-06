import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user_School: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      email_id: 'test@example.com',
      name: 'Test User',
      contact_number: '1234567890',
      password: 'Password123!',
      status: true,
    };

    it('should create a new user successfully', async () => {
      const expectedResult = {
        id: 1,
        ...createDto,
        password: 'hashedPassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(expectedResult);

      const result = await service.create(createDto);
      expect(result).toEqual(expect.objectContaining({
        id: expectedResult.id,
        email_id: expectedResult.email_id,
        name: expectedResult.name,
      }));
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, email_id: createDto.email_id });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid email format', async () => {
      const invalidDto = { ...createDto, email_id: 'invalid-email' };
      await expect(service.create(invalidDto)).rejects.toThrow('Invalid email format');
    });

    it('should throw BadRequestException for invalid contact number', async () => {
      const invalidDto = { ...createDto, contact_number: '123' };
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      
      await expect(service.create(invalidDto)).rejects.toThrow('Contact number must be exactly 10 digits');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const expectedUsers = [{ id: 1, name: 'Test User' }];
      mockPrismaService.user.findMany.mockResolvedValue(expectedUsers);
      
      const result = await service.findAll();
      expect(result).toEqual(expectedUsers);
    });

    it('should return users filtered by school ID', async () => {
      const schoolId = 1;
      const expectedUsers = [{ id: 1, name: 'User 1' }];

      mockPrismaService.user.findMany.mockResolvedValue(expectedUsers);

      const result = await service.findAll(schoolId);
      expect(result).toEqual(expectedUsers);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const userId = 1;
      const expectedUser = { id: userId, name: 'Test User' };

      mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

      const result = await service.findOne(userId);
      expect(result).toEqual(expectedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 999;
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = {
      name: 'Updated Name',
      contact_number: '9876543210',
    };

    it('should update a user successfully', async () => {
      const userId = 1;
      const existingUser = { 
        id: userId, 
        name: 'Old Name',
        contact_number: '1234567890',
        alternate_contact_number: null
      };
      const updatedUser = { 
        ...existingUser, 
        ...updateDto,
        alternate_contact_number: null
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateDto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      const userId = 999;
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update(userId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      const userId = 1;
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.user_School.count.mockResolvedValue(0);

      await service.remove(userId);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw NotFoundException when deleting non-existent user', async () => {
      const userId = 999;
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException when user has school associations', async () => {
      const userId = 1;
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.user_School.count.mockResolvedValue(1);

      await expect(service.remove(userId)).rejects.toThrow('Cannot delete user because they are associated with schools');
    });
  });
}); 