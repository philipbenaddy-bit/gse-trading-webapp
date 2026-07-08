import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  details?: any;
  correlationId: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate correlation ID for tracking
    const correlationId = this.generateCorrelationId();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = null;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || error;
        details = (exceptionResponse as any).details;
      }
    } else if (exception instanceof QueryFailedError) {
      // Database errors
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      error = 'Database Error';
      
      // Handle specific database errors
      if (exception.message.includes('duplicate key')) {
        message = 'Resource already exists';
        status = HttpStatus.CONFLICT;
      } else if (exception.message.includes('foreign key')) {
        message = 'Referenced resource not found';
        status = HttpStatus.BAD_REQUEST;
      }
      
      // Log full database error for debugging (but don't expose to client)
      this.logger.error(`Database error [${correlationId}]:`, exception.message);
    } else if (exception instanceof Error) {
      // Generic errors
      message = process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : exception.message;
      
      this.logger.error(`Unhandled error [${correlationId}]:`, exception.stack);
    } else {
      // Unknown exceptions
      this.logger.error(`Unknown exception [${correlationId}]:`, exception);
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      correlationId,
    };

    // Add details only in development or for client errors
    if (process.env.NODE_ENV !== 'production' || status < 500) {
      errorResponse.details = details;
    }

    // Log error with correlation ID
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message} [${correlationId}]`,
      exception instanceof Error ? exception.stack : exception,
    );

    // Set correlation ID header for client tracking
    response.setHeader('X-Correlation-ID', correlationId);

    response.status(status).json(errorResponse);
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}