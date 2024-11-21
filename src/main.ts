import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT');
  const CLIENT_PORT = configService.get<number>('CLIENT_PORT');
  const HOST = configService.get<string>('HOST');

  app.enableCors({
    credentials: true,
    origin: [
      `${HOST}`,
      `${HOST}:${CLIENT_PORT}`,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    allowedHeaders: [
      'Access-Control-Allow-Credentials',
      'Authorization',
      'Content-Type',
      'Accept',
      'X-Requested-With',
      'Origin',
    ],
  });
  app.use(cookieParser());

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Filling System API')
      .setDescription('Filling System Api Description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: false }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(PORT, () => {
    Logger.log(`Port: ${PORT}`);
  });
}
bootstrap();
