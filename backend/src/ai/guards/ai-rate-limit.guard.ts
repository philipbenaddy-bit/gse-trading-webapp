import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RateLimiterService } from '../services/rate-limiter.service';

/**
 * AI Rate Limit Guard
 *
 * NestJS guard that checks per-user rate limits before allowing
 * AI endpoint requests to proceed. Returns 429 with rate limit
 * info when the user has exceeded their hourly or daily quota.
 *
 * Requirements: 5.1, 5.2, 5.3
 */
@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AiRateLimitGuard.name);

  constructor(private readonly rateLimiterService: RateLimiterService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      // If no user is present (shouldn't happen behind JwtAuthGuard), allow through
      // and let the controller handle the auth error
      return true;
    }

    const userId = user.id;
    const rateLimitInfo = await this.rateLimiterService.checkLimit(userId);

    if (rateLimitInfo.limitExceeded) {
      const message =
        rateLimitInfo.limitExceeded === 'hourly'
          ? `You've reached the hourly limit of 30 AI requests. Try again in ${rateLimitInfo.resetInSeconds}s.`
          : `You've reached the daily limit of 100 AI requests. Try again in ${rateLimitInfo.resetInSeconds}s.`;

      this.logger.warn(
        `Rate limit exceeded for user ${userId}: ${rateLimitInfo.limitExceeded} (reset in ${rateLimitInfo.resetInSeconds}s)`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message,
          rateLimitInfo,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
