import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  const port = app.get(ConfigService).get<number>('PORT', 3002);
  await app.listen(port);
  Logger.log(`Schedule Service ready at http://localhost:${port}/graphql`, 'Bootstrap');
}
bootstrap();
