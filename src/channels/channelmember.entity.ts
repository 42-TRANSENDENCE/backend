import { User } from 'src/users/users.entity';
import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Channels } from './channels.entity';

@Entity()
export class ChannelMember {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ primary: true })
  channelId: number;

  @Column({ primary: true })
  userId: number;
  /**
   * 1 : M 관계 설정
   * @ManyToOne
   * 여기서 Many 는 채널 이고 One이 멤버 이다.
   */
  // @ManyToOne(() => Channels)
  // @JoinColumn({name: "ChannelId"})
  // channelMember: ChannelMember;
  @OneToMany(() => User, (user) => user.channelMember)
  users: User[];

  @ManyToOne(() => Channels, (channelMember) => channelMember.ChannelMembers)
  Channel: Channels;
}
