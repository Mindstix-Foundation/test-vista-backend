import { Test, TestingModule } from '@nestjs/testing';
import { SchoolInstructionMediumController } from './school_instruction_medium.controller';
import { SchoolInstructionMediumService } from './school_instruction_medium.service';

describe('SchoolInstructionMediumController', () => {
  let controller: SchoolInstructionMediumController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolInstructionMediumController],
      providers: [
        {
          provide: SchoolInstructionMediumService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SchoolInstructionMediumController>(SchoolInstructionMediumController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
