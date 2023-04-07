import { Channels } from '../channels.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';

@Index('userId', ['senderId'], {})
@Index('channelId', ['channelId'], {})
@Entity()
export class Chats {
  @Column('varchar', {
    length: 100,
  })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @PrimaryColumn()
  channelId: number;

  @Column() // 얘를 유저 아이디랑 묶어야 겠다.
  senderId: number;

  @Column({ nullable: true }) // 얘도 유저 아이디랑 묶어야 겠다.
  receiverId?: number;

  @ManyToOne(() => Channels, (channel) => channel.chats, {
    onDelete: 'SET NULL',
  })
  // @JoinColumn({ name: 'channelId' })
  chats: Chats;

  @ManyToOne(() => Channels, (channel) => channel.dm, { onDelete: 'SET NULL' })
  dm: Chats;
}
