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
} from 'typeorm';
import { Channels } from './channels.entity';

@Entity()
export class ChannelBanMember {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ primary: true })
  ChannelId: number;

  @Column({ primary: true })
  UserId: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    // default: () => "'0'"
  })
  expiresAt: Date;
  // @Column({ array: true, default: '{}' })
  // channelMember: string[];
  /**
   * 1 : M 관계 설정
   * @ManyToOne
   * 여기서 Many 는 채널 이고 One이 멤버 이다.
   */
  // @ManyToOne(() => Channels)
  // @JoinColumn({name: "ChannelId"})
  // channelMember: ChannelMember;

  // @OneToMany(() => User, (user) => user.channelBanMember)
  // users: User[]

  // @ManyToOne(() => Channels, (channelBanMember) => channelBanMember.ChannelBanMembers)
  // Channel: Channels
}
