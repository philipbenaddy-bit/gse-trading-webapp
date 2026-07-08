import { User } from '../../users/entities/user.entity';
import { NewsEntity } from './news.entity';
export declare class CommentEntity {
    id: string;
    newsId: string;
    news: NewsEntity;
    userId: string;
    user: User;
    content: string;
    parentId: string;
    parent: CommentEntity;
    replyCount: number;
    reactionCount: number;
    createdAt: Date;
    updatedAt: Date;
}
