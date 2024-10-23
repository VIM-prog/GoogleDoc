import { Test, TestingModule } from '@nestjs/testing';
import { GoogleDocsService } from './google-docs.service';

describe('GoogleDocsService', () => {
  let service: GoogleDocsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleDocsService],
    }).compile();

    service = module.get<GoogleDocsService>(GoogleDocsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
