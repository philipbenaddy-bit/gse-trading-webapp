import { SupabaseService } from '../../supabase/supabase.service';
import { AuditRecord } from '../interfaces/ai.interfaces';
export interface LogInteractionParams {
    userId: string;
    requestType: string;
    tokenCount: number;
    responseStatus: 'success' | 'error' | 'timeout' | 'rate_limited' | 'rejected';
    durationMs?: number;
}
export interface LogSecurityEventParams {
    userId: string;
    sanitizedInput: string;
    detectionReason: string;
}
export interface AuditQueryFilters {
    userId?: string;
    startDate?: string;
    endDate?: string;
    requestType?: string;
    responseStatus?: string;
}
export declare class AuditLoggerService {
    private readonly supabaseService;
    private readonly logger;
    private readonly retryQueue;
    private retryTimer;
    private readonly MAX_RETRY_ATTEMPTS;
    private readonly RETRY_INTERVAL_MS;
    constructor(supabaseService: SupabaseService);
    logInteraction(params: LogInteractionParams): Promise<void>;
    logSecurityEvent(params: LogSecurityEventParams): Promise<void>;
    generateDailySummary(date?: Date): Promise<void>;
    queryAuditRecords(filters: AuditQueryFilters): Promise<AuditRecord[]>;
    getRetryQueueLength(): number;
    private enqueueForRetry;
    private startRetryProcessor;
    processRetryQueue(): Promise<void>;
    onModuleDestroy(): void;
    private getYesterday;
    private mapToAuditRecord;
}
