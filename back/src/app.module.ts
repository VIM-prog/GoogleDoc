import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleDriveModule } from './google-docs/google-docs.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), GoogleDriveModule],
})
export class AppModule {}
