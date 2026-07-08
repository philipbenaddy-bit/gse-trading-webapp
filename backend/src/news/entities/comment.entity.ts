import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NewsEntity } from './news.entity';

@Entity('comments')
@Index(['newsId', 'createdAt'])
@Index(['parentId'])
export class CommentEntity {
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

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => CommentEntity, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: CommentEntity;

  @Column({ type: 'int', default: 0, name: 'reply_count' })
  replyCount: number;

  @Column({ type: 'int', default: 0, name: 'reaction_count' })
  reactionCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
