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
var AuditLoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLoggerService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
const ai_constants_1 = require("../constants/ai.constants");
let AuditLoggerService = AuditLoggerService_1 = class AuditLoggerService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.logger = new common_1.Logger(AuditLoggerService_1.name);
        this.retryQueue = [];
        this.retryTimer = null;
        this.MAX_RETRY_ATTEMPTS = 3;
        this.RETRY_INTERVAL_MS = 5 * 60 * 1000;
        this.startRetryProcessor();
    }
    async logInteraction(params) {
        try {
            const record = {
                user_id: params.userId,
                timestamp: new Date().toISOString(),
                request_type: params.requestType,
                token_count: params.tokenCount,
                response_status: params.responseStatus,
                duration_ms: params.durationMs ?? null,
            };
            const client = this.supabaseService.getAdminClient();
            const { error } = await client.from('ai_audit_logs').insert(record);
            if (error) {
                this.logger.warn(`Failed to persist audit log for user ${params.userId}: ${error.message}`);
                this.enqueueForRetry('ai_audit_logs', record);
            }
        }
        catch (err) {
            this.logger.warn(`Audit logging failed for user ${params.userId}: ${err.message}`);
        }
    }
    async logSecurityEvent(params) {
        try {
            const truncatedInput = params.sanitizedInput.slice(0, ai_constants_1.SECURITY_EVENT_INPUT_MAX_LENGTH);
            const record = {
                user_id: params.userId,
                timestamp: new Date().toISOString(),
                sanitized_input: truncatedInput,
                detection_reason: params.detectionReason,
            };
            const client = this.supabaseService.getAdminClient();
            const { error } = await client
                .from('ai_security_events')
                .insert(record);
            if (error) {
                this.logger.warn(`Failed to persist security event for user ${params.userId}: ${error.message}`);
                this.enqueueForRetry('ai_security_events', record);
            }
        }
        catch (err) {
            this.logger.warn(`Security event logging failed for user ${params.userId}: ${err.message}`);
        }
    }
    async generateDailySummary(date) {
        try {
            const summaryDate = date || this.getYesterday();
            const startOfDay = new Date(summaryDate);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(summaryDate);
            endOfDay.setUTCHours(23, 59, 59, 999);
            const client = this.supabaseService.getAdminClient();
            const { data: auditLogs, error: auditError } = await client
                .from('ai_audit_logs')
                .select('user_id, duration_ms')
                .gte('timestamp', startOfDay.toISOString())
                .lte('timestamp', endOfDay.toISOString());
            if (auditError) {
                this.logger.error(`Failed to fetch audit logs for daily summary: ${auditError.message}`);
                return;
            }
            const { count: securityEventsCount, error: securityError } = await client
                .from('ai_security_events')
                .select('*', { count: 'exact', head: true })
                .gte('timestamp', startOfDay.toISOString())
                .lte('timestamp', endOfDay.toISOString());
            if (securityError) {
                this.logger.error(`Failed to fetch security events for daily summary: ${securityError.message}`);
                return;
            }
            const logs = auditLogs || [];
            const totalRequests = logs.length;
            const uniqueUsers = new Set(logs.map((log) => log.user_id)).size;
            const durationsMs = logs
                .map((log) => log.duration_ms)
                .filter((d) => d !== null && d !== undefined);
            const avgResponseTimeMs = durationsMs.length > 0
                ? Math.round(durationsMs.reduce((sum, d) => sum + d, 0) / durationsMs.length)
                : 0;
            const summaryDateStr = startOfDay.toISOString().split('T')[0];
            const { error: upsertError } = await client
                .from('ai_usage_summaries')
                .upsert({
                summary_date: summaryDateStr,
                total_requests: totalRequests,
                unique_users: uniqueUsers,
                avg_response_time_ms: avgResponseTimeMs,
                security_events_count: securityEventsCount || 0,
                generated_at: new Date().toISOString(),
            }, { onConflict: 'summary_date' });
            if (upsertError) {
                this.logger.error(`Failed to upsert daily summary for ${summaryDateStr}: ${upsertError.message}`);
                return;
            }
            this.logger.log(`Daily summary generated for ${summaryDateStr}: ${totalRequests} requests, ${uniqueUsers} users`);
        }
        catch (err) {
            this.logger.error(`Daily summary generation failed: ${err.message}`);
        }
    }
    async queryAuditRecords(filters) {
        try {
            const client = this.supabaseService.getAdminClient();
            let query = client.from('ai_audit_logs').select('*');
            if (filters.userId) {
                query = query.eq('user_id', filters.userId);
            }
            if (filters.startDate) {
                query = query.gte('timestamp', filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte('timestamp', filters.endDate);
            }
            if (filters.requestType) {
                query = query.eq('request_type', filters.requestType);
            }
            if (filters.responseStatus) {
                query = query.eq('response_status', filters.responseStatus);
            }
            query = query.order('timestamp', { ascending: false });
            const { data, error } = await query;
            if (error) {
                this.logger.error(`Failed to query audit records: ${error.message}`);
                return [];
            }
            return (data || []).map(this.mapToAuditRecord);
        }
        catch (err) {
            this.logger.error(`Audit record query failed: ${err.message}`);
            return [];
        }
    }
    getRetryQueueLength() {
        return this.retryQueue.length;
    }
    enqueueForRetry(table, record) {
        this.retryQueue.push({
            table,
            record,
            enqueuedAt: new Date(),
            retryCount: 0,
        });
        this.logger.debug(`Enqueued failed write to ${table} for retry. Queue size: ${this.retryQueue.length}`);
    }
    startRetryProcessor() {
        this.retryTimer = setInterval(() => {
            this.processRetryQueue();
        }, this.RETRY_INTERVAL_MS);
        if (this.retryTimer.unref) {
            this.retryTimer.unref();
        }
    }
    async processRetryQueue() {
        if (this.retryQueue.length === 0) {
            return;
        }
        this.logger.debug(`Processing retry queue: ${this.retryQueue.length} items`);
        const itemsToProcess = [...this.retryQueue];
        this.retryQueue.length = 0;
        for (const item of itemsToProcess) {
            try {
                const client = this.supabaseService.getAdminClient();
                const { error } = await client.from(item.table).insert(item.record);
                if (error) {
                    item.retryCount++;
                    if (item.retryCount < this.MAX_RETRY_ATTEMPTS) {
                        this.retryQueue.push(item);
                        this.logger.debug(`Retry ${item.retryCount}/${this.MAX_RETRY_ATTEMPTS} failed for ${item.table}: ${error.message}`);
                    }
                    else {
                        this.logger.error(`Discarding audit record for ${item.table} after ${this.MAX_RETRY_ATTEMPTS} failed attempts: ${error.message}`);
                    }
                }
                else {
                    this.logger.debug(`Successfully persisted queued audit record to ${item.table}`);
                }
            }
            catch (err) {
                item.retryCount++;
                if (item.retryCount < this.MAX_RETRY_ATTEMPTS) {
                    this.retryQueue.push(item);
                }
                else {
                    this.logger.error(`Discarding audit record for ${item.table} after ${this.MAX_RETRY_ATTEMPTS} failed attempts`);
                }
            }
        }
    }
    onModuleDestroy() {
        if (this.retryTimer) {
            clearInterval(this.retryTimer);
            this.retryTimer = null;
        }
    }
    getYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
    }
    mapToAuditRecord(row) {
        return {
            id: row.id,
            userId: row.user_id,
            timestamp: row.timestamp,
            requestType: row.request_type,
            tokenCount: row.token_count,
            responseStatus: row.response_status,
            durationMs: row.duration_ms ?? undefined,
        };
    }
};
exports.AuditLoggerService = AuditLoggerService;
exports.AuditLoggerService = AuditLoggerService = AuditLoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuditLoggerService);
//# sourceMappingURL=audit-logger.service.js.map