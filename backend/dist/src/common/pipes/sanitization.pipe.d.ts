import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class SanitizationPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata): any;
    private sanitizeObject;
    private sanitizeValue;
    private sanitizeString;
}
export declare function Sanitize(): PropertyDecorator;
export declare function ToUpperCase(): PropertyDecorator;
