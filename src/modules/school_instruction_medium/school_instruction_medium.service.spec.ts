import { Test, TestingModule } from '@nestjs/testing';
import { SchoolInstructionMediumService } from './school_instruction_medium.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SchoolInstructionMediumService', () => {
  let service: SchoolInstructionMediumService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolInstructionMediumService,
        {
          provide: PrismaService,
          useValue: {
            school_Instruction_Medium: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
          },
        },
      ],
    }).compile();

    service = module.get<SchoolInstructionMediumService>(SchoolInstructionMediumService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
