import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ChannelMember } from './channelmember.entity';
import { ChannelBanMember } from './channelbanmember.entity';
import { Exclude } from 'class-transformer';
import { Chat } from './chats/chats.entity';
import { JoinAttribute } from 'typeorm/query-builder/JoinAttribute';

export enum ChannelStatus {
  PUBLIC = 'PUBLIC',
  PROTECTED = 'PROTECTED',
  PRIVATE = 'PRIVATE',
}

@Entity({ name: 'channel' })
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 30, default: 'default' })
  title: string;

  @Column({ nullable: true })
  admin?: number;

  @Column({ nullable: true })
  owner?: number;

  @Column('varchar', { length: 1000, nullable: true })
  @Exclude()
  password?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'enum', enum: ChannelStatus, nullable: true })
  status: ChannelStatus;

  @OneToMany(() => ChannelMember, (channelmember) => channelmember.channel)
  members: ChannelMember[];

  @OneToMany(
    () => ChannelBanMember,
    (channelbanmember) => channelbanmember.channel,
  )
  bannedMembers: ChannelBanMember[];

  @OneToMany(() => Chat, (chats) => chats.channelId)
  chats: Chat[];

  // @OneToMany(() => Chats, (chats) => chats.dm)
  // dm: Chats[];
}
