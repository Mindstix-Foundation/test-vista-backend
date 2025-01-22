import { Test, TestingModule } from '@nestjs/testing';
import { SchoolStandardController } from './school_standard.controller';

describe('SchoolStandardController', () => {
  let controller: SchoolStandardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolStandardController],
    }).compile();

    controller = module.get<SchoolStandardController>(SchoolStandardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
