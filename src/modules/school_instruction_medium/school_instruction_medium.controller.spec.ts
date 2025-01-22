import { Test, TestingModule } from '@nestjs/testing';
import { SchoolInstructionMediumController } from './school_instruction_medium.controller';

describe('SchoolInstructionMediumController', () => {
  let controller: SchoolInstructionMediumController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolInstructionMediumController],
    }).compile();

    controller = module.get<SchoolInstructionMediumController>(SchoolInstructionMediumController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
