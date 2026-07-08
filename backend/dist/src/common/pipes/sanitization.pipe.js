"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizationPipe = void 0;
exports.Sanitize = Sanitize;
exports.ToUpperCase = ToUpperCase;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
let SanitizationPipe = class SanitizationPipe {
    transform(value, metadata) {
        if (!value || typeof value !== 'object') {
            return this.sanitizeValue(value);
        }
        return this.sanitizeObject(value);
    }
    sanitizeObject(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = this.sanitizeObject(value);
            }
            return sanitized;
        }
        return this.sanitizeValue(obj);
    }
    sanitizeValue(value) {
        if (typeof value === 'string') {
            return this.sanitizeString(value);
        }
        return value;
    }
    sanitizeString(str) {
        if (!str)
            return str;
        str = str.trim();
        str = str.replace(/\0/g, '');
        str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        str = str.replace(/javascript:/gi, '');
        str = str.replace(/on\w+\s*=/gi, '');
        str = str.replace(/<[^>]*>/g, '');
        str = str.replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'");
        return str;
    }
};
exports.SanitizationPipe = SanitizationPipe;
exports.SanitizationPipe = SanitizationPipe = __decorate([
    (0, common_1.Injectable)()
], SanitizationPipe);
function Sanitize() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            return value.trim().replace(/\0/g, '');
        }
        return value;
    });
}
function ToUpperCase() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            return value.toUpperCase().trim();
        }
        return value;
    });
}
//# sourceMappingURL=sanitization.pipe.js.map