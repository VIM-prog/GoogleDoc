import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drive_v3, google } from 'googleapis';

@Injectable()
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private readonly logger = new Logger(GoogleDriveService.name);
  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('KEY');
    if (!key) {
      throw new Error('ключ не был инициализирован');
    }
    try {
      const credentials = JSON.parse(key);
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
      );
    }
  }

  /**
   * Получение дисков
   */
  async listDrives() {
    try {
      const res = await this.drive.drives.list({
        fields: 'drives(id, name)',
      });
      const drives = res.data.drives;
      if (!drives || drives.length === 0) {
        this.logger.log('Нет доступных дисков');
        return [];
      }
      return drives;
    } catch (error) {
      this.logger.error(`Провал загрузки дисков: ${error.message}`);
    }
  }

  /**
   * Строительство пути
   * @param file - файл, к которому строится путь
   * @private - используется только внутри сервиса
   */
  private async buildFilePath(file: drive_v3.Schema$File) {
    let path = file.name;
    let parentId = file.parents ? file.parents[0] : null;
    try {
      while (parentId) {
        const parent = await this.drive.files.get({
          fileId: parentId,
          supportsAllDrives: true,
          fields: 'id, name, parents',
        });
        if (parent.data.name) {
          path = `${parent.data.name}/${path}`;
        }
        parentId = parent.data.parents ? parent.data.parents[0] : null;
      }
      return path;
    } catch {
      return null;
    }
  }

  /**
   * Получение файлов с конкретного диска
   * @param driveId - id диска
   */
  async getFiles(driveId?: string) {
    try {
      const params: any = {
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        q: `trashed = false`,
        fields: 'nextPageToken, files(id, name, parents, mimeType)',
      };
      if (driveId) {
        params.driveId = driveId;
        params.corpora = 'drive';
      } else {
        params.corpora = 'allDrives';
      }
      const res = await this.drive.files.list(params);
      const files = res.data.files;
      if (!files || files.length === 0) {
        this.logger.log(`На диске ${driveId} нет файлов.`);
        return [];
      }
      return await Promise.all(
        files.map(async (file) => {
          const path = await this.buildFilePath(file);
          const fileType = this.getFileType(file.mimeType);
          return { ...file, fileType, path };
        }),
      );
    } catch (error) {
      this.logger.error(
        `Ошибка при загрузке файлов с диска ${driveId}: ${error.message}`,
      );
    }
  }

  /**
   * Получение файлов, к которым имеет доступ пользователь
   * @param email
   * @param driveId
   */
  async getFilesSharedWithEmail(email: string, driveId?: string) {
    try {
      const params: any = {
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        q: `'${email}' in readers and trashed = false`,
        fields: 'nextPageToken, files(id, name, parents, mimeType)',
      };
      if (driveId) {
        params.driveId = driveId;
        params.corpora = 'drive';
      } else {
        params.corpora = 'allDrives';
      }
      const res = await this.drive.files.list(params);
      const files = res.data.files;
      return await Promise.all(
        files.map(async (file) => {
          const path = await this.buildFilePath(file);
          const fileType = this.getFileType(file.mimeType);
          return { ...file, fileType, path };
        }),
      );
    } catch (error) {
      this.logger.error(`Ошибка получения файлов по email:' ${error.message}`);
    }
  }

  /**
   * Удаление доступа к одному файлу
   * @param email - email пользователя
   * @param fileId - id файла, к которому мы хотим удалить доступ
   * @private
   */
  async deleteOneAccess(email: string, fileId: string) {
    const searchEmail = email.toLowerCase();
    const perms = await this.drive.permissions.list({
      fileId: fileId,
      fields: 'permissions(id, emailAddress, role)',
      supportsAllDrives: true,
    });
    const permissionsList = perms.data.permissions;
    const perm = permissionsList.find(
      (p) => p.emailAddress.toLowerCase() === searchEmail,
    );
    if (perm) {
      try {
        await this.drive.permissions.delete({
          fileId: fileId,
          permissionId: perm.id,
          supportsAllDrives: true,
        });
      } catch (error) {
        throw new BadRequestException(`${error.message}`);
      }
    }
  }

  /**
   * Удаление доступа к диску и файлам, которые находятся на нем
   * @param driveId - id диска, к которому хотим удалить доступ
   * @param email - email пользователя
   */
  async deleteAccessDisk(driveId: string, email: string) {
    try {
      await this.deleteOneAccess(email, driveId);
    } catch (error) {
      this.logger.error(`Ошибка удаления доступа к диску: ${error.message}`);
    }
  }

  /**
   * Удаления пользователя ко всем файлам и дискам
   * @param email - email пользователя
   */
  async deleteAccessAllDisks(email: string) {
    try {
      const drives = await this.listDrives();
      for (const drive of drives) {
        await this.deleteOneAccess(email, drive.id);
      }
      const files = await this.getFilesSharedWithEmail(email);
      for (const file of files) {
        await this.deleteOneAccess(email, file.id);
      }
    } catch (error) {
      this.logger.error(`Ошибка удаления доступа: ${error.message}`);
    }
  }
  /**
   * Преобразование гугл типа файла в более привычный
   * @param mimeType - гугл тип файла
   * @private - используется только внутри сервиса
   */
  private getFileType(mimeType: string): string {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return 'folder';
    } else if (mimeType.startsWith('application/vnd.google-apps')) {
      return 'document';
    } else if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('application/pdf')) {
      return 'pdf';
    } else if (mimeType.startsWith('application/x-zip-compressed')) {
      return 'zip';
    } else if (
      mimeType.startsWith(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      )
    ) {
      return 'powerpoint';
    } else if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return 'excel';
    } else {
      return 'file';
    }
  }
}
