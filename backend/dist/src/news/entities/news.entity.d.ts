import { User } from '../../users/entities/user.entity';
export declare class NewsEntity {
    id: string;
    title: string;
    content: string;
    summary: string;
    source: string;
    sourceUrl: string;
    imageUrl: string;
    relatedSymbols: string[];
    category: string;
    authorId: string;
    author: User;
    viewCount: number;
    commentCount: number;
    reactionCount: number;
    createdAt: Date;
    updatedAt: Date;
}
