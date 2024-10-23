import { Controller, Get } from '@nestjs/common';
import { GoogleDriveService } from './google-docs.service';

@Controller('google-drive')
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Get('documents')
  async getDocuments() {
    const documents = await this.googleDriveService.listDocuments();
    return documents;
  }
}