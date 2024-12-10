import { Controller, Delete, Get, Param } from '@nestjs/common';
import { GoogleDriveService } from './google-docs.service';
import { GoogleSearchEmailDto } from './dtos/google-search-email.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GoogleSearchDto } from './dtos/google-search.dto';

@Controller('google-drive')
export class GoogleDriveController {
  constructor(private googleDriveService: GoogleDriveService) {}

  @Get('drives')
  @ApiOperation({
    summary: 'Получить список дисков Google Drive',
    description: 'Возвращает список всех дисков, которые доступны вам',
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращение списка дисков',
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка аутентификации',
  })
  @ApiResponse({
    status: 500,
    description: 'Внутренняя ошибка сервера',
  })
  async getDrives() {
    return await this.googleDriveService.listDrives();
  }

  @Get('documents')
  @ApiOperation({
    summary: 'Получить документы',
    description: 'Возвращает список всех документов, которые доступны вам',
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращение списка документов',
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка аутентификации',
  })
  @ApiResponse({
    status: 500,
    description: 'Внутренняя ошибка сервера',
  })
  async getDoc() {
    return await this.googleDriveService.getFiles();
  }

  @ApiOperation({
    summary: 'Получить список документов на диске',
    description:
      'Возвращает список всех документов по определенному диску, которые доступны вам',
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращение списка документов',
    //type: GoogleSearchDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка аутентификации',
  })
  @ApiResponse({
    status: 500,
    description: 'Внутренняя ошибка сервера',
  })
  @ApiParam({
    name: 'driveId',
    description: 'Введите id диска, чтобы просмотреть файлы на этом диске',
  })
  @Get(':driveId/documents')
  async getDocDrives(@Param() dto: GoogleSearchDto) {
    return await this.googleDriveService.getFiles(dto.driveId);
  }

  // getData() {
  //   return {
  //     drives: this.googleDriveService.getDisks(dto.driveId),
  //     files: this.googleDriveService.getFiles(dto.driveId),
  //   }
  // }
  //

  @Get('documents/:email')
  @ApiOperation({
    summary: 'Получить список документов другого пользователя',
    description:
      'Возвращает список всех документов которые доступны другому пользователю',
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращение списка всех документов',
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка аутентификации',
  })
  @ApiResponse({
    status: 500,
    description: 'Внутренняя ошибка сервера',
  })
  @ApiParam({
    name: 'email',
    description:
      'Введите email, чтобы посмотреть, к каким файлам он имеет доступ',
  })
  async getAllFiles(@Param() dto: GoogleSearchEmailDto) {
    return this.googleDriveService.getFilesSharedWithEmail(dto.email);
  }

  @Get('drive/:email')
  @ApiParam({
    name: 'email',
    description:
      'Введите email, чтобы посмотреть, к каким файлам он имеет доступ',
  })
  async getDisk(@Param() dto: GoogleSearchEmailDto) {
    return this.googleDriveService.listDriveEmail(dto.email);
  }

  @Get('documents/:email/:driveId')
  @ApiOperation({
    summary: 'Получить список документов другого пользователя на диске',
    description:
      'Возвращает список всех документов которые доступны другому пользователю на определенном диске',
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращение списка документов',
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка аутентификации',
  })
  @ApiResponse({
    status: 500,
    description: 'Внутренняя ошибка сервера',
  })
  @ApiParam({
    name: 'email',
    description:
      'Введите email, чтобы посмотреть, к каким файлам он имеет доступ',
  })
  @ApiParam({
    name: 'driveId',
    description: 'Введите id диска, чтобы сузить поиск',
  })
  async getFiles(@Param() dto: GoogleSearchEmailDto) {
    return this.googleDriveService.getFilesSharedWithEmail(
      dto.email,
      dto.driveId,
    );
  }

  @Delete('document/access/:email/:fileId')
  @ApiOperation({
    summary: 'Удаление доступа к файлу',
    description:
      'Удаляет доступ к файлу, к которому имеет право доступ другой пользователь',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешное удаление доступа',
  })
  @ApiResponse({
    status: 400,
    description: 'Невозможно удалить наследованное разрешение',
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка аутентификации',
  })
  @ApiResponse({
    status: 500,
    description: 'Внутренняя ошибка сервера',
  })
  @ApiParam({
    name: 'email',
    description: 'Введите email, у которого вы хотите забрать доступ',
  })
  @ApiParam({
    name: 'fileId',
    description: 'Введите id файла, к которому заберете доступ',
  })
  async deleteAccess(@Param() dto: GoogleSearchEmailDto) {
    await this.googleDriveService.deleteOneAccess(dto.email, dto.fileId);
    return { message: 'Доступ удален' };
  }

  @Delete('drive/access/:driveId/:email')
  @ApiOperation({
    summary: 'Удаление доступа к диску',
    description:
      'Удаляет доступ к диску, к которому имеет право доступ другой пользователь',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешное удаление доступа',
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка аутентификации',
  })
  @ApiResponse({
    status: 500,
    description: 'Внутренняя ошибка сервера',
  })
  @ApiParam({
    name: 'email',
    description: 'Введите email, у которого вы хотите забрать доступ',
  })
  @ApiParam({
    name: 'driveId',
    description: 'Введите id диска, к которому заберете доступ',
  })
  async deleteAllAccess(@Param() dto: GoogleSearchEmailDto) {
    await this.googleDriveService.deleteAccessDisk(dto.driveId, dto.email);
    return { message: 'Доступ удален' };
  }

  @Delete('all/access/:email')
  @ApiOperation({
    summary: 'Удаление доступа ко всему',
    description:
      'Удаляет доступ ко всем файлам и дискам, к которому имеет право доступ другой пользователь',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешное удаление доступа',
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка аутентификации',
  })
  @ApiResponse({
    status: 500,
    description: 'Внутренняя ошибка сервера',
  })
  @ApiParam({
    name: 'email',
    description: 'Введите email, у которого вы хотите забрать доступ ко всему',
  })
  async deleteAllAccessAllDisks(@Param() dto: GoogleSearchEmailDto) {
    await this.googleDriveService.deleteAccessAllDisks(dto.email);
    return { message: 'Доступ удален' };
  }
}
