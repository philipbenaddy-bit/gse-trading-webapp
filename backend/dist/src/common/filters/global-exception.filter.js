"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const correlationId = this.generateCorrelationId();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';
        let details = null;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                message = exceptionResponse.message || exception.message;
                error = exceptionResponse.error || error;
                details = exceptionResponse.details;
            }
        }
        else if (exception instanceof typeorm_1.QueryFailedError) {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = 'Database operation failed';
            error = 'Database Error';
            if (exception.message.includes('duplicate key')) {
                message = 'Resource already exists';
                status = common_1.HttpStatus.CONFLICT;
            }
            else if (exception.message.includes('foreign key')) {
                message = 'Referenced resource not found';
                status = common_1.HttpStatus.BAD_REQUEST;
            }
            this.logger.error(`Database error [${correlationId}]:`, exception.message);
        }
        else if (exception instanceof Error) {
            message = process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : exception.message;
            this.logger.error(`Unhandled error [${correlationId}]:`, exception.stack);
        }
        else {
            this.logger.error(`Unknown exception [${correlationId}]:`, exception);
        }
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            error,
            correlationId,
        };
        if (process.env.NODE_ENV !== 'production' || status < 500) {
            errorResponse.details = details;
        }
        this.logger.error(`${request.method} ${request.url} - ${status} - ${message} [${correlationId}]`, exception instanceof Error ? exception.stack : exception);
        response.setHeader('X-Correlation-ID', correlationId);
        response.status(status).json(errorResponse);
    }
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map