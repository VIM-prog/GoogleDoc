import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drive_v3, google } from 'googleapis';

@Injectable()
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private readonly logger = new Logger(GoogleDriveService.name);
  constructor(public configService: ConfigService) {
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
   * Получение доступных дисков
   * @private
   */
  private async listIdDrives() {
    try {
      const res = await this.drive.drives.list({
        fields: 'drives(id, name)',
      });
      return res.data.drives;
    } catch (error) {
      this.logger.error(`Провал загрузки дисков: ${error.message}`);
    }
  }

  /**
   * Диски доступные нам или пользователю (форматирование: id, name, role)
   * @param email - email пользователя
   */
  async listDrives(email?: string) {
    let searchEmail: string;
    if (email) {
      searchEmail = email.toLowerCase();
    } else {
      const key = this.configService.get<string>('KEY');
      const credentials = JSON.parse(key);
      const myEmail = credentials.client_email;
      searchEmail = myEmail.toLowerCase();
    }
    const drives = await this.listIdDrives();
    let listDrive = [];
    for (const drive of drives) {
      const perms = await this.drive.permissions.list({
        fileId: drive.id,
        fields: 'permissions(id, emailAddress, role)',
        supportsAllDrives: true,
      });
      const permissionsList = perms.data.permissions;
      const perm = permissionsList.find(
        (p) => p.emailAddress.toLowerCase() === searchEmail,
      );
      if (perm) {
        listDrive = listDrive.concat({
          id: drive.id,
          name: drive.name,
          role: perm.role,
        });
      }
    }
    return listDrive;
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
   * Получение файлов (без файлов на дисках, к которым пользователь имеет доступ)
   * @param email - email пользователя
   */
  async getFiles(email?: string) {
    let drives: string;
    let q: string;
    if (email) {
      drives = (await this.listDrives(email))
        .map((drive) => `'${drive.id}'`)
        .join(' or ');
      q = `'${email}' in readers and (trashed = false) and not ${drives} in parents`;
    } else {
      drives = (await this.listDrives())
        .map((drive) => `'${drive.id}'`)
        .join(' or ');
      q = `(trashed = false) and not ${drives} in parents`;
    }
    let nextPageToken: string;
    let allFiles = [];
    do {
      const res = await this.drive.files.list({
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        q: q,
        pageToken: nextPageToken || null,
        fields: 'nextPageToken, files(id, name, parents, mimeType)',
        pageSize: 100,
      });
      const files = res.data.files;
      if (!files || files.length === 0) {
        return [];
      }
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          const path = await this.buildFilePath(file);
          const fileType = this.getFileType(file.mimeType);
          return { ...file, fileType, path };
        }),
      );
      nextPageToken = res.data.nextPageToken;
      allFiles = allFiles.concat(processedFiles);
    } while (nextPageToken);
    return allFiles;
  }

  /**
   * Удаление доступа к одному файлу (Работает только если не имеет доступ к диску или родительскому элементу)
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
      const files = await this.getFiles(email);
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
