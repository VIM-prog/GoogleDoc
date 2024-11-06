import { Controller, Delete, Get, Param } from '@nestjs/common';
import { GoogleDriveService } from './google-docs.service';

@Controller('google-drive')
export class GoogleDriveController {
  constructor(private googleDriveService: GoogleDriveService) {}

  @Get('documents')
  async getDocuments() {
    const documents = await this.googleDriveService.listDocuments();
    return documents;
  }

  @Get('document/:fileId')
  async getDocument(@Param('fileId') fileId: string) {
    return this.googleDriveService.getFileById(fileId);
  }

  @Get('documents/:email')
  async getFiles(@Param('email') email: string) {
    return this.googleDriveService.getFilesSharedWithEmail(email);
  }

  @Delete('documents/access/:email')
  async deleteAllAccess(@Param('email') email: string) {
    await this.googleDriveService.deleteAllAccess(email);
    return { message: 'Доступ удален' };
  }

  @Delete('document/access/:email/:fileId')
  async deleteAccess(@Param('email') email: string, @Param('fileId') fileId: string,) {
      await this.googleDriveService.deleteAccessByEmailAndFileId(email, fileId);
      return { message: 'Доступ удален' };
  }
}
