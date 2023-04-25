import { Channel } from '../entity/channels.entity';
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
import { isNotEmpty } from 'class-validator';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', {
    length: 100,
    nullable: true,
  })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @PrimaryColumn()
  channelId: number;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE', // SET NULL
  })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => Channel, (channel) => channel.chats, {
    onDelete: 'CASCADE',
  })
  channel: Channel;
}
