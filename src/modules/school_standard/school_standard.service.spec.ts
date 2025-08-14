import { Test, TestingModule } from '@nestjs/testing';
import { SchoolStandardService } from './school_standard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SchoolStandardService', () => {
  let service: SchoolStandardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolStandardService,
        {
          provide: PrismaService,
          useValue: {
            school_Standard: {
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

    service = module.get<SchoolStandardService>(SchoolStandardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
