import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from './school.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SchoolService', () => {
  let service: SchoolService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolService,
        {
          provide: PrismaService,
          useValue: {
            school: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
          },
        },
      ],
    }).compile();

    service = module.get<SchoolService>(SchoolService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
