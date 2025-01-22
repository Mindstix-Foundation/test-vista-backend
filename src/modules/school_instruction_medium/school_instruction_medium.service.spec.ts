import { Test, TestingModule } from '@nestjs/testing';
import { SchoolInstructionMediumService } from './school_instruction_medium.service';

describe('SchoolInstructionMediumService', () => {
  let service: SchoolInstructionMediumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolInstructionMediumService],
    }).compile();

    service = module.get<SchoolInstructionMediumService>(SchoolInstructionMediumService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
