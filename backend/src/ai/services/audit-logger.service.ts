import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { AuditRecord, SecurityEvent } from '../interfaces/ai.interfaces';
import { SECURITY_EVENT_INPUT_MAX_LENGTH } from '../constants/ai.constants';

/**
 * Represents a failed audit write queued for retry.
 */
interface RetryQueueItem {
  table: string;
  record: Record<string, unknown>;
  enqueuedAt: Date;
  retryCount: number;
}

/**
 * Parameters for logging an AI interaction.
 */
export interface LogInteractionParams {
  userId: string;
  requestType: string;
  tokenCount: number;
  responseStatus:
    | 'success'
    | 'error'
    | 'timeout'
    | 'rate_limited'
    | 'rejected';
  durationMs?: number;
}

/**
 * Parameters for logging a security event.
 */
export interface LogSecurityEventParams {
  userId: string;
  sanitizedInput: string;
  detectionReason: string;
}

/**
 * Filters for querying audit records.
 */
export interface AuditQueryFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  requestType?: string;
  responseStatus?: string;
}

/**
 * Audit Logger Service
 *
 * Records all AI interactions for compliance and security monitoring.
 * - Logs interactions to ai_audit_logs table
 * - Logs security events to ai_security_events table
 * - Generates daily usage summaries into ai_usage_summaries
 * - Provides query interface for compliance reporting
 *
 * Key design principles:
 * - Never disrupts AI interactions if logging fails (all operations wrapped in try/catch)
 * - Excludes raw LLM responses from audit records
 * - Implements in-memory retry queue for failed writes (retry within 5 minutes)
 * - Truncates security event input to SECURITY_EVENT_INPUT_MAX_LENGTH (2000 chars)
 */
@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);
  private readonly retryQueue: RetryQueueItem[] = [];
  private retryTimer: NodeJS.Timeout | null = null;

  /** Maximum retry attempts before discarding a queued item */
  private readonly MAX_RETRY_ATTEMPTS = 3;

  /** Retry interval in milliseconds (5 minutes) */
  private readonly RETRY_INTERVAL_MS = 5 * 60 * 1000;

  constructor(private readonly supabaseService: SupabaseService) {
    this.startRetryProcessor();
  }

  /**
   * Logs an AI interaction to the ai_audit_logs table.
   * Records: user ID, ISO 8601 UTC timestamp, request type, token count, response status.
   * Excludes raw LLM responses from the record.
   * Never throws — failures are queued for retry.
   */
  async logInteraction(params: LogInteractionParams): Promise<void> {
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
        this.logger.warn(
          `Failed to persist audit log for user ${params.userId}: ${error.message}`,
        );
        this.enqueueForRetry('ai_audit_logs', record);
      }
    } catch (err) {
      this.logger.warn(
        `Audit logging failed for user ${params.userId}: ${(err as Error).message}`,
      );
      // Never throw — audit failures must not disrupt AI interactions
    }
  }

  /**
   * Logs a security event to the ai_security_events table.
   * Truncates sanitizedInput to SECURITY_EVENT_INPUT_MAX_LENGTH (2000 chars).
   * Never throws — failures are queued for retry.
   */
  async logSecurityEvent(params: LogSecurityEventParams): Promise<void> {
    try {
      const truncatedInput = params.sanitizedInput.slice(
        0,
        SECURITY_EVENT_INPUT_MAX_LENGTH,
      );

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
        this.logger.warn(
          `Failed to persist security event for user ${params.userId}: ${error.message}`,
        );
        this.enqueueForRetry('ai_security_events', record);
      }
    } catch (err) {
      this.logger.warn(
        `Security event logging failed for user ${params.userId}: ${(err as Error).message}`,
      );
      // Never throw — audit failures must not disrupt AI interactions
    }
  }

  /**
   * Generates a daily summary of AI usage metrics.
   * Aggregates: total requests, unique users, average response time, security events count.
   * Stores the summary in ai_usage_summaries table.
   *
   * @param date - The date to summarize (defaults to yesterday)
   */
  async generateDailySummary(date?: Date): Promise<void> {
    try {
      const summaryDate = date || this.getYesterday();
      const startOfDay = new Date(summaryDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(summaryDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const client = this.supabaseService.getAdminClient();

      // Fetch audit logs for the day
      const { data: auditLogs, error: auditError } = await client
        .from('ai_audit_logs')
        .select('user_id, duration_ms')
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString());

      if (auditError) {
        this.logger.error(
          `Failed to fetch audit logs for daily summary: ${auditError.message}`,
        );
        return;
      }

      // Fetch security events count for the day
      const { count: securityEventsCount, error: securityError } = await client
        .from('ai_security_events')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString());

      if (securityError) {
        this.logger.error(
          `Failed to fetch security events for daily summary: ${securityError.message}`,
        );
        return;
      }

      const logs = auditLogs || [];
      const totalRequests = logs.length;
      const uniqueUsers = new Set(logs.map((log) => log.user_id)).size;

      // Calculate average response time (only from logs that have duration_ms)
      const durationsMs = logs
        .map((log) => log.duration_ms)
        .filter((d): d is number => d !== null && d !== undefined);
      const avgResponseTimeMs =
        durationsMs.length > 0
          ? Math.round(
              durationsMs.reduce((sum, d) => sum + d, 0) / durationsMs.length,
            )
          : 0;

      // Format date as YYYY-MM-DD for the summary_date column
      const summaryDateStr = startOfDay.toISOString().split('T')[0];

      // Upsert the daily summary
      const { error: upsertError } = await client
        .from('ai_usage_summaries')
        .upsert(
          {
            summary_date: summaryDateStr,
            total_requests: totalRequests,
            unique_users: uniqueUsers,
            avg_response_time_ms: avgResponseTimeMs,
            security_events_count: securityEventsCount || 0,
            generated_at: new Date().toISOString(),
          },
          { onConflict: 'summary_date' },
        );

      if (upsertError) {
        this.logger.error(
          `Failed to upsert daily summary for ${summaryDateStr}: ${upsertError.message}`,
        );
        return;
      }

      this.logger.log(
        `Daily summary generated for ${summaryDateStr}: ${totalRequests} requests, ${uniqueUsers} users`,
      );
    } catch (err) {
      this.logger.error(
        `Daily summary generation failed: ${(err as Error).message}`,
      );
      // Never throw — summary generation failure should not disrupt operations
    }
  }

  /**
   * Queries audit records with optional filters.
   * Supports filtering by user ID, date range, request type, and response status.
   */
  async queryAuditRecords(filters: AuditQueryFilters): Promise<AuditRecord[]> {
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
        this.logger.error(
          `Failed to query audit records: ${error.message}`,
        );
        return [];
      }

      return (data || []).map(this.mapToAuditRecord);
    } catch (err) {
      this.logger.error(
        `Audit record query failed: ${(err as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Returns the current retry queue length (for testing/monitoring).
   */
  getRetryQueueLength(): number {
    return this.retryQueue.length;
  }

  /**
   * Enqueues a failed write for retry within 5 minutes.
   */
  private enqueueForRetry(
    table: string,
    record: Record<string, unknown>,
  ): void {
    this.retryQueue.push({
      table,
      record,
      enqueuedAt: new Date(),
      retryCount: 0,
    });

    this.logger.debug(
      `Enqueued failed write to ${table} for retry. Queue size: ${this.retryQueue.length}`,
    );
  }

  /**
   * Starts the retry processor that periodically attempts to persist queued items.
   */
  private startRetryProcessor(): void {
    this.retryTimer = setInterval(() => {
      this.processRetryQueue();
    }, this.RETRY_INTERVAL_MS);

    // Ensure the timer doesn't prevent process exit
    if (this.retryTimer.unref) {
      this.retryTimer.unref();
    }
  }

  /**
   * Processes the retry queue, attempting to persist each queued item.
   * Removes items that succeed or exceed MAX_RETRY_ATTEMPTS.
   */
  async processRetryQueue(): Promise<void> {
    if (this.retryQueue.length === 0) {
      return;
    }

    this.logger.debug(
      `Processing retry queue: ${this.retryQueue.length} items`,
    );

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
            this.logger.debug(
              `Retry ${item.retryCount}/${this.MAX_RETRY_ATTEMPTS} failed for ${item.table}: ${error.message}`,
            );
          } else {
            this.logger.error(
              `Discarding audit record for ${item.table} after ${this.MAX_RETRY_ATTEMPTS} failed attempts: ${error.message}`,
            );
          }
        } else {
          this.logger.debug(
            `Successfully persisted queued audit record to ${item.table}`,
          );
        }
      } catch (err) {
        item.retryCount++;
        if (item.retryCount < this.MAX_RETRY_ATTEMPTS) {
          this.retryQueue.push(item);
        } else {
          this.logger.error(
            `Discarding audit record for ${item.table} after ${this.MAX_RETRY_ATTEMPTS} failed attempts`,
          );
        }
      }
    }
  }

  /**
   * Cleans up the retry timer on module destroy.
   */
  onModuleDestroy(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
   * Gets yesterday's date (for default daily summary generation).
   */
  private getYesterday(): Date {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  /**
   * Maps a database row to an AuditRecord interface.
   */
  private mapToAuditRecord(row: any): AuditRecord {
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
}
