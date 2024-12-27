import { Test, TestingModule } from '@nestjs/testing';
import { GovernmentController } from './government.controller';

describe('GovernmentController', () => {
  let controller: GovernmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GovernmentController],
    }).compile();

    controller = module.get<GovernmentController>(GovernmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
