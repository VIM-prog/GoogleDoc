import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drive_v3, google } from 'googleapis';
import Schema$Drive = drive_v3.Schema$Drive;
import Schema$File = drive_v3.Schema$File;
import Schema$Permission = drive_v3.Schema$Permission;

@Injectable()
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private readonly logger: Logger = new Logger(GoogleDriveService.name);
  constructor(public configService: ConfigService) {
    const key: string = this.configService.get<string>('KEY');
    if (!key) {
      throw new Error('ключ не был инициализирован');
    }
    try {
      const credentials: any = JSON.parse(key);
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
  private async listIdDrives(): Promise<Schema$Drive[]> {
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
   * Получение email сервисного аккаунта
   * @private
   */
  private getServiceAccountEmail(): string {
    const key: string = this.configService.get<string>('KEY');
    const credentials: any = JSON.parse(key);
    return credentials.client_email.toLowerCase();
  }

  /**
   * Получение роли
   * @param email - email пользователя
   * @param fileId - id файла, у которого мы хотим посмотреть разрешения
   * @private
   */
  private async getPerm(
    email: string,
    fileId: string,
  ): Promise<Schema$Permission | undefined> {
    const searchEmail: string = email
      ? email.toLowerCase()
      : this.getServiceAccountEmail();
    const perms = await this.drive.permissions.list({
      fileId: fileId,
      fields: 'permissions(id, emailAddress, role)',
      supportsAllDrives: true,
    });
    const permissionsList: Schema$Permission[] = perms.data.permissions;
    return permissionsList.find(
      (p: Schema$Permission): boolean =>
        p.emailAddress.toLowerCase() === searchEmail,
    );
  }

  /**
   * Диски доступные нам или пользователю (форматирование: id, name, role)
   * @param email - email пользователя
   */
  async listDrives(email?: string): Promise<any> {
    const drives: Schema$Drive[] = await this.listIdDrives();
    let listDrive: any[] = [];
    for (const drive of drives) {
      const perm: Schema$Permission = await this.getPerm(email, drive.id);
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
   * Диски доступные пользователю, на которых google account является владельцем
   * @param email - email пользователя
   */
  async listDrivesEmail(email: string): Promise<any> {
    const drives: any[] = await this.listDrives(email);
    const filteredDrives: any[] = [];
    for (const drive of drives) {
      const perm: Schema$Permission = await this.getPerm(email, drive.id);
      const myPerm: Schema$Permission = await this.getPerm(undefined, drive.id);
      if (myPerm && myPerm.role === 'organizer') {
        filteredDrives.push({
          id: drive.id,
          name: drive.name,
          role: perm.role,
        });
      }
    }
    return filteredDrives;
  }

  /**
   * Строительство пути
   * @param file - файл, к которому строится путь
   * @private - используется только внутри сервиса
   */
  private async buildFilePath(file: drive_v3.Schema$File): Promise<string> {
    let path: string = file.name;
    let parentId: string = file.parents ? file.parents[0] : null;
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
    } catch (error) {
      this.logger.error('Ошибка в построении пути:', error);
    }
  }

  /**
   * Получение документов
   */
  async getFiles(): Promise<any[]> {
    let nextPageToken: string;
    let allFiles: any[] = [];
    do {
      const res = await this.drive.files.list({
        includeItemsFromAllDrives: true,
        supportsTeamDrives: true,
        pageToken: nextPageToken || null,
        fields: 'nextPageToken, files(id, name, parents, mimeType)',
        pageSize: 100,
      });
      const files = res.data.files;
      const filesWithPermissions: any[] = await this.processFiles(files);
      allFiles = allFiles.concat(filesWithPermissions);
      nextPageToken = res.data.nextPageToken;
    } while (nextPageToken);
    return allFiles;
  }

  async getFilesWithEmail(email: string): Promise<any[]> {
    const myDrives: any = await this.listDrives();
    const userDriveIds: any = (await this.listDrives(email)).map(
      (drive: any): any => drive.id,
    );
    const searchDrives: any = myDrives.filter(
      (x: any): boolean => !userDriveIds.includes(x.id),
    );
    let allFiles: any[] = [];
    for (const drive of searchDrives) {
      let nextPageToken: string | null = null;
      do {
        const res = await this.drive.files.list({
          includeItemsFromAllDrives: true,
          corpora: 'drive',
          supportsAllDrives: true,
          pageToken: nextPageToken,
          q: `'${email}' in readers and not '${email}' in owners`,
          fields: 'nextPageToken, files(id, name, parents, mimeType)',
          pageSize: 100,
          driveId: drive.id,
        });
        const files: Schema$File[] = res.data.files || [];
        const filesWithPermissions: any[] = await this.processFiles(
          files,
          email,
        );
        allFiles = allFiles.concat(filesWithPermissions);
        nextPageToken = res.data.nextPageToken;
      } while (nextPageToken);
    }
    return allFiles;
  }

  /**
   * Построение пути и получение роли
   * @param files - передаваемые файлы
   * @param email
   * @private
   */
  private async processFiles(
    files: drive_v3.Schema$File[],
    email?: string,
  ): Promise<any[]> {
    return Promise.all(
      files.map(async (file: Schema$File) => {
        const path: string = await this.buildFilePath(file);
        const fileType: string = this.getFileType(file.mimeType);
        let role: string | null = null;
        try {
          const perm: Schema$Permission = await this.getPerm(email, file.id);
          if (perm) role = perm.role;
        } catch {
          return { ...file, fileType, path };
        }
        return { ...file, fileType, path, role };
      }),
    );
  }
  /**
   * Удаление доступа к одному файлу
   * @param email - email пользователя
   * @param fileId - id файла, к которому мы хотим удалить доступ
   * @private
   */
  async deleteOneAccess(email: string, fileId: string): Promise<void> {
    const perm: Schema$Permission = await this.getPerm(email, fileId);
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
  async deleteAccessDisk(driveId: string, email: string): Promise<void> {
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
  async deleteAccessAllDisks(email: string): Promise<void> {
    try {
      const drives: any[] = await this.listDrives();
      for (const drive of drives) {
        await this.deleteOneAccess(email, drive.id);
      }
      const files: any[] = await this.getFilesWithEmail(email);
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
