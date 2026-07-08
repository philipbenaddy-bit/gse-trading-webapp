import { CanActivate, ExecutionContext } from '@nestjs/common';
import { RateLimiterService } from '../services/rate-limiter.service';
export declare class AiRateLimitGuard implements CanActivate {
    private readonly rateLimiterService;
    private readonly logger;
    constructor(rateLimiterService: RateLimiterService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
