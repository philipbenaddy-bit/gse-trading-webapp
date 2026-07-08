import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from './circuit-breaker.service';
import {
  CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS,
} from '../constants/ai.constants';

/**
 * Unit tests for CircuitBreakerService using in-memory fallback.
 * These tests validate the circuit breaker state machine logic
 * without requiring Redis.
 */
describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitBreakerService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: any) => {
              if (key === 'REDIS_HOST') return 'localhost';
              if (key === 'REDIS_PORT') return 6379;
              return defaultValue;
            },
          },
        },
      ],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
    // Don't call onModuleInit — test in-memory fallback directly
    service.resetInMemoryState();
  });

  describe('initial state', () => {
    it('should start in CLOSED state', async () => {
      const state = await service.getState();

      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(0);
      expect(state.lastFailure).toBeNull();
      expect(state.nextRetryAt).toBeNull();
    });

    it('should allow execution in CLOSED state', async () => {
      const canExecute = await service.canExecute();
      expect(canExecute).toBe(true);
    });
  });

  describe('CLOSED → OPEN transition', () => {
    it('should remain CLOSED after fewer than threshold failures', async () => {
      for (let i = 0; i < CIRCUIT_BREAKER_FAILURE_THRESHOLD - 1; i++) {
        await service.recordFailure();
      }

      const state = await service.getState();
      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(CIRCUIT_BREAKER_FAILURE_THRESHOLD - 1);
    });

    it('should transition to OPEN after threshold consecutive failures', async () => {
      for (let i = 0; i < CIRCUIT_BREAKER_FAILURE_THRESHOLD; i++) {
        await service.recordFailure();
      }

      const state = await service.getState();
      expect(state.state).toBe('open');
      expect(state.failureCount).toBe(CIRCUIT_BREAKER_FAILURE_THRESHOLD);
      expect(state.lastFailure).not.toBeNull();
      expect(state.nextRetryAt).not.toBeNull();
    });

    it('should block execution in OPEN state', async () => {
      for (let i = 0; i < CIRCUIT_BREAKER_FAILURE_THRESHOLD; i++) {
        await service.recordFailure();
      }

      const canExecute = await service.canExecute();
      expect(canExecute).toBe(false);
    });

    it('should reset failure count on success before reaching threshold', async () => {
      await service.recordFailure();
      await service.recordFailure();
      await service.recordSuccess();

      const state = await service.getState();
      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(0);
    });
  });

  describe('OPEN → HALF-OPEN transition', () => {
    it('should transition to HALF-OPEN after recovery timeout expires', async () => {
      // Trip the circuit
      for (let i = 0; i < CIRCUIT_BREAKER_FAILURE_THRESHOLD; i++) {
        await service.recordFailure();
      }

      // Simulate recovery timeout expiry by setting openUntil in the past
      service.setInMemoryState('open', {
        failureCount: CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        openUntil: Date.now() - 1000, // expired 1 second ago
        lastFailure: Date.now() - CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS - 1000,
      });

      const canExecute = await service.canExecute();
      expect(canExecute).toBe(true);

      const state = await service.getState();
      expect(state.state).toBe('half-open');
    });

    it('should NOT transition to HALF-OPEN before recovery timeout', async () => {
      service.setInMemoryState('open', {
        failureCount: CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        openUntil: Date.now() + 30000, // 30 seconds from now
        lastFailure: Date.now(),
      });

      const canExecute = await service.canExecute();
      expect(canExecute).toBe(false);

      const state = await service.getState();
      expect(state.state).toBe('open');
    });
  });

  describe('HALF-OPEN state', () => {
    beforeEach(() => {
      // Set up HALF-OPEN state
      service.setInMemoryState('half-open', {
        failureCount: CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        lastFailure: Date.now() - CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS,
        openUntil: null,
        halfOpenLock: false,
      });
    });

    it('should allow exactly one test request in HALF-OPEN', async () => {
      const first = await service.canExecute();
      const second = await service.canExecute();

      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    it('should transition to CLOSED on successful test request', async () => {
      await service.canExecute(); // acquire lock
      await service.recordSuccess();

      const state = await service.getState();
      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(0);
    });

    it('should transition back to OPEN on failed test request', async () => {
      await service.canExecute(); // acquire lock
      await service.recordFailure();

      const state = await service.getState();
      expect(state.state).toBe('open');
      expect(state.nextRetryAt).not.toBeNull();
    });

    it('should allow execution again after transitioning to CLOSED', async () => {
      await service.canExecute(); // acquire lock
      await service.recordSuccess();

      const canExecute = await service.canExecute();
      expect(canExecute).toBe(true);
    });
  });

  describe('HALF-OPEN → OPEN → HALF-OPEN cycle', () => {
    it('should allow retry after second OPEN period expires', async () => {
      // Start in HALF-OPEN
      service.setInMemoryState('half-open', {
        failureCount: CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        lastFailure: Date.now() - CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS,
        openUntil: null,
        halfOpenLock: false,
      });

      // Test request fails — goes back to OPEN
      await service.canExecute();
      await service.recordFailure();

      let state = await service.getState();
      expect(state.state).toBe('open');

      // Simulate second recovery timeout expiry
      service.setInMemoryState('open', {
        failureCount: CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        openUntil: Date.now() - 1000,
        lastFailure: Date.now() - CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS - 1000,
      });

      // Should transition to HALF-OPEN again
      const canExecute = await service.canExecute();
      expect(canExecute).toBe(true);

      state = await service.getState();
      expect(state.state).toBe('half-open');
    });
  });

  describe('failure window reset', () => {
    it('should reset failure count when failures are outside the window', async () => {
      // Record some failures
      await service.recordFailure();
      await service.recordFailure();
      await service.recordFailure();

      // Simulate that the last failure was outside the window
      service.setInMemoryState('closed', {
        failureCount: 3,
        lastFailure: Date.now() - (CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS * 10), // well outside window
        openUntil: null,
      });

      // Next failure should reset count to 1 (not 4)
      await service.recordFailure();

      const state = await service.getState();
      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset from OPEN to CLOSED', async () => {
      // Trip the circuit
      for (let i = 0; i < CIRCUIT_BREAKER_FAILURE_THRESHOLD; i++) {
        await service.recordFailure();
      }

      const openState = await service.getState();
      expect(openState.state).toBe('open');

      await service.reset();

      const resetState = await service.getState();
      expect(resetState.state).toBe('closed');
      expect(resetState.failureCount).toBe(0);
      expect(resetState.lastFailure).toBeNull();
      expect(resetState.nextRetryAt).toBeNull();
    });

    it('should reset from HALF-OPEN to CLOSED', async () => {
      service.setInMemoryState('half-open', {
        failureCount: CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        lastFailure: Date.now(),
        openUntil: null,
        halfOpenLock: true,
      });

      await service.reset();

      const state = await service.getState();
      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(0);
    });

    it('should allow execution after reset', async () => {
      // Trip the circuit
      for (let i = 0; i < CIRCUIT_BREAKER_FAILURE_THRESHOLD; i++) {
        await service.recordFailure();
      }

      expect(await service.canExecute()).toBe(false);

      await service.reset();

      expect(await service.canExecute()).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return nextRetryAt only when in OPEN state', async () => {
      const closedState = await service.getState();
      expect(closedState.nextRetryAt).toBeNull();

      // Trip the circuit
      for (let i = 0; i < CIRCUIT_BREAKER_FAILURE_THRESHOLD; i++) {
        await service.recordFailure();
      }

      const openState = await service.getState();
      expect(openState.nextRetryAt).not.toBeNull();

      // Verify nextRetryAt is approximately 60 seconds from now
      const nextRetry = new Date(openState.nextRetryAt!).getTime();
      const expectedRetry = Date.now() + CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS;
      expect(Math.abs(nextRetry - expectedRetry)).toBeLessThan(1000);
    });

    it('should track lastFailure timestamp', async () => {
      const before = Date.now();
      await service.recordFailure();
      const after = Date.now();

      const state = await service.getState();
      expect(state.lastFailure).not.toBeNull();

      const lastFailureTime = new Date(state.lastFailure!).getTime();
      expect(lastFailureTime).toBeGreaterThanOrEqual(before);
      expect(lastFailureTime).toBeLessThanOrEqual(after);
    });
  });

  describe('in-memory fallback', () => {
    it('should use in-memory when Redis is not connected', () => {
      expect(service.isRedisAvailable()).toBe(false);
    });

    it('should function correctly with in-memory store', async () => {
      // Full cycle: CLOSED → OPEN → HALF-OPEN → CLOSED
      for (let i = 0; i < CIRCUIT_BREAKER_FAILURE_THRESHOLD; i++) {
        await service.recordFailure();
      }
      expect((await service.getState()).state).toBe('open');

      // Simulate timeout expiry
      service.setInMemoryState('open', {
        failureCount: CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        openUntil: Date.now() - 1,
        lastFailure: Date.now() - CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS,
      });

      expect(await service.canExecute()).toBe(true);
      expect((await service.getState()).state).toBe('half-open');

      await service.recordSuccess();
      expect((await service.getState()).state).toBe('closed');
    });
  });
});
