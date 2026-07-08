export declare class ConversationSummaryDto {
    id: string;
    title: string;
    updatedAt: string;
    messageCount: number;
}
export declare class ConversationListDto {
    conversations: ConversationSummaryDto[];
}
