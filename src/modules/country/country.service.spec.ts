import { Test, TestingModule } from '@nestjs/testing';
import { CountryService } from './country.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CountryService', () => {
  let service: CountryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountryService,
        {
          provide: PrismaService,
          useValue: {
            country: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findFirst: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
          },
        },
      ],
    }).compile();

    service = module.get<CountryService>(CountryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
