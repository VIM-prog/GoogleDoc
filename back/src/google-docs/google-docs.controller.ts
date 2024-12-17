import { Controller, Delete, Get, Param } from '@nestjs/common';
import { GoogleDriveService } from './google-docs.service';
import { GoogleSearchEmailDto } from './dto/google-search-email.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  operation,
  params,
  statusesError,
  statusesOk,
} from './swagger-description';

@Controller('google-drive')
export class GoogleDriveController {
  constructor(private googleDriveService: GoogleDriveService) {}

  @ApiOperation(operation.drives)
  @ApiResponse(statusesOk.drives)
  @ApiResponse(statusesError.unauthorized)
  @ApiResponse(statusesError.inside)
  @Get('drives')
  async getDrives() {
    return await this.googleDriveService.listDrives();
  }

  @ApiOperation(operation.docs)
  @ApiResponse(statusesOk.docs)
  @ApiResponse(statusesError.unauthorized)
  @ApiResponse(statusesError.inside)
  @Get('documents')
  async getDoc() {
    return await this.googleDriveService.getFiles();
  }

  @ApiOperation(operation.docsWithEmail)
  @ApiResponse(statusesOk.docsWithEmail)
  @ApiResponse(statusesError.unauthorized)
  @ApiResponse(statusesError.inside)
  @ApiParam(params.email)
  @Get('documents/:email')
  async getDocEmail(@Param() dto: GoogleSearchEmailDto) {
    return this.googleDriveService.getFiles(dto.email);
  }

  @ApiOperation(operation.drivesWithEmail)
  @ApiResponse(statusesOk.drivesWithEmail)
  @ApiResponse(statusesError.unauthorized)
  @ApiResponse(statusesError.inside)
  @ApiParam(params.email)
  @Get('drive/:email')
  async getDrivesEmail(@Param() dto: GoogleSearchEmailDto) {
    return this.googleDriveService.listDrives(dto.email);
  }

  @ApiOperation(operation.deleteOne)
  @ApiResponse(statusesOk.deleteOne)
  @ApiResponse(statusesError.inheritedPerm)
  @ApiResponse(statusesError.unauthorized)
  @ApiResponse(statusesError.inside)
  @ApiParam(params.email)
  @ApiParam(params.fileId)
  @Delete('document/access/:email/:fileId')
  async deleteAccess(@Param() dto: GoogleSearchEmailDto) {
    await this.googleDriveService.deleteOneAccess(dto.email, dto.fileId);
    return { message: 'Доступ удален' };
  }

  @ApiOperation(operation.deletePermDrive)
  @ApiResponse(statusesOk.deletePermDrive)
  @ApiResponse(statusesError.unauthorized)
  @ApiResponse(statusesError.inside)
  @ApiParam(params.email)
  @ApiParam(params.driveId)
  @Delete('drive/access/:email/:driveId')
  async deleteAllAccess(@Param() dto: GoogleSearchEmailDto) {
    await this.googleDriveService.deleteAccessDisk(dto.driveId, dto.email);
    return { message: 'Доступ удален' };
  }

  //todo разобраться нужно ли это и не проще ли загружать отдельными блоками
  /*@Get('all')
  async getData() {
    return [await this.getDrives(), await this.getDoc()];
  }
  @Get('all/:email')
  async getDataEmail(@Param() dto: GoogleSearchEmailDto) {
    return [await this.getDisk(dto), await this.getAllFiles(dto)];
  }*/

  @Delete('allAccess/:email')
  @ApiOperation(operation.deleteAllPerm)
  @ApiResponse(statusesOk.deleteAllPerm)
  @ApiResponse(statusesError.unauthorized)
  @ApiResponse(statusesError.inside)
  @ApiParam(params.email)
  async deleteAllAccessAllDisks(@Param() dto: GoogleSearchEmailDto) {
    await this.googleDriveService.deleteAccessAllDisks(dto.email);
    return { message: 'Доступ удален' };
  }
}
