import { User } from '../../users/entities/user.entity';
import { NewsEntity } from './news.entity';
export declare class ReactionEntity {
    id: string;
    newsId: string;
    news: NewsEntity;
    userId: string;
    user: User;
    type: string;
    createdAt: Date;
}
