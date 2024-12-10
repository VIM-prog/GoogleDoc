import { IsEmail, IsOptional, IsString } from 'class-validator';

export class GoogleSearchEmailDto {
  @IsEmail()
  email: string;
  @IsOptional()
  @IsString()
  driveId?: string;
  @IsOptional()
  @IsString()
  fileId?: string;
}
