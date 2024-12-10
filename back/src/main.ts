import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new transports.Console({
          format: format.combine(
            format.cli(),
            format.timestamp(),
            format.printf((info) => {
              return `${info.level}: ${info.timestamp}${info.message}`;
            }),
          ),
        }),
      ],
    }),
  });
  const config = new DocumentBuilder()
    .setTitle('Drive Access')
    .setDescription('The drive API')
    .setVersion('2.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const host = configService.get<string>('HOST') || 'localhost:3000';
  const port = configService.get<number>('PORT') || 4000;

  if (nodeEnv === 'development') {
    app.enableCors({
      origin: host,
      methods: ['GET', 'POST'],
      credentials: true,
    });
    await app.listen(port);
  }
}
bootstrap();
