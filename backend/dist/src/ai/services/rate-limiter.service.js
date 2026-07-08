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
var RateLimiterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
const ai_constants_1 = require("../constants/ai.constants");
let RateLimiterService = RateLimiterService_1 = class RateLimiterService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RateLimiterService_1.name);
        this.redisClient = null;
        this.redisAvailable = false;
        this.inMemoryStore = new Map();
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
                this.logger.log('Redis connected for rate limiting');
                this.redisAvailable = true;
            });
            await this.redisClient.connect();
            this.redisAvailable = true;
        }
        catch (err) {
            this.logger.warn(`Redis unavailable, using in-memory rate limiting: ${err.message}`);
            this.redisAvailable = false;
            this.redisClient = null;
        }
    }
    async checkLimit(userId) {
        if (this.redisAvailable && this.redisClient) {
            return this.checkLimitRedis(userId);
        }
        return this.checkLimitInMemory(userId);
    }
    async recordRequest(userId) {
        const now = Date.now();
        if (this.redisAvailable && this.redisClient) {
            await this.recordRequestRedis(userId, now);
        }
        else {
            this.recordRequestInMemory(userId, now);
        }
    }
    async removeLastRequest(userId) {
        if (this.redisAvailable && this.redisClient) {
            await this.removeLastRequestRedis(userId);
        }
        else {
            this.removeLastRequestInMemory(userId);
        }
    }
    async getRateLimitStatus(userId) {
        return this.checkLimit(userId);
    }
    async checkAbuseFlags(userId) {
        if (this.redisAvailable && this.redisClient) {
            return this.checkAbuseFlagsRedis(userId);
        }
        return this.checkAbuseFlagsInMemory(userId);
    }
    getHourlyKey(userId) {
        return `${ai_constants_1.REDIS_KEY_RATE_HOURLY}:${userId}`;
    }
    getDailyKey(userId) {
        return `${ai_constants_1.REDIS_KEY_RATE_DAILY}:${userId}`;
    }
    async checkLimitRedis(userId) {
        const now = Date.now();
        const hourlyKey = this.getHourlyKey(userId);
        const dailyKey = this.getDailyKey(userId);
        const hourlyWindowStart = now - ai_constants_1.RATE_LIMIT_WINDOW_HOURLY_SECONDS * 1000;
        const dailyWindowStart = now - ai_constants_1.RATE_LIMIT_WINDOW_DAILY_SECONDS * 1000;
        try {
            const multi = this.redisClient.multi();
            multi.zRemRangeByScore(hourlyKey, '-inf', hourlyWindowStart.toString());
            multi.zRemRangeByScore(dailyKey, '-inf', dailyWindowStart.toString());
            multi.zCard(hourlyKey);
            multi.zCard(dailyKey);
            multi.zRange(hourlyKey, 0, 0);
            multi.zRange(dailyKey, 0, 0);
            const results = await multi.exec();
            const hourlyCount = results[2];
            const dailyCount = results[3];
            const oldestHourly = results[4];
            const oldestDaily = results[5];
            const hourlyRemaining = Math.max(0, ai_constants_1.RATE_LIMIT_HOURLY - hourlyCount);
            const dailyRemaining = Math.max(0, ai_constants_1.RATE_LIMIT_DAILY - dailyCount);
            let limitExceeded = null;
            let resetInSeconds = 0;
            if (hourlyCount >= ai_constants_1.RATE_LIMIT_HOURLY) {
                limitExceeded = 'hourly';
                if (oldestHourly && oldestHourly.length > 0) {
                    const oldestTimestamp = parseInt(oldestHourly[0], 10);
                    resetInSeconds = Math.ceil((oldestTimestamp + ai_constants_1.RATE_LIMIT_WINDOW_HOURLY_SECONDS * 1000 - now) / 1000);
                }
                else {
                    resetInSeconds = ai_constants_1.RATE_LIMIT_WINDOW_HOURLY_SECONDS;
                }
            }
            else if (dailyCount >= ai_constants_1.RATE_LIMIT_DAILY) {
                limitExceeded = 'daily';
                if (oldestDaily && oldestDaily.length > 0) {
                    const oldestTimestamp = parseInt(oldestDaily[0], 10);
                    resetInSeconds = Math.ceil((oldestTimestamp + ai_constants_1.RATE_LIMIT_WINDOW_DAILY_SECONDS * 1000 - now) / 1000);
                }
                else {
                    resetInSeconds = ai_constants_1.RATE_LIMIT_WINDOW_DAILY_SECONDS;
                }
            }
            resetInSeconds = Math.max(0, resetInSeconds);
            return { hourlyRemaining, dailyRemaining, resetInSeconds, limitExceeded };
        }
        catch (err) {
            this.logger.warn(`Redis checkLimit failed, falling back to in-memory: ${err.message}`);
            this.redisAvailable = false;
            return this.checkLimitInMemory(userId);
        }
    }
    async recordRequestRedis(userId, now) {
        const hourlyKey = this.getHourlyKey(userId);
        const dailyKey = this.getDailyKey(userId);
        const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;
        try {
            const multi = this.redisClient.multi();
            multi.zAdd(hourlyKey, { score: now, value: member });
            multi.zAdd(dailyKey, { score: now, value: member });
            multi.expire(hourlyKey, ai_constants_1.RATE_LIMIT_WINDOW_HOURLY_SECONDS + 60);
            multi.expire(dailyKey, ai_constants_1.RATE_LIMIT_WINDOW_DAILY_SECONDS + 60);
            await multi.exec();
        }
        catch (err) {
            this.logger.warn(`Redis recordRequest failed, falling back to in-memory: ${err.message}`);
            this.redisAvailable = false;
            this.recordRequestInMemory(userId, now);
        }
    }
    async removeLastRequestRedis(userId) {
        const hourlyKey = this.getHourlyKey(userId);
        const dailyKey = this.getDailyKey(userId);
        try {
            const multi = this.redisClient.multi();
            multi.zRemRangeByRank(hourlyKey, -1, -1);
            multi.zRemRangeByRank(dailyKey, -1, -1);
            await multi.exec();
        }
        catch (err) {
            this.logger.warn(`Redis removeLastRequest failed: ${err.message}`);
            this.redisAvailable = false;
            this.removeLastRequestInMemory(userId);
        }
    }
    async checkAbuseFlagsRedis(userId) {
        const now = Date.now();
        const hourlyKey = this.getHourlyKey(userId);
        const dailyKey = this.getDailyKey(userId);
        const tenMinAgo = now - 10 * 60 * 1000;
        const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
        try {
            const multi = this.redisClient.multi();
            multi.zCount(hourlyKey, tenMinAgo.toString(), '+inf');
            multi.zCount(dailyKey, twelveHoursAgo.toString(), '+inf');
            const results = await multi.exec();
            const countIn10Min = results[0];
            const countIn12Hours = results[1];
            return (countIn10Min > ai_constants_1.RATE_LIMIT_FLAG_PER_10_MIN ||
                countIn12Hours > ai_constants_1.RATE_LIMIT_FLAG_PER_12_HOURS);
        }
        catch (err) {
            this.logger.warn(`Redis checkAbuseFlags failed: ${err.message}`);
            this.redisAvailable = false;
            return this.checkAbuseFlagsInMemory(userId);
        }
    }
    getTimestamps(userId) {
        if (!this.inMemoryStore.has(userId)) {
            this.inMemoryStore.set(userId, []);
        }
        return this.inMemoryStore.get(userId);
    }
    cleanupTimestamps(timestamps, now) {
        const dailyWindowStart = now - ai_constants_1.RATE_LIMIT_WINDOW_DAILY_SECONDS * 1000;
        return timestamps.filter((ts) => ts > dailyWindowStart);
    }
    checkLimitInMemory(userId) {
        const now = Date.now();
        let timestamps = this.getTimestamps(userId);
        timestamps = this.cleanupTimestamps(timestamps, now);
        this.inMemoryStore.set(userId, timestamps);
        const hourlyWindowStart = now - ai_constants_1.RATE_LIMIT_WINDOW_HOURLY_SECONDS * 1000;
        const hourlyCount = timestamps.filter((ts) => ts > hourlyWindowStart).length;
        const dailyCount = timestamps.length;
        const hourlyRemaining = Math.max(0, ai_constants_1.RATE_LIMIT_HOURLY - hourlyCount);
        const dailyRemaining = Math.max(0, ai_constants_1.RATE_LIMIT_DAILY - dailyCount);
        let limitExceeded = null;
        let resetInSeconds = 0;
        if (hourlyCount >= ai_constants_1.RATE_LIMIT_HOURLY) {
            limitExceeded = 'hourly';
            const hourlyTimestamps = timestamps.filter((ts) => ts > hourlyWindowStart).sort((a, b) => a - b);
            if (hourlyTimestamps.length > 0) {
                resetInSeconds = Math.ceil((hourlyTimestamps[0] + ai_constants_1.RATE_LIMIT_WINDOW_HOURLY_SECONDS * 1000 - now) / 1000);
            }
            else {
                resetInSeconds = ai_constants_1.RATE_LIMIT_WINDOW_HOURLY_SECONDS;
            }
        }
        else if (dailyCount >= ai_constants_1.RATE_LIMIT_DAILY) {
            limitExceeded = 'daily';
            const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
            if (sortedTimestamps.length > 0) {
                resetInSeconds = Math.ceil((sortedTimestamps[0] + ai_constants_1.RATE_LIMIT_WINDOW_DAILY_SECONDS * 1000 - now) / 1000);
            }
            else {
                resetInSeconds = ai_constants_1.RATE_LIMIT_WINDOW_DAILY_SECONDS;
            }
        }
        resetInSeconds = Math.max(0, resetInSeconds);
        return { hourlyRemaining, dailyRemaining, resetInSeconds, limitExceeded };
    }
    recordRequestInMemory(userId, now) {
        let timestamps = this.getTimestamps(userId);
        timestamps = this.cleanupTimestamps(timestamps, now);
        timestamps.push(now);
        this.inMemoryStore.set(userId, timestamps);
    }
    removeLastRequestInMemory(userId) {
        const timestamps = this.getTimestamps(userId);
        if (timestamps.length > 0) {
            timestamps.pop();
            this.inMemoryStore.set(userId, timestamps);
        }
    }
    checkAbuseFlagsInMemory(userId) {
        const now = Date.now();
        const timestamps = this.getTimestamps(userId);
        const tenMinAgo = now - 10 * 60 * 1000;
        const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
        const countIn10Min = timestamps.filter((ts) => ts > tenMinAgo).length;
        const countIn12Hours = timestamps.filter((ts) => ts > twelveHoursAgo).length;
        return (countIn10Min > ai_constants_1.RATE_LIMIT_FLAG_PER_10_MIN ||
            countIn12Hours > ai_constants_1.RATE_LIMIT_FLAG_PER_12_HOURS);
    }
    isRedisAvailable() {
        return this.redisAvailable;
    }
    clearInMemoryStore() {
        this.inMemoryStore.clear();
    }
};
exports.RateLimiterService = RateLimiterService;
exports.RateLimiterService = RateLimiterService = RateLimiterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RateLimiterService);
//# sourceMappingURL=rate-limiter.service.js.map