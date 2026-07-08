import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NewsEntity } from './news.entity';

@Entity('reactions')
@Unique(['newsId', 'userId']) // One reaction per user per news item
@Index(['newsId', 'type'])
export class ReactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'news_id' })
  @Index()
  newsId: string;

  @ManyToOne(() => NewsEntity)
  @JoinColumn({ name: 'news_id' })
  news: NewsEntity;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 10 })
  type: string; // Emoji: 👍, 📈, 📉, 🔥, 💡

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
