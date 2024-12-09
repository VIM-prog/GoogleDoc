import { IsString } from 'class-validator';

export class GoogleSearchDto {
  @IsString()
  driveId: string;
}
