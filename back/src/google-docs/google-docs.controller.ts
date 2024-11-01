import { Controller, Get, Param } from '@nestjs/common';
import { GoogleDriveService } from './google-docs.service';

@Controller('google-drive')
export class GoogleDriveController {
  constructor(private googleDriveService: GoogleDriveService) {}

  @Get('documents')
  async getDocuments() {
    const documents = await this.googleDriveService.listDocuments();
    return documents;
  }

  @Get('documents/:email')
  async getFiles(@Param('email') email: string) {
    return this.googleDriveService.getFilesSharedWithEmail(email);
  }
}