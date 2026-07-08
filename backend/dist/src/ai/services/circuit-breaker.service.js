"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CircuitBreakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
const ai_constants_1 = require("../constants/ai.constants");
let CircuitBreakerService = CircuitBreakerService_1 = class CircuitBreakerService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(CircuitBreakerService_1.name);
        this.redisClient = null;
        this.redisAvailable = false;
        this.inMemoryState = 'closed';
        this.inMemoryFailureCount = 0;
        this.inMemoryLastFailure = null;
        this.inMemoryOpenUntil = null;
        this.inMemoryHalfOpenLock = false;
    }
    async onModuleInit() {
        await this.connectRedis();
    }
    async onModuleDestroy() {
        if (this.redisClient) {
            try {
                await this.redisClient.quit();
            }
            catch {
            }
        }
    }
    async connectRedis() {
        const host = this.configService.get('REDIS_HOST', 'localhost');
        const port = this.configService.get('REDIS_PORT', 6379);
        try {
            this.redisClient = (0, redis_1.createClient)({
                socket: { host, port, connectTimeout: 3000 },
            });
            this.redisClient.on('error', (err) => {
                if (this.redisAvailable) {
                    this.logger.warn(`Redis connection lost, falling back to in-memory: ${err.message}`);
                    this.redisAvailable = false;
                }
            });
            this.redisClient.on('connect', () => {
                this.logger.log('Redis connected for circuit breaker');
                this.redisAvailable = true;
            });
            await this.redisClient.connect();
            this.redisAvailable = true;
        }
        catch (err) {
            this.logger.warn(`Redis unavailable, using in-memory circuit breaker: ${err.message}`);
            this.redisAvailable = false;
            this.redisClient = null;
        }
    }
    async canExecute() {
        if (this.redisAvailable && this.redisClient) {
            return this.canExecuteRedis();
        }
        return this.canExecuteInMemory();
    }
    async recordSuccess() {
        if (this.redisAvailable && this.redisClient) {
            return this.recordSuccessRedis();
        }
        return this.recordSuccessInMemory();
    }
    async recordFailure() {
        if (this.redisAvailable && this.redisClient) {
            return this.recordFailureRedis();
        }
        return this.recordFailureInMemory();
    }
    async getState() {
        if (this.redisAvailable && this.redisClient) {
            return this.getStateRedis();
        }
        return this.getStateInMemory();
    }
    async reset() {
        if (this.redisAvailable && this.redisClient) {
            return this.resetRedis();
        }
        return this.resetInMemory();
    }
    async canExecuteRedis() {
        try {
            const state = await this.redisClient.get(ai_constants_1.REDIS_KEY_CIRCUIT_STATE);
            if (!state || state === 'closed') {
                return true;
            }
            if (state === 'open') {
                const openUntilStr = await this.redisClient.get(ai_constants_1.REDIS_KEY_CIRCUIT_OPEN_UNTIL);
                if (openUntilStr) {
                    const openUntil = parseInt(openUntilStr, 10);
                    if (Date.now() >= openUntil) {
                        await this.redisClient.set(ai_constants_1.REDIS_KEY_CIRCUIT_STATE, 'half-open');
                        this.logger.log('Circuit breaker transitioning from OPEN to HALF-OPEN');
                        const acquired = await this.redisClient.set('ai:circuit:half_open_lock', '1', { NX: true, EX: ai_constants_1.CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS / 1000 });
                        return acquired !== null;
                    }
                }
                return false;
            }
            if (state === 'half-open') {
                const acquired = await this.redisClient.set('ai:circuit:half_open_lock', '1', { NX: true, EX: ai_constants_1.CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS / 1000 });
                return acquired !== null;
            }
            return false;
        }
        catch (err) {
            this.logger.warn(`Redis canExecute failed, falling back to in-memory: ${err.message}`);
            this.redisAvailable = false;
            return this.canExecuteInMemory();
        }
    }
    async recordSuccessRedis() {
        try {
            const state = await this.redisClient.get(ai_constants_1.REDIS_KEY_CIRCUIT_STATE);
            if (state === 'half-open') {
                const multi = this.redisClient.multi();
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_STATE, 'closed');
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_FAILURES, '0');
                multi.del(ai_constants_1.REDIS_KEY_CIRCUIT_OPEN_UNTIL);
                multi.del('ai:circuit:half_open_lock');
                await multi.exec();
                this.logger.log('Circuit breaker transitioning from HALF-OPEN to CLOSED');
            }
            else if (state === 'closed' || !state) {
                await this.redisClient.set(ai_constants_1.REDIS_KEY_CIRCUIT_FAILURES, '0');
            }
        }
        catch (err) {
            this.logger.warn(`Redis recordSuccess failed, falling back to in-memory: ${err.message}`);
            this.redisAvailable = false;
            return this.recordSuccessInMemory();
        }
    }
    async recordFailureRedis() {
        try {
            const state = await this.redisClient.get(ai_constants_1.REDIS_KEY_CIRCUIT_STATE);
            const now = Date.now();
            if (state === 'half-open') {
                const openUntil = now + ai_constants_1.CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS;
                const multi = this.redisClient.multi();
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_STATE, 'open');
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_OPEN_UNTIL, openUntil.toString());
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_LAST_FAILURE, new Date(now).toISOString());
                multi.del('ai:circuit:half_open_lock');
                await multi.exec();
                this.logger.log('Circuit breaker transitioning from HALF-OPEN back to OPEN');
                return;
            }
            const lastFailureStr = await this.redisClient.get(ai_constants_1.REDIS_KEY_CIRCUIT_LAST_FAILURE);
            const failureCountStr = await this.redisClient.get(ai_constants_1.REDIS_KEY_CIRCUIT_FAILURES);
            let failureCount = failureCountStr ? parseInt(failureCountStr, 10) : 0;
            if (lastFailureStr) {
                const lastFailureTime = new Date(lastFailureStr).getTime();
                if (now - lastFailureTime > ai_constants_1.CIRCUIT_BREAKER_FAILURE_WINDOW_MS) {
                    failureCount = 0;
                }
            }
            failureCount++;
            if (failureCount >= ai_constants_1.CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
                const openUntil = now + ai_constants_1.CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS;
                const multi = this.redisClient.multi();
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_STATE, 'open');
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_FAILURES, failureCount.toString());
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_LAST_FAILURE, new Date(now).toISOString());
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_OPEN_UNTIL, openUntil.toString());
                await multi.exec();
                this.logger.warn(`Circuit breaker TRIPPED: ${failureCount} failures in window. Blocking for ${ai_constants_1.CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS / 1000}s`);
            }
            else {
                const multi = this.redisClient.multi();
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_FAILURES, failureCount.toString());
                multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_LAST_FAILURE, new Date(now).toISOString());
                await multi.exec();
            }
        }
        catch (err) {
            this.logger.warn(`Redis recordFailure failed, falling back to in-memory: ${err.message}`);
            this.redisAvailable = false;
            return this.recordFailureInMemory();
        }
    }
    async getStateRedis() {
        try {
            const [state, failureCountStr, lastFailureStr, openUntilStr] = await Promise.all([
                this.redisClient.get(ai_constants_1.REDIS_KEY_CIRCUIT_STATE),
                this.redisClient.get(ai_constants_1.REDIS_KEY_CIRCUIT_FAILURES),
                this.redisClient.get(ai_constants_1.REDIS_KEY_CIRCUIT_LAST_FAILURE),
                this.redisClient.get(ai_constants_1.REDIS_KEY_CIRCUIT_OPEN_UNTIL),
            ]);
            const currentState = state || 'closed';
            const failureCount = failureCountStr ? parseInt(failureCountStr, 10) : 0;
            let nextRetryAt = null;
            if (currentState === 'open' && openUntilStr) {
                nextRetryAt = new Date(parseInt(openUntilStr, 10)).toISOString();
            }
            return {
                state: currentState,
                failureCount,
                lastFailure: lastFailureStr || null,
                nextRetryAt,
            };
        }
        catch (err) {
            this.logger.warn(`Redis getState failed, falling back to in-memory: ${err.message}`);
            this.redisAvailable = false;
            return this.getStateInMemory();
        }
    }
    async resetRedis() {
        try {
            const multi = this.redisClient.multi();
            multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_STATE, 'closed');
            multi.set(ai_constants_1.REDIS_KEY_CIRCUIT_FAILURES, '0');
            multi.del(ai_constants_1.REDIS_KEY_CIRCUIT_LAST_FAILURE);
            multi.del(ai_constants_1.REDIS_KEY_CIRCUIT_OPEN_UNTIL);
            multi.del('ai:circuit:half_open_lock');
            await multi.exec();
            this.logger.log('Circuit breaker manually reset to CLOSED');
        }
        catch (err) {
            this.logger.warn(`Redis reset failed, falling back to in-memory: ${err.message}`);
            this.redisAvailable = false;
            return this.resetInMemory();
        }
    }
    canExecuteInMemory() {
        if (this.inMemoryState === 'closed') {
            return true;
        }
        if (this.inMemoryState === 'open') {
            if (this.inMemoryOpenUntil && Date.now() >= this.inMemoryOpenUntil) {
                this.inMemoryState = 'half-open';
                this.inMemoryHalfOpenLock = false;
                this.logger.log('Circuit breaker transitioning from OPEN to HALF-OPEN (in-memory)');
                this.inMemoryHalfOpenLock = true;
                return true;
            }
            return false;
        }
        if (this.inMemoryState === 'half-open') {
            if (!this.inMemoryHalfOpenLock) {
                this.inMemoryHalfOpenLock = true;
                return true;
            }
            return false;
        }
        return false;
    }
    recordSuccessInMemory() {
        if (this.inMemoryState === 'half-open') {
            this.inMemoryState = 'closed';
            this.inMemoryFailureCount = 0;
            this.inMemoryOpenUntil = null;
            this.inMemoryHalfOpenLock = false;
            this.logger.log('Circuit breaker transitioning from HALF-OPEN to CLOSED (in-memory)');
        }
        else {
            this.inMemoryFailureCount = 0;
        }
    }
    recordFailureInMemory() {
        const now = Date.now();
        if (this.inMemoryState === 'half-open') {
            this.inMemoryState = 'open';
            this.inMemoryOpenUntil = now + ai_constants_1.CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS;
            this.inMemoryLastFailure = now;
            this.inMemoryHalfOpenLock = false;
            this.logger.log('Circuit breaker transitioning from HALF-OPEN back to OPEN (in-memory)');
            return;
        }
        if (this.inMemoryLastFailure &&
            now - this.inMemoryLastFailure > ai_constants_1.CIRCUIT_BREAKER_FAILURE_WINDOW_MS) {
            this.inMemoryFailureCount = 0;
        }
        this.inMemoryFailureCount++;
        this.inMemoryLastFailure = now;
        if (this.inMemoryFailureCount >= ai_constants_1.CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
            this.inMemoryState = 'open';
            this.inMemoryOpenUntil = now + ai_constants_1.CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS;
            this.logger.warn(`Circuit breaker TRIPPED (in-memory): ${this.inMemoryFailureCount} failures. Blocking for ${ai_constants_1.CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS / 1000}s`);
        }
    }
    getStateInMemory() {
        let nextRetryAt = null;
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
    resetInMemory() {
        this.inMemoryState = 'closed';
        this.inMemoryFailureCount = 0;
        this.inMemoryLastFailure = null;
        this.inMemoryOpenUntil = null;
        this.inMemoryHalfOpenLock = false;
        this.logger.log('Circuit breaker manually reset to CLOSED (in-memory)');
    }
    isRedisAvailable() {
        return this.redisAvailable;
    }
    setInMemoryState(state, options) {
        this.inMemoryState = state;
        if (options) {
            if (options.failureCount !== undefined)
                this.inMemoryFailureCount = options.failureCount;
            if (options.lastFailure !== undefined)
                this.inMemoryLastFailure = options.lastFailure;
            if (options.openUntil !== undefined)
                this.inMemoryOpenUntil = options.openUntil;
            if (options.halfOpenLock !== undefined)
                this.inMemoryHalfOpenLock = options.halfOpenLock;
        }
    }
    resetInMemoryState() {
        this.resetInMemory();
    }
};
exports.CircuitBreakerService = CircuitBreakerService;
exports.CircuitBreakerService = CircuitBreakerService = CircuitBreakerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CircuitBreakerService);
//# sourceMappingURL=circuit-breaker.service.js.map