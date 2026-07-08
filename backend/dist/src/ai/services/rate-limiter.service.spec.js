"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const rate_limiter_service_1 = require("./rate-limiter.service");
const ai_constants_1 = require("../constants/ai.constants");
describe('RateLimiterService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                rate_limiter_service_1.RateLimiterService,
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: (key, defaultValue) => {
                            if (key === 'REDIS_HOST')
                                return 'localhost';
                            if (key === 'REDIS_PORT')
                                return 6379;
                            return defaultValue;
                        },
                    },
                },
            ],
        }).compile();
        service = module.get(rate_limiter_service_1.RateLimiterService);
        service.clearInMemoryStore();
    });
    describe('checkLimit', () => {
        it('should allow requests when no previous requests exist', async () => {
            const result = await service.checkLimit('user-1');
            expect(result.hourlyRemaining).toBe(ai_constants_1.RATE_LIMIT_HOURLY);
            expect(result.dailyRemaining).toBe(ai_constants_1.RATE_LIMIT_DAILY);
            expect(result.limitExceeded).toBeNull();
            expect(result.resetInSeconds).toBe(0);
        });
        it('should decrement hourly remaining after recording requests', async () => {
            await service.recordRequest('user-1');
            await service.recordRequest('user-1');
            await service.recordRequest('user-1');
            const result = await service.checkLimit('user-1');
            expect(result.hourlyRemaining).toBe(ai_constants_1.RATE_LIMIT_HOURLY - 3);
            expect(result.dailyRemaining).toBe(ai_constants_1.RATE_LIMIT_DAILY - 3);
            expect(result.limitExceeded).toBeNull();
        });
        it('should report hourly limit exceeded after 30 requests', async () => {
            for (let i = 0; i < ai_constants_1.RATE_LIMIT_HOURLY; i++) {
                await service.recordRequest('user-1');
            }
            const result = await service.checkLimit('user-1');
            expect(result.hourlyRemaining).toBe(0);
            expect(result.limitExceeded).toBe('hourly');
            expect(result.resetInSeconds).toBeGreaterThan(0);
        });
        it('should report daily limit exceeded after 100 requests', async () => {
            for (let i = 0; i < ai_constants_1.RATE_LIMIT_DAILY; i++) {
                await service.recordRequest('user-1');
            }
            const result = await service.checkLimit('user-1');
            expect(result.dailyRemaining).toBe(0);
            expect(result.limitExceeded).toBe('hourly');
        });
        it('should isolate rate limits between different users', async () => {
            for (let i = 0; i < ai_constants_1.RATE_LIMIT_HOURLY; i++) {
                await service.recordRequest('user-1');
            }
            const user1Result = await service.checkLimit('user-1');
            const user2Result = await service.checkLimit('user-2');
            expect(user1Result.limitExceeded).toBe('hourly');
            expect(user2Result.limitExceeded).toBeNull();
            expect(user2Result.hourlyRemaining).toBe(ai_constants_1.RATE_LIMIT_HOURLY);
        });
    });
    describe('recordRequest', () => {
        it('should record a request and reflect in subsequent checks', async () => {
            const before = await service.checkLimit('user-1');
            await service.recordRequest('user-1');
            const after = await service.checkLimit('user-1');
            expect(after.hourlyRemaining).toBe(before.hourlyRemaining - 1);
            expect(after.dailyRemaining).toBe(before.dailyRemaining - 1);
        });
    });
    describe('removeLastRequest', () => {
        it('should remove the last recorded request (for failed LLM calls)', async () => {
            await service.recordRequest('user-1');
            await service.recordRequest('user-1');
            await service.recordRequest('user-1');
            const beforeRemove = await service.checkLimit('user-1');
            await service.removeLastRequest('user-1');
            const afterRemove = await service.checkLimit('user-1');
            expect(afterRemove.hourlyRemaining).toBe(beforeRemove.hourlyRemaining + 1);
            expect(afterRemove.dailyRemaining).toBe(beforeRemove.dailyRemaining + 1);
        });
        it('should handle removeLastRequest on empty store gracefully', async () => {
            await expect(service.removeLastRequest('user-1')).resolves.not.toThrow();
        });
        it('should not count failed requests against limits', async () => {
            for (let i = 0; i < ai_constants_1.RATE_LIMIT_HOURLY - 1; i++) {
                await service.recordRequest('user-1');
            }
            await service.recordRequest('user-1');
            const atLimit = await service.checkLimit('user-1');
            expect(atLimit.hourlyRemaining).toBe(0);
            await service.removeLastRequest('user-1');
            const afterRemove = await service.checkLimit('user-1');
            expect(afterRemove.hourlyRemaining).toBe(1);
            expect(afterRemove.limitExceeded).toBeNull();
        });
    });
    describe('getRateLimitStatus', () => {
        it('should return the same result as checkLimit', async () => {
            await service.recordRequest('user-1');
            const checkResult = await service.checkLimit('user-1');
            const statusResult = await service.getRateLimitStatus('user-1');
            expect(statusResult).toEqual(checkResult);
        });
    });
    describe('checkAbuseFlags', () => {
        it('should not flag a user with normal usage', async () => {
            for (let i = 0; i < 5; i++) {
                await service.recordRequest('user-1');
            }
            const flagged = await service.checkAbuseFlags('user-1');
            expect(flagged).toBe(false);
        });
        it('should flag a user exceeding 25 requests in 10 minutes', async () => {
            for (let i = 0; i < ai_constants_1.RATE_LIMIT_FLAG_PER_10_MIN + 1; i++) {
                await service.recordRequest('user-1');
            }
            const flagged = await service.checkAbuseFlags('user-1');
            expect(flagged).toBe(true);
        });
    });
    describe('in-memory fallback', () => {
        it('should use in-memory when Redis is not connected', () => {
            expect(service.isRedisAvailable()).toBe(false);
        });
        it('should function correctly with in-memory store', async () => {
            await service.recordRequest('user-1');
            const result = await service.checkLimit('user-1');
            expect(result.hourlyRemaining).toBe(ai_constants_1.RATE_LIMIT_HOURLY - 1);
            expect(result.dailyRemaining).toBe(ai_constants_1.RATE_LIMIT_DAILY - 1);
        });
    });
    describe('resetInSeconds', () => {
        it('should return positive resetInSeconds when hourly limit is exceeded', async () => {
            for (let i = 0; i < ai_constants_1.RATE_LIMIT_HOURLY; i++) {
                await service.recordRequest('user-1');
            }
            const result = await service.checkLimit('user-1');
            expect(result.resetInSeconds).toBeGreaterThan(0);
            expect(result.resetInSeconds).toBeLessThanOrEqual(3600);
        });
    });
});
//# sourceMappingURL=rate-limiter.service.spec.js.map