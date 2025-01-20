import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Log the error
    this.logger.error(
      `Error processing ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    // Get the response body
    let responseBody: any;
    if (exception instanceof HttpException) {
      responseBody = exception.getResponse();
    } else {
      responseBody = {
        statusCode: status,
        message: 'Internal server error',
      };
    }

    // Ensure consistent response format
    response.status(status).json(responseBody);
  }
} 