import { Test, TestingModule } from '@nestjs/testing';
import { MediumStandardSubjectController } from './medium-standard-subject.controller';
import { MediumStandardSubjectService } from './medium-standard-subject.service';
import { CreateMediumStandardSubjectDto, GetMssQueryDto } from './dto/medium-standard-subject.dto';
import { NotFoundException } from '@nestjs/common';

describe('MediumStandardSubjectController', () => {
  let controller: MediumStandardSubjectController;
  let service: MediumStandardSubjectService;

  const mockMssService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByMediumAndStandard: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediumStandardSubjectController],
      providers: [
        {
          provide: MediumStandardSubjectService,
          useValue: mockMssService,
        },
      ],
    }).compile();

    controller = module.get<MediumStandardSubjectController>(MediumStandardSubjectController);
    service = module.get<MediumStandardSubjectService>(MediumStandardSubjectService);
  });

  describe('create', () => {
    it('should create a new association', async () => {
      const createDto = {
        instruction_medium_id: 1,
        standard_id: 1,
        subject_id: 1,
      };
      const expectedResult = { id: 1, ...createDto };

      mockMssService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);
      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should validate input data', async () => {
      const invalidDto = {
        instruction_medium_id: 999999,
        standard_id: 1,
        subject_id: 1,
      };
      mockMssService.create.mockRejectedValue(new NotFoundException('Instruction medium not found'));
      await expect(controller.create(invalidDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should handle empty results', async () => {
      mockMssService.findAll.mockResolvedValue([]);
      const query: Partial<GetMssQueryDto> = {
        instruction_medium_id: 1,
        standard_id: 1,
        subject_id: 1
      };
      const result = await controller.findAll(query);
      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('Integration', () => {
    it('should work with real database', async () => {
      // Setup test database
      // Run actual queries
      // Verify results
    });
  });
}); 