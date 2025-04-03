import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  // Enhanced CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : [process.env.FRONTEND_URL || 'http://localhost:5173'];
  
  logger.log(`CORS enabled for origins: ${corsOrigins.join(', ')}`);
  
  app.enableCors({
    origin: corsOrigins,
    methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS || 'Content-Type, Accept, Authorization',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400'), // 24 hours in seconds
  });
  
  // Global exception filter with logger
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Test Vista API')
    .setDescription('The Test Vista API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Session configuration
  app.use(
    session({
      secret: 'your-secret-key', // Use environment variable in production
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
