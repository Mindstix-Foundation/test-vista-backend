import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateBoardDto, UpdateBoardDto } from './dto/board.dto';

describe('BoardService', () => {
  let service: BoardService;
  let prisma: PrismaService;

  const mockPrismaService = {
    board: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    school: {
      count: jest.fn(),
    },
    standard: {
      count: jest.fn(),
    },
    subject: {
      count: jest.fn(),
    },
    instruction_Medium: {
      count: jest.fn(),
    },
    address: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateBoardDto = {
      name: 'Test Board',
      abbreviation: 'TB',
      address_id: 1,
    };

    it('should create a new board', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.board.findFirst.mockResolvedValue(null);
      mockPrismaService.board.create.mockResolvedValue({
        id: 1,
        ...createDto,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.create(createDto);
      expect(result).toHaveProperty('id', 1);
    });

    it('should throw ConflictException when board name already exists', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.board.findFirst.mockResolvedValue({ id: 1 });
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all boards', async () => {
      const expectedBoards = [
        { id: 1, name: 'Board 1' },
        { id: 2, name: 'Board 2' },
      ];

      mockPrismaService.board.findMany.mockResolvedValue(expectedBoards);

      const result = await service.findAll();
      expect(result).toEqual(expectedBoards);
    });
  });

  describe('findOne', () => {
    it('should return a board by id', async () => {
      const boardId = 1;
      const expectedBoard = {
        id: boardId,
        name: 'Test Board',
      };

      mockPrismaService.board.findUnique.mockResolvedValue(expectedBoard);

      const result = await service.findOne(boardId);
      expect(result).toEqual(expectedBoard);
    });

    it('should throw NotFoundException when board not found', async () => {
      const boardId = 999;
      mockPrismaService.board.findUnique.mockResolvedValue(null);

      await expect(service.findOne(boardId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateBoardDto = {
      name: 'Updated Board',
    };

    it('should update a board', async () => {
      const boardId = 1;
      const existingBoard = { id: boardId, name: 'Old Name' };
      const updatedBoard = { ...existingBoard, ...updateDto };

      mockPrismaService.board.findUnique.mockResolvedValue(existingBoard);
      mockPrismaService.board.update.mockResolvedValue(updatedBoard);

      const result = await service.update(boardId, updateDto);
      expect(result).toEqual(updatedBoard);
    });

    it('should throw NotFoundException when updating non-existent board', async () => {
      const boardId = 999;
      mockPrismaService.board.findUnique.mockResolvedValue(null);

      await expect(service.update(boardId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const boardId = 1;

    it('should delete a board', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue({ id: boardId });
      mockPrismaService.school.count.mockResolvedValue(0);
      mockPrismaService.standard.count.mockResolvedValue(0);
      mockPrismaService.subject.count.mockResolvedValue(0);
      mockPrismaService.instruction_Medium.count.mockResolvedValue(0);
      mockPrismaService.board.delete.mockResolvedValue({ id: boardId });

      await service.remove(boardId);
      expect(mockPrismaService.board.delete).toHaveBeenCalledWith({
        where: { id: boardId },
      });
    });

    it('should throw NotFoundException when deleting non-existent board', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(null);

      await expect(service.remove(boardId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when board has associated records', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue({ id: boardId });
      mockPrismaService.school.count.mockResolvedValue(1);

      await expect(service.remove(boardId)).rejects.toThrow(ConflictException);
    });
  });
});
