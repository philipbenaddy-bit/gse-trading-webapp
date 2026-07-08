import { RateLimitInfo } from '../interfaces/ai.interfaces';
export declare class ChatMessageDto {
    role: 'user' | 'assistant';
    content: string;
}
export declare class ChatDto {
    message: string;
    history?: ChatMessageDto[];
}
export declare class SentimentDto {
    headlines: string[];
}
export declare class SendMessageDto {
    message: string;
    conversationId?: string;
}
export declare class ChatResponseDto {
    conversationId: string;
    messageId: string;
    reply: string;
    disclaimer: string;
    rateLimitInfo: RateLimitInfo;
    dataSources: string[];
}
