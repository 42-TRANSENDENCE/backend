import { User } from 'src/users/users.entity';
import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryColumnCannotBeNullableError,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Channel } from './channels.entity';
import { ChannelMember } from './channelmember.entity';

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

  @ManyToOne(() => User, (user) => user.bannedChannels, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(
    () => Channel,
    (channelBanMember) => channelBanMember.bannedMembers,
    {
      onDelete: 'SET NULL',
    },
  )
  channel: Channel;
}
