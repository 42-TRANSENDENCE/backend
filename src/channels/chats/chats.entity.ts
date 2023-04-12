import { Channel } from '../channels.entity';
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
  OneToOne,
} from 'typeorm';
import { User } from 'src/users/users.entity';

// @Index('userId', ['senderId'], {})
// @Index('channelId', ['channelId'], {})
@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

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

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'SET NULL',
  })
  // @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => Channel, (channel) => channel.chats, {
    onDelete: 'SET NULL',
  })
  channel: Channel;
}
