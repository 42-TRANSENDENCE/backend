import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const authenticationCookie: SecuritySchemeObject = {
    type: 'apiKey',
    description: '42 Pong JWT Access Token',
    name: 'Authentication',
    in: 'cookie',
  };

  const refreshCookie: SecuritySchemeObject = {
    type: 'apiKey',
    description: '42 Pong JWT Refresh Token',
    name: 'Refresh',
    in: 'cookie',
  };

  const config = new DocumentBuilder()
    .setTitle('42 Pong API')
    .setDescription('42 Pong API description')
    .setVersion('1.0')
    .addCookieAuth('Authentication', authenticationCookie)
    .addCookieAuth('Refresh', refreshCookie)
    .addTag('auth', '인증 API')
    .addTag('users', '사용자 API')
    .addTag('2fa', '2차 인증 API')
    .addTag('users/friends', '친구 API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe());
  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(cookieParser());

  await app.listen(3000);
}
bootstrap();
