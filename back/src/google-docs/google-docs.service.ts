import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drive_v3, google } from 'googleapis';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: drive_v3.Drive;

  constructor(private configService: ConfigService) {
    const serviceAccountKey = this.configService.get<string>(
      'GOOGLE_SERVICE_ACCOUNT_KEY',
    );

    if (!serviceAccountKey || typeof serviceAccountKey !== 'string') {
      throw new Error(
        'GOOGLE_SERVICE_ACCOUNT_KEY не был инициализирован или его тип не верен',
      );
    }

    try {
      const credentials = JSON.parse(serviceAccountKey);

      const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.resource',
        ],
      });

      this.drive = google.drive({ version: 'v3', auth });
    } catch (error) {
      this.logger.error(
        `Провал загрузки Google Drive service: ${error.message}`,
        error.stack,
      );
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
          return { ...file, fileType, path };
        }),
      );

      return filesWithPathsAndTypes;
    } catch (error) {
      this.logger.error(
        `Провал загрузки документов: ${error.message}`,
        error.stack,
      );
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
  async getFilesSharedWithEmail(email: string) {
    try {
      const res = await this.drive.files.list({
        q: `'${email}' in writers or '${email}' in readers`,
        fields: 'nextPageToken, files(id, name, parents, mimeType)',
      });
      const files = res.data.files;

      const filesWithPathsAndTypes = await Promise.all(
        files.map(async (file) => {
          const path = await this.buildFilePath(file);
          const fileType = this.getFileType(file.mimeType);
          return { ...file, fileType, path };
        }),
      );
      return filesWithPathsAndTypes;
    } catch (error) {
      console.error('Ошибка получения файла по email:', error);
      throw error;
    }
  }
  //Удаление по email доступа ко всем документам
  async deleteAllAccess(email: string) {
    const searchEmail = email.toLowerCase();
    try {
      const files = await this.getFilesSharedWithEmail(email);
      for (const file of files) {
        try {
          const permissions = await this.drive.permissions.list({
            fileId: file.id,
            fields: 'permissions(id, emailAddress, role)',
          });
          const permissionsList = permissions.data.permissions;

          const permission = permissionsList.find(
            (p) => p.emailAddress.toLowerCase() === searchEmail,
          );
          if (permission) {
            await this.drive.permissions.delete({
              fileId: file.id,
              permissionId: permission.id,
            });
          } else {
            console.log(`Разрешение для файла - ${file.name} - не найдено`);
          }
        } catch (err) {
          console.error(
            `Ошибка при удалении доступа к файлу ${file.name}:`,
            err,
          );
        }
      }
    } catch (error) {
      console.error('Ошибка удаления доступа:', error);
      throw error;
    }
  }
  //Получение одного файла
  async getFileById(fileId: string) {
    try {
      const res = await this.drive.files.get({
        fileId,
        fields: 'id, name, parents, mimeType',
      });
      const file = res.data;

      const path = await this.buildFilePath(file);
      const fileType = this.getFileType(file.mimeType);
      return { ...file, fileType, path };
    } catch (error) {
      console.error('Ошибка получения файла по ID:', error);
      throw error;
    }
  }
  // Для удаления доступа к одному файлу
  async deleteAccessByEmailAndFileId(email: string, fileId: string) {
    const searchEmail = email.toLowerCase();
    try {
      const permissions = await this.drive.permissions.list({
        fileId: fileId,
        fields: 'permissions(id, emailAddress, role)',
      });
      const permissionsList = permissions.data.permissions;

      const permission = permissionsList.find(
        (p) => p.emailAddress.toLowerCase() === searchEmail,
      );
      if (permission) {
        try {
          await this.drive.permissions.delete({
            fileId: fileId,
            permissionId: permission.id,
          });
        } catch (err) {
          console.error(
            `Ошибка при удалении доступа к файлу - ${fileId}:`,
            err,
          );
        }
      } else {
        console.log(`Разрешение для файла не найдено`);
      }
    } catch (error) {
      console.error('Ошибка получения разрешений:', error);
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
    } else if (mimeType.startsWith('application/x-zip-compressed')) {
      return 'ZIP';
    } else if (
      mimeType.startsWith(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      )
    ) {
      return 'Microsoft PowerPoint';
    } else if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return 'Microsoft Excel';
    } else {
      return 'File';
    }
  }
}
