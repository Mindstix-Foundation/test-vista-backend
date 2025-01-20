import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  // Enable CORS
  app.enableCors();
  
  // Global exception filter with logger
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      errorHttpStatusCode: 400,
      exceptionFactory: (errors) => {
        const messages = errors.map(error => ({
          field: error.property,
          message: Object.values(error.constraints).join(', '),
        }));
        return new BadRequestException(messages);
      },
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Board Management API')
    .setDescription('API for managing digital boards and addresses')
    .setVersion('1.0')
    .addTag('addresses')
    .addTag('boards')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
