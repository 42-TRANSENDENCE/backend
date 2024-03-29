import { User } from 'src/users/users.entity';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Channel } from './channels.entity';

export enum MemberType {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

@Entity({ name: 'channel_member' })
export class ChannelMember {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  channelId: number;

  @Column({ type: 'enum', enum: MemberType })
  type: MemberType;

  @ManyToOne(() => User, (user) => user.channelMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Channel, (channelMember) => channelMember.members, {
    onDelete: 'CASCADE', // SET NULL
  })
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @DeleteDateColumn()
  deletedAt: Date;
}
