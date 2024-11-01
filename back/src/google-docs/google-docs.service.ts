import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drive_v3, google } from 'googleapis';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: drive_v3.Drive;

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
      this.logger.error(`Провал загрузки Google Drive service: ${error.message}`, error.stack);
      throw new Error('Провал загрузки');
    }
  }
  //Загрузка документов
  async listDocuments() {
    try {
      const response = await this.drive.files.list({
        fields: 'nextPageToken, files(id, name, parents, mimeType)',
      });

      const files = response.data.files;

      const filesWithPathsAndTypes = await Promise.all(
        files.map(async (file) => {
          const path = await this.buildFilePath(file);
          const fileType = this.getFileType(file.mimeType);
          return { ...file, fileType, path, };
        })
      );

      return filesWithPathsAndTypes;
    } catch (error) {
      this.logger.error(`Провал загрузки документов: ${error.message}`, error.stack);
      throw new Error('Провал');
    }
  }
  //Путь к файлу
  private async buildFilePath(file: drive_v3.Schema$File) {
    let path = file.name;
    let parentId = file.parents ? file.parents[0] : null;

    while (parentId) {
      const parent = await this.drive.files.get({
        fileId: parentId,
        fields: 'id, name, parents',
      });

      if (parent.data.name) {
        path = `${parent.data.name}/${path}`;
      }

      parentId = parent.data.parents ? parent.data.parents[0] : null;
    }

    return path;
  }
  //Получение файлов по email
  async getFilesSharedWithEmail (email: string) 
  {
    try {
      const res = await this.drive.files.list({
        q: `'${email}' in writers or '${email}' in readers`,
        fields: 'nextPageToken, files(id, name, parents, mimeType)',
      });
      return res.data.files;
    }
    catch (error) {
      console.error('Error fetching files:', error);
      throw error; 
    }
  }
  //Тип файла 
  private getFileType(mimeType: string): string {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return 'Folder';
    } else if (mimeType.startsWith('application/vnd.google-apps')) {
      return 'Google Document'; 
    } else if (mimeType.startsWith('image/')) {
      return 'Image';
    } else if (mimeType.startsWith('video/')) {
      return 'Video';
    } else if (mimeType.startsWith('application/pdf')) {
      return 'PDF';
    } else if (mimeType.startsWith('application/x-zip-compressed')){
      return 'ZIP';
    } else {
      return 'File'; 
    }
  }
}