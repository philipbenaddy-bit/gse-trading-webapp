import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('news')
@Index(['category'])
@Index(['createdAt'])
export class NewsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  summary: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  source: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'source_url' })
  sourceUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'simple-array', nullable: true, name: 'related_symbols' })
  relatedSymbols: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ type: 'uuid', name: 'author_id', nullable: true })
  @Index()
  authorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'int', default: 0, name: 'comment_count' })
  commentCount: number;

  @Column({ type: 'int', default: 0, name: 'reaction_count' })
  reactionCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
