import { Test, TestingModule } from '@nestjs/testing';
import { CsvDataService } from './csv-data.service';

describe('CsvDataService', () => {
  let service: CsvDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvDataService],
    }).compile();

    service = module.get<CsvDataService>(CsvDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
