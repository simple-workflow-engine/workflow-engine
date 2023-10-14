import { Test, TestingModule } from '@nestjs/testing';
import { DefinitionService } from './definition.service';

describe('DefinitionService', () => {
  let service: DefinitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefinitionService],
    }).compile();

    service = module.get<DefinitionService>(DefinitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
