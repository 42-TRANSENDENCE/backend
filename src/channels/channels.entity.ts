import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ChannelMember } from './channelmember.entity';
import { ChannelBanMember } from './channelbanmember.entity';
import { Exclude } from 'class-transformer';
import { Chat } from './chats/chats.entity';
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

  // @Column({ nullable: true })
  // admin?: number[];
  // userid 배열로 admin을 가지고 있을까 아니면 User객체 자체를 연결 할ㄲ ㅏ..  ? 굳이 객체를 연결할 필요가 있나?
  // @ManyToMany(() => ChannelMember)
  // @JoinTable()
  // admins: ChannelMember[];

  @Column()
  owner: number;

  @Column('varchar', { length: 1000, nullable: true })
  @Exclude()
  password?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'enum', enum: ChannelStatus })
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
}
