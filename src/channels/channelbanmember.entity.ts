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
import { Channels } from './channels.entity';
import { ChannelMember } from './channelmember.entity';

@Entity()
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
    () => Channels,
    (channelBanMember) => channelBanMember.bannedMembers,
    { onDelete: 'SET NULL' },
  )
  channel: Channels;
}
