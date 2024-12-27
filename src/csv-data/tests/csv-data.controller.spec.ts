import { Test, TestingModule } from '@nestjs/testing';
import { CsvDataController } from './csv-data.controller';

describe('CsvDataController', () => {
  let controller: CsvDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CsvDataController],
    }).compile();

    controller = module.get<CsvDataController>(CsvDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
