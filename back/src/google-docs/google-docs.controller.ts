import { Controller, Delete, Get, Param } from '@nestjs/common';
import { GoogleDriveService } from './google-docs.service';

@Controller('google-drive')
export class GoogleDriveController {
  constructor(private googleDriveService: GoogleDriveService) {}

  @Get('drives')
  async getDrives() {
    return await this.googleDriveService.listDrives();
  }

  @Get(':driveId/documents')
  async getDocDrives(@Param('driveId') driveId: string) {
    return await this.googleDriveService.getFilesFromDrive(driveId);
  }

  @Get('documents/:driveId/:email')
  async getFiles(
    @Param('email') email: string,
    @Param('driveId') driveId: string,
  ) {
    return this.googleDriveService.getFilesSharedWithEmail(driveId, email);
  }

  @Delete('documents/access/:driveId/:email')
  async deleteAllAccess(
    @Param('driveId') driveId: string,
    @Param('email') email: string,
  ) {
    await this.googleDriveService.deleteAllAccess(driveId, email);
    return { message: 'Доступ удален' };
  }

  @Delete('document/access/:email/:fileId')
  async deleteAccess(
    @Param('email') email: string,
    @Param('fileId') fileId: string,
  ) {
    await this.googleDriveService.deleteOneAccess(email, fileId);
    return { message: 'Доступ удален' };
  }
}
