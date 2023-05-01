import { User } from 'src/users/users.entity';
import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  Column,
  ManyToOne,
  PrimaryColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Channel } from './channels.entity';

@Entity({ name: 'channel_banmember' })
export class ChannelBanMember {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  channelId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.channelBanMembers, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(
    () => Channel,
    (channelBanMember) => channelBanMember.bannedMembers,
    {
      onDelete: 'CASCADE',
    },
  )
  channel: Channel;

  @DeleteDateColumn()
  deletedAt: Date;
}
