import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChannelMember } from './channelmember.entity';
import { ChannelBanMember } from './channelbanmember.entity';
import { Exclude } from 'class-transformer';
import { Chats } from './chats/chats.entity';

export enum ChatStatus {
  PUBLIC = 'PUBLIC',
  PROTECTED = 'PROTECTED',
  PRIVATE = 'PRIVATE',
}

@Entity({ name: 'channel' })
export class Channels {
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

  @Column({ type: 'enum', enum: ChatStatus, nullable: true })
  status: ChatStatus;

  @OneToMany(() => ChannelMember, (channelmember) => channelmember.channel)
  members: ChannelMember[];

  @OneToMany(
    () => ChannelBanMember,
    (channelbanmember) => channelbanmember.channel,
  )
  bannedMembers: ChannelBanMember[];

  // chats: Chats[];

  // dm: Chats[];
  @OneToMany(() => Chats, (chats) => chats.chats)
  chats: Chats[];

  @OneToMany(() => Chats, (chats) => chats.dm)
  dm: Chats[];
}
