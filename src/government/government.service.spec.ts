import { Test, TestingModule } from '@nestjs/testing';
import { GovernmentService } from './government.service';

describe('GovernmentService', () => {
  let service: GovernmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GovernmentService],
    }).compile();

    service = module.get<GovernmentService>(GovernmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
