import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleSearchDto {
  @IsString()
  @ApiProperty()
  driveId: string;
}
