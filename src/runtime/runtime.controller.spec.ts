import { Test, TestingModule } from '@nestjs/testing';
import { RuntimeController } from './runtime.controller';

describe('RuntimeController', () => {
  let controller: RuntimeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RuntimeController],
    }).compile();

    controller = module.get<RuntimeController>(RuntimeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
