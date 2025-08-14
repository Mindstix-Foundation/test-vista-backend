import { Test, TestingModule } from '@nestjs/testing';
import { SchoolStandardController } from './school_standard.controller';
import { SchoolStandardService } from './school_standard.service';

describe('SchoolStandardController', () => {
  let controller: SchoolStandardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolStandardController],
      providers: [
        {
          provide: SchoolStandardService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SchoolStandardController>(SchoolStandardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
