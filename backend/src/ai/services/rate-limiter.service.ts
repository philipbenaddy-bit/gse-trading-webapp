import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { RateLimitInfo } from '../interfaces/ai.interfaces';
import {
  RATE_LIMIT_HOURLY,
  RATE_LIMIT_DAILY,
  RATE_LIMIT_WINDOW_HOURLY_SECONDS,
  RATE_LIMIT_WINDOW_DAILY_SECONDS,
  RATE_LIMIT_FLAG_PER_10_MIN,
  RATE_LIMIT_FLAG_PER_12_HOURS,
  REDIS_KEY_RATE_HOURLY,
  REDIS_KEY_RATE_DAILY,
} from '../constants/ai.constants';

/**
 * Rate Limiter Service
 *
 * Enforces per-user AI request rate limits using a Redis sorted set
 * sliding window algorithm. Falls back to in-memory rate limiting
 * when Redis is unavailable.
 *
 * - 30 requests per user per rolling 60-minute window
 * - 100 requests per user per rolling 24-hour window
 * - Flags accounts exceeding abuse thresholds for review
 * - Does not count failed LLM requests against limits
 */
@Injectable()
export class RateLimiterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimiterService.name);
  private redisClient: RedisClientType | null = null;
  private redisAvailable = false;

  /** In-memory fallback: userId -> array of request timestamps (ms) */
  private inMemoryStore: Map<string, number[]> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connectRedis();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch {
        // Ignore disconnect errors during shutdown
      }
    }
  }

  // ── Redis Connection ────────────────────────────────────────────────────────

  private async connectRedis(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    try {
      this.redisClient = createClient({
        socket: { host, port, connectTimeout: 3000 },
      }) as RedisClientType;

      this.redisClient.on('error', (err) => {
        if (this.redisAvailable) {
          this.logger.warn(`Redis connection lost, falling back to in-memory: ${err.message}`);
          this.redisAvailable = false;
        }
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis connected for rate limiting');
        this.redisAvailable = true;
      });

      await this.redisClient.connect();
      this.redisAvailable = true;
    } catch (err) {
      this.logger.warn(
        `Redis unavailable, using in-memory rate limiting: ${err.message}`,
      );
      this.redisAvailable = false;
      this.redisClient = null;
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Checks if a user can make a request without recording it.
   * Returns rate limit info including which limit (if any) is exceeded.
   */
  async checkLimit(userId: string): Promise<RateLimitInfo> {
    if (this.redisAvailable && this.redisClient) {
      return this.checkLimitRedis(userId);
    }
    return this.checkLimitInMemory(userId);
  }

  /**
   * Records a successful AI request for the user.
   * Call this only after the LLM request succeeds.
   */
  async recordRequest(userId: string): Promise<void> {
    const now = Date.now();
    if (this.redisAvailable && this.redisClient) {
      await this.recordRequestRedis(userId, now);
    } else {
      this.recordRequestInMemory(userId, now);
    }
  }

  /**
   * Removes the last recorded request for a user.
   * Used when an LLM request fails so it doesn't count against limits.
   */
  async removeLastRequest(userId: string): Promise<void> {
    if (this.redisAvailable && this.redisClient) {
      await this.removeLastRequestRedis(userId);
    } else {
      this.removeLastRequestInMemory(userId);
    }
  }

  /**
   * Gets the current rate limit status without recording a request.
   * Alias for checkLimit — provides current remaining counts.
   */
  async getRateLimitStatus(userId: string): Promise<RateLimitInfo> {
    return this.checkLimit(userId);
  }

  /**
   * Checks if a user exceeds abuse thresholds:
   * - More than 25 requests in the last 10 minutes
   * - More than 90 requests in the last 12 hours
   */
  async checkAbuseFlags(userId: string): Promise<boolean> {
    if (this.redisAvailable && this.redisClient) {
      return this.checkAbuseFlagsRedis(userId);
    }
    return this.checkAbuseFlagsInMemory(userId);
  }

  // ── Redis Implementation ────────────────────────────────────────────────────

  private getHourlyKey(userId: string): string {
    return `${REDIS_KEY_RATE_HOURLY}:${userId}`;
  }

  private getDailyKey(userId: string): string {
    return `${REDIS_KEY_RATE_DAILY}:${userId}`;
  }

  private async checkLimitRedis(userId: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const hourlyKey = this.getHourlyKey(userId);
    const dailyKey = this.getDailyKey(userId);

    const hourlyWindowStart = now - RATE_LIMIT_WINDOW_HOURLY_SECONDS * 1000;
    const dailyWindowStart = now - RATE_LIMIT_WINDOW_DAILY_SECONDS * 1000;

    try {
      // Remove expired entries and count current entries atomically
      const multi = this.redisClient!.multi();
      multi.zRemRangeByScore(hourlyKey, '-inf', hourlyWindowStart.toString());
      multi.zRemRangeByScore(dailyKey, '-inf', dailyWindowStart.toString());
      multi.zCard(hourlyKey);
      multi.zCard(dailyKey);
      // Get the oldest entry in each window for reset calculation
      multi.zRange(hourlyKey, 0, 0);
      multi.zRange(dailyKey, 0, 0);

      const results = await multi.exec();

      const hourlyCount = results[2] as number;
      const dailyCount = results[3] as number;
      const oldestHourly = results[4] as string[];
      const oldestDaily = results[5] as string[];

      const hourlyRemaining = Math.max(0, RATE_LIMIT_HOURLY - hourlyCount);
      const dailyRemaining = Math.max(0, RATE_LIMIT_DAILY - dailyCount);

      let limitExceeded: 'hourly' | 'daily' | null = null;
      let resetInSeconds = 0;

      if (hourlyCount >= RATE_LIMIT_HOURLY) {
        limitExceeded = 'hourly';
        if (oldestHourly && oldestHourly.length > 0) {
          const oldestTimestamp = parseInt(oldestHourly[0], 10);
          resetInSeconds = Math.ceil(
            (oldestTimestamp + RATE_LIMIT_WINDOW_HOURLY_SECONDS * 1000 - now) / 1000,
          );
        } else {
          resetInSeconds = RATE_LIMIT_WINDOW_HOURLY_SECONDS;
        }
      } else if (dailyCount >= RATE_LIMIT_DAILY) {
        limitExceeded = 'daily';
        if (oldestDaily && oldestDaily.length > 0) {
          const oldestTimestamp = parseInt(oldestDaily[0], 10);
          resetInSeconds = Math.ceil(
            (oldestTimestamp + RATE_LIMIT_WINDOW_DAILY_SECONDS * 1000 - now) / 1000,
          );
        } else {
          resetInSeconds = RATE_LIMIT_WINDOW_DAILY_SECONDS;
        }
      }

      // Ensure resetInSeconds is non-negative
      resetInSeconds = Math.max(0, resetInSeconds);

      return { hourlyRemaining, dailyRemaining, resetInSeconds, limitExceeded };
    } catch (err) {
      this.logger.warn(`Redis checkLimit failed, falling back to in-memory: ${err.message}`);
      this.redisAvailable = false;
      return this.checkLimitInMemory(userId);
    }
  }

  private async recordRequestRedis(userId: string, now: number): Promise<void> {
    const hourlyKey = this.getHourlyKey(userId);
    const dailyKey = this.getDailyKey(userId);
    const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

    try {
      const multi = this.redisClient!.multi();
      // Add timestamp as both score and member (with random suffix for uniqueness)
      multi.zAdd(hourlyKey, { score: now, value: member });
      multi.zAdd(dailyKey, { score: now, value: member });
      // Set TTL on keys to auto-cleanup
      multi.expire(hourlyKey, RATE_LIMIT_WINDOW_HOURLY_SECONDS + 60);
      multi.expire(dailyKey, RATE_LIMIT_WINDOW_DAILY_SECONDS + 60);
      await multi.exec();
    } catch (err) {
      this.logger.warn(`Redis recordRequest failed, falling back to in-memory: ${err.message}`);
      this.redisAvailable = false;
      this.recordRequestInMemory(userId, now);
    }
  }

  private async removeLastRequestRedis(userId: string): Promise<void> {
    const hourlyKey = this.getHourlyKey(userId);
    const dailyKey = this.getDailyKey(userId);

    try {
      const multi = this.redisClient!.multi();
      // Remove the most recent entry (highest score) from both sets
      multi.zRemRangeByRank(hourlyKey, -1, -1);
      multi.zRemRangeByRank(dailyKey, -1, -1);
      await multi.exec();
    } catch (err) {
      this.logger.warn(`Redis removeLastRequest failed: ${err.message}`);
      this.redisAvailable = false;
      this.removeLastRequestInMemory(userId);
    }
  }

  private async checkAbuseFlagsRedis(userId: string): Promise<boolean> {
    const now = Date.now();
    const hourlyKey = this.getHourlyKey(userId);
    const dailyKey = this.getDailyKey(userId);

    const tenMinAgo = now - 10 * 60 * 1000;
    const twelveHoursAgo = now - 12 * 60 * 60 * 1000;

    try {
      const multi = this.redisClient!.multi();
      multi.zCount(hourlyKey, tenMinAgo.toString(), '+inf');
      multi.zCount(dailyKey, twelveHoursAgo.toString(), '+inf');
      const results = await multi.exec();

      const countIn10Min = results[0] as number;
      const countIn12Hours = results[1] as number;

      return (
        countIn10Min > RATE_LIMIT_FLAG_PER_10_MIN ||
        countIn12Hours > RATE_LIMIT_FLAG_PER_12_HOURS
      );
    } catch (err) {
      this.logger.warn(`Redis checkAbuseFlags failed: ${err.message}`);
      this.redisAvailable = false;
      return this.checkAbuseFlagsInMemory(userId);
    }
  }

  // ── In-Memory Fallback Implementation ───────────────────────────────────────

  private getTimestamps(userId: string): number[] {
    if (!this.inMemoryStore.has(userId)) {
      this.inMemoryStore.set(userId, []);
    }
    return this.inMemoryStore.get(userId)!;
  }

  private cleanupTimestamps(timestamps: number[], now: number): number[] {
    // Remove entries older than the daily window (largest window)
    const dailyWindowStart = now - RATE_LIMIT_WINDOW_DAILY_SECONDS * 1000;
    return timestamps.filter((ts) => ts > dailyWindowStart);
  }

  private checkLimitInMemory(userId: string): RateLimitInfo {
    const now = Date.now();
    let timestamps = this.getTimestamps(userId);
    timestamps = this.cleanupTimestamps(timestamps, now);
    this.inMemoryStore.set(userId, timestamps);

    const hourlyWindowStart = now - RATE_LIMIT_WINDOW_HOURLY_SECONDS * 1000;
    const hourlyCount = timestamps.filter((ts) => ts > hourlyWindowStart).length;
    const dailyCount = timestamps.length;

    const hourlyRemaining = Math.max(0, RATE_LIMIT_HOURLY - hourlyCount);
    const dailyRemaining = Math.max(0, RATE_LIMIT_DAILY - dailyCount);

    let limitExceeded: 'hourly' | 'daily' | null = null;
    let resetInSeconds = 0;

    if (hourlyCount >= RATE_LIMIT_HOURLY) {
      limitExceeded = 'hourly';
      // Find the oldest timestamp in the hourly window
      const hourlyTimestamps = timestamps.filter((ts) => ts > hourlyWindowStart).sort((a, b) => a - b);
      if (hourlyTimestamps.length > 0) {
        resetInSeconds = Math.ceil(
          (hourlyTimestamps[0] + RATE_LIMIT_WINDOW_HOURLY_SECONDS * 1000 - now) / 1000,
        );
      } else {
        resetInSeconds = RATE_LIMIT_WINDOW_HOURLY_SECONDS;
      }
    } else if (dailyCount >= RATE_LIMIT_DAILY) {
      limitExceeded = 'daily';
      const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
      if (sortedTimestamps.length > 0) {
        resetInSeconds = Math.ceil(
          (sortedTimestamps[0] + RATE_LIMIT_WINDOW_DAILY_SECONDS * 1000 - now) / 1000,
        );
      } else {
        resetInSeconds = RATE_LIMIT_WINDOW_DAILY_SECONDS;
      }
    }

    resetInSeconds = Math.max(0, resetInSeconds);

    return { hourlyRemaining, dailyRemaining, resetInSeconds, limitExceeded };
  }

  private recordRequestInMemory(userId: string, now: number): void {
    let timestamps = this.getTimestamps(userId);
    timestamps = this.cleanupTimestamps(timestamps, now);
    timestamps.push(now);
    this.inMemoryStore.set(userId, timestamps);
  }

  private removeLastRequestInMemory(userId: string): void {
    const timestamps = this.getTimestamps(userId);
    if (timestamps.length > 0) {
      timestamps.pop();
      this.inMemoryStore.set(userId, timestamps);
    }
  }

  private checkAbuseFlagsInMemory(userId: string): boolean {
    const now = Date.now();
    const timestamps = this.getTimestamps(userId);

    const tenMinAgo = now - 10 * 60 * 1000;
    const twelveHoursAgo = now - 12 * 60 * 60 * 1000;

    const countIn10Min = timestamps.filter((ts) => ts > tenMinAgo).length;
    const countIn12Hours = timestamps.filter((ts) => ts > twelveHoursAgo).length;

    return (
      countIn10Min > RATE_LIMIT_FLAG_PER_10_MIN ||
      countIn12Hours > RATE_LIMIT_FLAG_PER_12_HOURS
    );
  }

  // ── Testing Helpers ─────────────────────────────────────────────────────────

  /** Exposed for testing: check if Redis is currently available */
  isRedisAvailable(): boolean {
    return this.redisAvailable;
  }

  /** Exposed for testing: clear in-memory store */
  clearInMemoryStore(): void {
    this.inMemoryStore.clear();
  }
}
