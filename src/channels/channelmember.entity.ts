import { User } from 'src/users/users.entity';
import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Channels } from './channels.entity';

@Entity({ name: 'channelMember' })
export class ChannelMember {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  channelId: number;

  @ManyToOne(() => User, (user) => user.memberchannels, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Channels, (channelMember) => channelMember.members, {
    onDelete: 'SET NULL',
  })
  channel: Channels;
}
