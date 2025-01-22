import { Test, TestingModule } from '@nestjs/testing';
import { SchoolStandardService } from './school_standard.service';

describe('SchoolStandardService', () => {
  let service: SchoolStandardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolStandardService],
    }).compile();

    service = module.get<SchoolStandardService>(SchoolStandardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
