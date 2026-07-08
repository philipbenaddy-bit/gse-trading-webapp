import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { plainToClass, Transform } from 'class-transformer';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') {
      return this.sanitizeValue(value);
    }

    // Recursively sanitize object properties
    return this.sanitizeObject(value);
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return this.sanitizeValue(obj);
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    return value;
  }

  private sanitizeString(str: string): string {
    if (!str) return str;

    // Trim whitespace
    str = str.trim();

    // Remove null bytes
    str = str.replace(/\0/g, '');

    // Basic XSS prevention - remove script tags and javascript: protocols
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/javascript:/gi, '');
    str = str.replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=

    // Remove HTML tags (basic sanitization)
    str = str.replace(/<[^>]*>/g, '');

    // Decode HTML entities to prevent double encoding attacks
    str = str.replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&amp;/g, '&')
             .replace(/&quot;/g, '"')
             .replace(/&#x27;/g, "'");

    return str;
  }
}

// Decorator for automatic string trimming and sanitization
export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim().replace(/\0/g, '');
    }
    return value;
  });
}

// Decorator for uppercase transformation (useful for stock symbols)
export function ToUpperCase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toUpperCase().trim();
    }
    return value;
  });
}