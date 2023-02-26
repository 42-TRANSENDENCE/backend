import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000); // 환경변수로 설정하게끔 나중에 바꾸자.
}
bootstrap();
