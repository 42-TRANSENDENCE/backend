import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const customSecuritySchemeObject: SecuritySchemeObject = {
    type: 'http',
    scheme: 'bearer',
    name: 'JWT',
    in: 'header',
  };

  const config = new DocumentBuilder()
    .setTitle('42 Pong API')
    .setDescription('42 Pong API description')
    .setVersion('1.0')
    .addBearerAuth(customSecuritySchemeObject, 'JWT access token')
    .addBearerAuth(customSecuritySchemeObject, 'JWT refresh token')
    .addBearerAuth(customSecuritySchemeObject, '42 access token')
    .addTag('auth', '인증 API')
    .addTag('users', '사용자 API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
