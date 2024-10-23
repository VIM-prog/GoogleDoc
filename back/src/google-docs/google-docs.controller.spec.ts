import { Test, TestingModule } from '@nestjs/testing';
import { GoogleDocsController } from './google-docs.controller';

describe('GoogleDocsController', () => {
  let controller: GoogleDocsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleDocsController],
    }).compile();

    controller = module.get<GoogleDocsController>(GoogleDocsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
