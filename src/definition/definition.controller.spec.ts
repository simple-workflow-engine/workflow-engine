import { Test, TestingModule } from '@nestjs/testing';
import { DefinitionController } from './definition.controller';

describe('DefinitionController', () => {
  let controller: DefinitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefinitionController],
    }).compile();

    controller = module.get<DefinitionController>(DefinitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
