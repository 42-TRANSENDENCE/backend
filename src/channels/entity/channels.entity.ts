import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
  DeleteDateColumn,
} from 'typeorm';
import { ChannelMember } from './channelmember.entity';
import { ChannelBanMember } from './channelbanmember.entity';
import { Exclude } from 'class-transformer';
import { Chat } from '../chats/chats.entity';
import { User } from 'src/users/users.entity';

export enum ChannelStatus {
  PUBLIC = 'PUBLIC',
  PROTECTED = 'PROTECTED',
  PRIVATE = 'PRIVATE',
}

@Entity({ name: 'channel' })
@Unique(['title'])
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 30, default: 'default' })
  title: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner' })
  owner: User;

  @Column('varchar', { length: 1000, nullable: true })
  @Exclude()
  password?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'enum', enum: ChannelStatus })
  status: ChannelStatus;

  @Column({ nullable: true })
  reciveId: number;

  @OneToMany(() => ChannelMember, (channelmember) => channelmember.channel)
  members: ChannelMember[];

  @OneToMany(
    () => ChannelBanMember,
    (channelbanmember) => channelbanmember.channel,
  )
  bannedMembers: ChannelBanMember[];

  @OneToMany(() => Chat, (chats) => chats.channelId)
  chats: Chat[];

  @DeleteDateColumn()
  deletedAt: Date;
}
