import { Module } from '@nestjs/common';
import { GoogleDriveService } from './google-docs.service';
import { GoogleDriveController } from './google-docs.controller';

@Module({
  controllers: [GoogleDriveController],
  providers: [GoogleDriveService],
})
export class GoogleDriveModule {}
