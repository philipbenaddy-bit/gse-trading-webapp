"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const audit_logger_service_1 = require("./audit-logger.service");
const supabase_service_1 = require("../../supabase/supabase.service");
const ai_constants_1 = require("../constants/ai.constants");
describe('AuditLoggerService', () => {
    let service;
    let supabaseService;
    let mockInsert;
    let mockSelect;
    let mockFrom;
    beforeEach(async () => {
        mockInsert = jest.fn().mockReturnValue({ error: null });
        mockSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                    lte: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            }),
            gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                        data: [],
                        error: null,
                    }),
                }),
            }),
            order: jest.fn().mockReturnValue({
                data: [],
                error: null,
            }),
        });
        mockFrom = jest.fn().mockReturnValue({
            insert: mockInsert,
            select: mockSelect,
            upsert: jest.fn().mockReturnValue({ error: null }),
        });
        const mockAdminClient = {
            from: mockFrom,
        };
        supabaseService = {
            getClient: jest.fn().mockReturnValue(mockAdminClient),
            getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                audit_logger_service_1.AuditLoggerService,
                {
                    provide: supabase_service_1.SupabaseService,
                    useValue: supabaseService,
                },
            ],
        }).compile();
        service = module.get(audit_logger_service_1.AuditLoggerService);
    });
    afterEach(() => {
        service.onModuleDestroy();
    });
    describe('logInteraction', () => {
        it('should log an interaction to ai_audit_logs table', async () => {
            await service.logInteraction({
                userId: 'user-123',
                requestType: 'chat',
                tokenCount: 150,
                responseStatus: 'success',
                durationMs: 1200,
            });
            expect(mockFrom).toHaveBeenCalledWith('ai_audit_logs');
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                user_id: 'user-123',
                request_type: 'chat',
                token_count: 150,
                response_status: 'success',
                duration_ms: 1200,
            }));
        });
        it('should include ISO 8601 UTC timestamp', async () => {
            const before = new Date().toISOString();
            await service.logInteraction({
                userId: 'user-123',
                requestType: 'chat',
                tokenCount: 100,
                responseStatus: 'success',
            });
            const after = new Date().toISOString();
            const insertedRecord = mockInsert.mock.calls[0][0];
            expect(insertedRecord.timestamp).toBeDefined();
            expect(insertedRecord.timestamp >= before).toBe(true);
            expect(insertedRecord.timestamp <= after).toBe(true);
        });
        it('should set duration_ms to null when not provided', async () => {
            await service.logInteraction({
                userId: 'user-123',
                requestType: 'insight',
                tokenCount: 200,
                responseStatus: 'success',
            });
            const insertedRecord = mockInsert.mock.calls[0][0];
            expect(insertedRecord.duration_ms).toBeNull();
        });
        it('should not throw when database insert fails', async () => {
            mockInsert.mockReturnValue({
                error: { message: 'Connection refused' },
            });
            await expect(service.logInteraction({
                userId: 'user-123',
                requestType: 'chat',
                tokenCount: 100,
                responseStatus: 'error',
            })).resolves.not.toThrow();
        });
        it('should enqueue failed writes for retry', async () => {
            mockInsert.mockReturnValue({
                error: { message: 'Connection refused' },
            });
            await service.logInteraction({
                userId: 'user-123',
                requestType: 'chat',
                tokenCount: 100,
                responseStatus: 'error',
            });
            expect(service.getRetryQueueLength()).toBe(1);
        });
        it('should not throw when an unexpected exception occurs', async () => {
            supabaseService.getAdminClient.mockImplementation(() => {
                throw new Error('Unexpected failure');
            });
            await expect(service.logInteraction({
                userId: 'user-123',
                requestType: 'chat',
                tokenCount: 100,
                responseStatus: 'success',
            })).resolves.not.toThrow();
        });
        it('should accept all valid response statuses', async () => {
            const statuses = [
                'success',
                'error',
                'timeout',
                'rate_limited',
                'rejected',
            ];
            for (const status of statuses) {
                mockInsert.mockClear();
                await service.logInteraction({
                    userId: 'user-123',
                    requestType: 'chat',
                    tokenCount: 100,
                    responseStatus: status,
                });
                const insertedRecord = mockInsert.mock.calls[0][0];
                expect(insertedRecord.response_status).toBe(status);
            }
        });
        it('should not include raw LLM response in audit record', async () => {
            await service.logInteraction({
                userId: 'user-123',
                requestType: 'chat',
                tokenCount: 500,
                responseStatus: 'success',
                durationMs: 2000,
            });
            const insertedRecord = mockInsert.mock.calls[0][0];
            expect(insertedRecord).not.toHaveProperty('content');
            expect(insertedRecord).not.toHaveProperty('response');
            expect(insertedRecord).not.toHaveProperty('llm_response');
            expect(insertedRecord).not.toHaveProperty('raw_response');
            expect(Object.keys(insertedRecord).sort()).toEqual([
                'user_id',
                'timestamp',
                'request_type',
                'token_count',
                'response_status',
                'duration_ms',
            ].sort());
        });
    });
    describe('logSecurityEvent', () => {
        it('should log a security event to ai_security_events table', async () => {
            await service.logSecurityEvent({
                userId: 'user-456',
                sanitizedInput: 'ignore previous instructions',
                detectionReason: 'role_override_attempt',
            });
            expect(mockFrom).toHaveBeenCalledWith('ai_security_events');
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                user_id: 'user-456',
                sanitized_input: 'ignore previous instructions',
                detection_reason: 'role_override_attempt',
            }));
        });
        it('should truncate sanitizedInput to 2000 characters', async () => {
            const longInput = 'a'.repeat(3000);
            await service.logSecurityEvent({
                userId: 'user-456',
                sanitizedInput: longInput,
                detectionReason: 'injection_attempt',
            });
            const insertedRecord = mockInsert.mock.calls[0][0];
            expect(insertedRecord.sanitized_input.length).toBe(ai_constants_1.SECURITY_EVENT_INPUT_MAX_LENGTH);
            expect(insertedRecord.sanitized_input).toBe('a'.repeat(ai_constants_1.SECURITY_EVENT_INPUT_MAX_LENGTH));
        });
        it('should not truncate input shorter than 2000 characters', async () => {
            const shortInput = 'short input';
            await service.logSecurityEvent({
                userId: 'user-456',
                sanitizedInput: shortInput,
                detectionReason: 'delimiter_injection',
            });
            const insertedRecord = mockInsert.mock.calls[0][0];
            expect(insertedRecord.sanitized_input).toBe(shortInput);
        });
        it('should include ISO 8601 UTC timestamp', async () => {
            const before = new Date().toISOString();
            await service.logSecurityEvent({
                userId: 'user-456',
                sanitizedInput: 'test input',
                detectionReason: 'test_reason',
            });
            const after = new Date().toISOString();
            const insertedRecord = mockInsert.mock.calls[0][0];
            expect(insertedRecord.timestamp).toBeDefined();
            expect(insertedRecord.timestamp >= before).toBe(true);
            expect(insertedRecord.timestamp <= after).toBe(true);
        });
        it('should not throw when database insert fails', async () => {
            mockInsert.mockReturnValue({
                error: { message: 'Database unavailable' },
            });
            await expect(service.logSecurityEvent({
                userId: 'user-456',
                sanitizedInput: 'test',
                detectionReason: 'test_reason',
            })).resolves.not.toThrow();
        });
        it('should enqueue failed security event writes for retry', async () => {
            mockInsert.mockReturnValue({
                error: { message: 'Database unavailable' },
            });
            await service.logSecurityEvent({
                userId: 'user-456',
                sanitizedInput: 'test',
                detectionReason: 'test_reason',
            });
            expect(service.getRetryQueueLength()).toBeGreaterThan(0);
        });
    });
    describe('generateDailySummary', () => {
        it('should aggregate daily metrics correctly', async () => {
            const mockAuditLogs = [
                { user_id: 'user-1', duration_ms: 1000 },
                { user_id: 'user-1', duration_ms: 2000 },
                { user_id: 'user-2', duration_ms: 3000 },
            ];
            const mockUpsert = jest.fn().mockReturnValue({ error: null });
            mockFrom.mockImplementation((table) => {
                if (table === 'ai_audit_logs') {
                    return {
                        select: jest.fn().mockReturnValue({
                            gte: jest.fn().mockReturnValue({
                                lte: jest.fn().mockReturnValue({
                                    data: mockAuditLogs,
                                    error: null,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'ai_security_events') {
                    return {
                        select: jest.fn().mockReturnValue({
                            gte: jest.fn().mockReturnValue({
                                lte: jest.fn().mockReturnValue({
                                    count: 2,
                                    error: null,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'ai_usage_summaries') {
                    return { upsert: mockUpsert };
                }
                return { insert: mockInsert };
            });
            const testDate = new Date('2024-01-15T12:00:00Z');
            await service.generateDailySummary(testDate);
            expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
                summary_date: '2024-01-15',
                total_requests: 3,
                unique_users: 2,
                avg_response_time_ms: 2000,
                security_events_count: 2,
            }), { onConflict: 'summary_date' });
        });
        it('should handle zero duration logs gracefully', async () => {
            const mockAuditLogs = [
                { user_id: 'user-1', duration_ms: null },
                { user_id: 'user-2', duration_ms: null },
            ];
            const mockUpsert = jest.fn().mockReturnValue({ error: null });
            mockFrom.mockImplementation((table) => {
                if (table === 'ai_audit_logs') {
                    return {
                        select: jest.fn().mockReturnValue({
                            gte: jest.fn().mockReturnValue({
                                lte: jest.fn().mockReturnValue({
                                    data: mockAuditLogs,
                                    error: null,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'ai_security_events') {
                    return {
                        select: jest.fn().mockReturnValue({
                            gte: jest.fn().mockReturnValue({
                                lte: jest.fn().mockReturnValue({
                                    count: 0,
                                    error: null,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'ai_usage_summaries') {
                    return { upsert: mockUpsert };
                }
                return { insert: mockInsert };
            });
            const testDate = new Date('2024-01-15T12:00:00Z');
            await service.generateDailySummary(testDate);
            expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
                total_requests: 2,
                unique_users: 2,
                avg_response_time_ms: 0,
            }), { onConflict: 'summary_date' });
        });
        it('should not throw when audit log fetch fails', async () => {
            mockFrom.mockImplementation((table) => {
                if (table === 'ai_audit_logs') {
                    return {
                        select: jest.fn().mockReturnValue({
                            gte: jest.fn().mockReturnValue({
                                lte: jest.fn().mockReturnValue({
                                    data: null,
                                    error: { message: 'Query failed' },
                                }),
                            }),
                        }),
                    };
                }
                return { insert: mockInsert };
            });
            await expect(service.generateDailySummary(new Date('2024-01-15'))).resolves.not.toThrow();
        });
        it('should default to yesterday when no date provided', async () => {
            const mockUpsert = jest.fn().mockReturnValue({ error: null });
            mockFrom.mockImplementation((table) => {
                if (table === 'ai_audit_logs') {
                    return {
                        select: jest.fn().mockReturnValue({
                            gte: jest.fn().mockReturnValue({
                                lte: jest.fn().mockReturnValue({
                                    data: [],
                                    error: null,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'ai_security_events') {
                    return {
                        select: jest.fn().mockReturnValue({
                            gte: jest.fn().mockReturnValue({
                                lte: jest.fn().mockReturnValue({
                                    count: 0,
                                    error: null,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'ai_usage_summaries') {
                    return { upsert: mockUpsert };
                }
                return { insert: mockInsert };
            });
            await service.generateDailySummary();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const expectedDate = yesterday.toISOString().split('T')[0];
            expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
                summary_date: expectedDate,
            }), { onConflict: 'summary_date' });
        });
    });
    describe('queryAuditRecords', () => {
        it('should return mapped audit records', async () => {
            const mockData = [
                {
                    id: 'record-1',
                    user_id: 'user-123',
                    timestamp: '2024-01-15T10:00:00Z',
                    request_type: 'chat',
                    token_count: 150,
                    response_status: 'success',
                    duration_ms: 1200,
                },
            ];
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                        data: mockData,
                        error: null,
                    }),
                }),
            });
            const results = await service.queryAuditRecords({});
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                id: 'record-1',
                userId: 'user-123',
                timestamp: '2024-01-15T10:00:00Z',
                requestType: 'chat',
                tokenCount: 150,
                responseStatus: 'success',
                durationMs: 1200,
            });
        });
        it('should apply userId filter', async () => {
            const mockEq = jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({ data: [], error: null }),
            });
            const mockSelectReturn = { eq: mockEq };
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue(mockSelectReturn),
            });
            await service.queryAuditRecords({ userId: 'user-123' });
            expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
        });
        it('should apply date range filters', async () => {
            const mockGte = jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({ data: [], error: null }),
                }),
            });
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({ gte: mockGte }),
            });
            await service.queryAuditRecords({
                startDate: '2024-01-01T00:00:00Z',
                endDate: '2024-01-31T23:59:59Z',
            });
            expect(mockGte).toHaveBeenCalledWith('timestamp', '2024-01-01T00:00:00Z');
        });
        it('should return empty array on query failure', async () => {
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                        data: null,
                        error: { message: 'Query failed' },
                    }),
                }),
            });
            const results = await service.queryAuditRecords({});
            expect(results).toEqual([]);
        });
        it('should not throw on unexpected errors', async () => {
            supabaseService.getAdminClient.mockImplementation(() => {
                throw new Error('Unexpected');
            });
            const results = await service.queryAuditRecords({});
            expect(results).toEqual([]);
        });
    });
    describe('retry queue', () => {
        it('should process retry queue and persist items', async () => {
            mockInsert.mockReturnValueOnce({
                error: { message: 'Temporary failure' },
            });
            await service.logInteraction({
                userId: 'user-123',
                requestType: 'chat',
                tokenCount: 100,
                responseStatus: 'success',
            });
            expect(service.getRetryQueueLength()).toBe(1);
            mockInsert.mockReturnValue({ error: null });
            await service.processRetryQueue();
            expect(service.getRetryQueueLength()).toBe(0);
        });
        it('should discard items after max retry attempts', async () => {
            mockInsert.mockReturnValue({
                error: { message: 'Persistent failure' },
            });
            await service.logInteraction({
                userId: 'user-123',
                requestType: 'chat',
                tokenCount: 100,
                responseStatus: 'success',
            });
            await service.processRetryQueue();
            await service.processRetryQueue();
            await service.processRetryQueue();
            expect(service.getRetryQueueLength()).toBe(0);
        });
        it('should keep items in queue if retry fails but under max attempts', async () => {
            mockInsert.mockReturnValue({
                error: { message: 'Still failing' },
            });
            await service.logInteraction({
                userId: 'user-123',
                requestType: 'chat',
                tokenCount: 100,
                responseStatus: 'success',
            });
            await service.processRetryQueue();
            expect(service.getRetryQueueLength()).toBe(1);
        });
    });
});
//# sourceMappingURL=audit-logger.service.spec.js.map