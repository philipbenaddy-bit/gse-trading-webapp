import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { CircuitBreakerState } from '../interfaces/ai.interfaces';
import {
  CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  CIRCUIT_BREAKER_FAILURE_WINDOW_MS,
  CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS,
  REDIS_KEY_CIRCUIT_STATE,
  REDIS_KEY_CIRCUIT_FAILURES,
  REDIS_KEY_CIRCUIT_LAST_FAILURE,
  REDIS_KEY_CIRCUIT_OPEN_UNTIL,
} from '../constants/ai.constants';

/**
 * Circuit Breaker Service
 *
 * Implements the circuit breaker pattern for LLM provider calls:
 *   CLOSED → OPEN → HALF-OPEN → CLOSED (or back to OPEN)
 *
 * - Trips after 5 consecutive failures within a 5-minute window
 * - Blocks requests for 60 seconds in OPEN state
 * - Allows a single test request in HALF-OPEN state
 * - Transitions to CLOSED on successful test, back to OPEN on failed test
 * - Persists state in Redis; falls back to in-memory if Redis is unavailable
 */
@Injectable()
export class CircuitBreakerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private redisClient: RedisClientType | null = null;
  private redisAvailable = false;

  // ── In-memory fallback state ────────────────────────────────────────────────
  private inMemoryState: 'closed' | 'open' | 'half-open' = 'closed';
  private inMemoryFailureCount = 0;
  private inMemoryLastFailure: number | null = null;
  private inMemoryOpenUntil: number | null = null;
  private inMemoryHalfOpenLock = false;

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
          this.logger.warn(
            `Redis connection lost, falling back to in-memory: ${err.message}`,
          );
          this.redisAvailable = false;
        }
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis connected for circuit breaker');
        this.redisAvailable = true;
      });

      await this.redisClient.connect();
      this.redisAvailable = true;
    } catch (err) {
      this.logger.warn(
        `Redis unavailable, using in-memory circuit breaker: ${err.message}`,
      );
      this.redisAvailable = false;
      this.redisClient = null;
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Checks if a request can proceed through the circuit breaker.
   * - CLOSED: always allows
   * - OPEN: blocks until recovery timeout expires, then transitions to HALF-OPEN
   * - HALF-OPEN: allows exactly one test request (uses a lock)
   */
  async canExecute(): Promise<boolean> {
    if (this.redisAvailable && this.redisClient) {
      return this.canExecuteRedis();
    }
    return this.canExecuteInMemory();
  }

  /**
   * Records a successful LLM call.
   * - In HALF-OPEN: transitions to CLOSED and resets failure count
   * - In CLOSED: no-op (already healthy)
   */
  async recordSuccess(): Promise<void> {
    if (this.redisAvailable && this.redisClient) {
      return this.recordSuccessRedis();
    }
    return this.recordSuccessInMemory();
  }

  /**
   * Records a failed LLM call.
   * - In CLOSED: increments failure count; trips to OPEN if threshold reached
   * - In HALF-OPEN: transitions back to OPEN for another recovery period
   */
  async recordFailure(): Promise<void> {
    if (this.redisAvailable && this.redisClient) {
      return this.recordFailureRedis();
    }
    return this.recordFailureInMemory();
  }

  /**
   * Returns the current circuit breaker state information.
   */
  async getState(): Promise<CircuitBreakerState> {
    if (this.redisAvailable && this.redisClient) {
      return this.getStateRedis();
    }
    return this.getStateInMemory();
  }

  /**
   * Manually resets the circuit breaker to CLOSED state.
   * For administrative use.
   */
  async reset(): Promise<void> {
    if (this.redisAvailable && this.redisClient) {
      return this.resetRedis();
    }
    return this.resetInMemory();
  }

  // ── Redis Implementation ────────────────────────────────────────────────────

  private async canExecuteRedis(): Promise<boolean> {
    try {
      const state = await this.redisClient!.get(REDIS_KEY_CIRCUIT_STATE);

      if (!state || state === 'closed') {
        return true;
      }

      if (state === 'open') {
        const openUntilStr = await this.redisClient!.get(REDIS_KEY_CIRCUIT_OPEN_UNTIL);
        if (openUntilStr) {
          const openUntil = parseInt(openUntilStr, 10);
          if (Date.now() >= openUntil) {
            // Recovery timeout expired — transition to HALF-OPEN
            await this.redisClient!.set(REDIS_KEY_CIRCUIT_STATE, 'half-open');
            this.logger.log('Circuit breaker transitioning from OPEN to HALF-OPEN');
            // Allow the test request (acquire lock via SETNX)
            const acquired = await this.redisClient!.set(
              'ai:circuit:half_open_lock',
              '1',
              { NX: true, EX: CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS / 1000 },
            );
            return acquired !== null;
          }
        }
        return false;
      }

      if (state === 'half-open') {
        // Only allow one test request — try to acquire lock
        const acquired = await this.redisClient!.set(
          'ai:circuit:half_open_lock',
          '1',
          { NX: true, EX: CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS / 1000 },
        );
        return acquired !== null;
      }

      return false;
    } catch (err) {
      this.logger.warn(`Redis canExecute failed, falling back to in-memory: ${err.message}`);
      this.redisAvailable = false;
      return this.canExecuteInMemory();
    }
  }

  private async recordSuccessRedis(): Promise<void> {
    try {
      const state = await this.redisClient!.get(REDIS_KEY_CIRCUIT_STATE);

      if (state === 'half-open') {
        // Test request succeeded — transition to CLOSED
        const multi = this.redisClient!.multi();
        multi.set(REDIS_KEY_CIRCUIT_STATE, 'closed');
        multi.set(REDIS_KEY_CIRCUIT_FAILURES, '0');
        multi.del(REDIS_KEY_CIRCUIT_OPEN_UNTIL);
        multi.del('ai:circuit:half_open_lock');
        await multi.exec();
        this.logger.log('Circuit breaker transitioning from HALF-OPEN to CLOSED');
      } else if (state === 'closed' || !state) {
        // Reset failure count on success in CLOSED state
        await this.redisClient!.set(REDIS_KEY_CIRCUIT_FAILURES, '0');
      }
    } catch (err) {
      this.logger.warn(`Redis recordSuccess failed, falling back to in-memory: ${err.message}`);
      this.redisAvailable = false;
      return this.recordSuccessInMemory();
    }
  }

  private async recordFailureRedis(): Promise<void> {
    try {
      const state = await this.redisClient!.get(REDIS_KEY_CIRCUIT_STATE);
      const now = Date.now();

      if (state === 'half-open') {
        // Test request failed — transition back to OPEN
        const openUntil = now + CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS;
        const multi = this.redisClient!.multi();
        multi.set(REDIS_KEY_CIRCUIT_STATE, 'open');
        multi.set(REDIS_KEY_CIRCUIT_OPEN_UNTIL, openUntil.toString());
        multi.set(REDIS_KEY_CIRCUIT_LAST_FAILURE, new Date(now).toISOString());
        multi.del('ai:circuit:half_open_lock');
        await multi.exec();
        this.logger.log('Circuit breaker transitioning from HALF-OPEN back to OPEN');
        return;
      }

      // CLOSED state — increment failure count
      const lastFailureStr = await this.redisClient!.get(REDIS_KEY_CIRCUIT_LAST_FAILURE);
      const failureCountStr = await this.redisClient!.get(REDIS_KEY_CIRCUIT_FAILURES);
      let failureCount = failureCountStr ? parseInt(failureCountStr, 10) : 0;

      // Check if last failure is within the failure window
      if (lastFailureStr) {
        const lastFailureTime = new Date(lastFailureStr).getTime();
        if (now - lastFailureTime > CIRCUIT_BREAKER_FAILURE_WINDOW_MS) {
          // Outside window — reset count
          failureCount = 0;
        }
      }

      failureCount++;

      if (failureCount >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
        // Trip the circuit breaker
        const openUntil = now + CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS;
        const multi = this.redisClient!.multi();
        multi.set(REDIS_KEY_CIRCUIT_STATE, 'open');
        multi.set(REDIS_KEY_CIRCUIT_FAILURES, failureCount.toString());
        multi.set(REDIS_KEY_CIRCUIT_LAST_FAILURE, new Date(now).toISOString());
        multi.set(REDIS_KEY_CIRCUIT_OPEN_UNTIL, openUntil.toString());
        await multi.exec();
        this.logger.warn(
          `Circuit breaker TRIPPED: ${failureCount} failures in window. Blocking for ${CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS / 1000}s`,
        );
      } else {
        // Record failure but stay CLOSED
        const multi = this.redisClient!.multi();
        multi.set(REDIS_KEY_CIRCUIT_FAILURES, failureCount.toString());
        multi.set(REDIS_KEY_CIRCUIT_LAST_FAILURE, new Date(now).toISOString());
        await multi.exec();
      }
    } catch (err) {
      this.logger.warn(`Redis recordFailure failed, falling back to in-memory: ${err.message}`);
      this.redisAvailable = false;
      return this.recordFailureInMemory();
    }
  }

  private async getStateRedis(): Promise<CircuitBreakerState> {
    try {
      const [state, failureCountStr, lastFailureStr, openUntilStr] = await Promise.all([
        this.redisClient!.get(REDIS_KEY_CIRCUIT_STATE),
        this.redisClient!.get(REDIS_KEY_CIRCUIT_FAILURES),
        this.redisClient!.get(REDIS_KEY_CIRCUIT_LAST_FAILURE),
        this.redisClient!.get(REDIS_KEY_CIRCUIT_OPEN_UNTIL),
      ]);

      const currentState = (state as 'closed' | 'open' | 'half-open') || 'closed';
      const failureCount = failureCountStr ? parseInt(failureCountStr, 10) : 0;

      let nextRetryAt: string | null = null;
      if (currentState === 'open' && openUntilStr) {
        nextRetryAt = new Date(parseInt(openUntilStr, 10)).toISOString();
      }

      return {
        state: currentState,
        failureCount,
        lastFailure: lastFailureStr || null,
        nextRetryAt,
      };
    } catch (err) {
      this.logger.warn(`Redis getState failed, falling back to in-memory: ${err.message}`);
      this.redisAvailable = false;
      return this.getStateInMemory();
    }
  }

  private async resetRedis(): Promise<void> {
    try {
      const multi = this.redisClient!.multi();
      multi.set(REDIS_KEY_CIRCUIT_STATE, 'closed');
      multi.set(REDIS_KEY_CIRCUIT_FAILURES, '0');
      multi.del(REDIS_KEY_CIRCUIT_LAST_FAILURE);
      multi.del(REDIS_KEY_CIRCUIT_OPEN_UNTIL);
      multi.del('ai:circuit:half_open_lock');
      await multi.exec();
      this.logger.log('Circuit breaker manually reset to CLOSED');
    } catch (err) {
      this.logger.warn(`Redis reset failed, falling back to in-memory: ${err.message}`);
      this.redisAvailable = false;
      return this.resetInMemory();
    }
  }

  // ── In-Memory Fallback Implementation ───────────────────────────────────────

  private canExecuteInMemory(): boolean {
    if (this.inMemoryState === 'closed') {
      return true;
    }

    if (this.inMemoryState === 'open') {
      if (this.inMemoryOpenUntil && Date.now() >= this.inMemoryOpenUntil) {
        // Recovery timeout expired — transition to HALF-OPEN
        this.inMemoryState = 'half-open';
        this.inMemoryHalfOpenLock = false;
        this.logger.log('Circuit breaker transitioning from OPEN to HALF-OPEN (in-memory)');
        // Allow the first test request
        this.inMemoryHalfOpenLock = true;
        return true;
      }
      return false;
    }

    if (this.inMemoryState === 'half-open') {
      // Only allow one test request
      if (!this.inMemoryHalfOpenLock) {
        this.inMemoryHalfOpenLock = true;
        return true;
      }
      return false;
    }

    return false;
  }

  private recordSuccessInMemory(): void {
    if (this.inMemoryState === 'half-open') {
      // Test request succeeded — transition to CLOSED
      this.inMemoryState = 'closed';
      this.inMemoryFailureCount = 0;
      this.inMemoryOpenUntil = null;
      this.inMemoryHalfOpenLock = false;
      this.logger.log('Circuit breaker transitioning from HALF-OPEN to CLOSED (in-memory)');
    } else {
      // Reset failure count on success
      this.inMemoryFailureCount = 0;
    }
  }

  private recordFailureInMemory(): void {
    const now = Date.now();

    if (this.inMemoryState === 'half-open') {
      // Test request failed — transition back to OPEN
      this.inMemoryState = 'open';
      this.inMemoryOpenUntil = now + CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS;
      this.inMemoryLastFailure = now;
      this.inMemoryHalfOpenLock = false;
      this.logger.log('Circuit breaker transitioning from HALF-OPEN back to OPEN (in-memory)');
      return;
    }

    // CLOSED state — check if last failure is within the window
    if (
      this.inMemoryLastFailure &&
      now - this.inMemoryLastFailure > CIRCUIT_BREAKER_FAILURE_WINDOW_MS
    ) {
      // Outside window — reset count
      this.inMemoryFailureCount = 0;
    }

    this.inMemoryFailureCount++;
    this.inMemoryLastFailure = now;

    if (this.inMemoryFailureCount >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
      // Trip the circuit breaker
      this.inMemoryState = 'open';
      this.inMemoryOpenUntil = now + CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS;
      this.logger.warn(
        `Circuit breaker TRIPPED (in-memory): ${this.inMemoryFailureCount} failures. Blocking for ${CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS / 1000}s`,
      );
    }
  }

  private getStateInMemory(): CircuitBreakerState {
    let nextRetryAt: string | null = null;
    if (this.inMemoryState === 'open' && this.inMemoryOpenUntil) {
      nextRetryAt = new Date(this.inMemoryOpenUntil).toISOString();
    }

    return {
      state: this.inMemoryState,
      failureCount: this.inMemoryFailureCount,
      lastFailure: this.inMemoryLastFailure
        ? new Date(this.inMemoryLastFailure).toISOString()
        : null,
      nextRetryAt,
    };
  }

  private resetInMemory(): void {
    this.inMemoryState = 'closed';
    this.inMemoryFailureCount = 0;
    this.inMemoryLastFailure = null;
    this.inMemoryOpenUntil = null;
    this.inMemoryHalfOpenLock = false;
    this.logger.log('Circuit breaker manually reset to CLOSED (in-memory)');
  }

  // ── Testing Helpers ─────────────────────────────────────────────────────────

  /** Exposed for testing: check if Redis is currently available */
  isRedisAvailable(): boolean {
    return this.redisAvailable;
  }

  /** Exposed for testing: force in-memory state for unit tests */
  setInMemoryState(
    state: 'closed' | 'open' | 'half-open',
    options?: {
      failureCount?: number;
      lastFailure?: number | null;
      openUntil?: number | null;
      halfOpenLock?: boolean;
    },
  ): void {
    this.inMemoryState = state;
    if (options) {
      if (options.failureCount !== undefined) this.inMemoryFailureCount = options.failureCount;
      if (options.lastFailure !== undefined) this.inMemoryLastFailure = options.lastFailure;
      if (options.openUntil !== undefined) this.inMemoryOpenUntil = options.openUntil;
      if (options.halfOpenLock !== undefined) this.inMemoryHalfOpenLock = options.halfOpenLock;
    }
  }

  /** Exposed for testing: reset all in-memory state */
  resetInMemoryState(): void {
    this.resetInMemory();
  }
}
