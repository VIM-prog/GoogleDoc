import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly drive;

  constructor(private configService: ConfigService) {
    const serviceAccountKey = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY');

    if (!serviceAccountKey || typeof serviceAccountKey !== 'string') {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY не был инициализирован или его тип не верен');
    }

    try {

      const credentials = JSON.parse(serviceAccountKey);

      const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'], 
      });

      this.drive = google.drive({ version: 'v3', auth });
    } catch (error) {
      this.logger.error(`Failed to initialize Google Drive service: ${error.message}`, error.stack);
      throw new Error('Провал загрузки');
    }
  }

  async listDocuments() {
    try {
      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.document'",
        fields: 'nextPageToken, files(id, name)',
      });
      return response.data.files;
    } catch (error) {
      this.logger.error(`Failed to list documents: ${error.message}`, error.stack);
      throw new Error('Провал загрузки документов');
    }
  }
}