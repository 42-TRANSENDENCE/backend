import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChannelMember } from './channelmember.entity';
import { Chats } from './chats/chats.entity';
// import { ChannelMember } from './channelcember.entity';

@Entity()
export class Channels {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 30, default: 'default' })
  title: string;

  @Column({ nullable: true })
  admin?: number;

  @Column({ nullable: true })
  owner?: number;

  @Column({ nullable: true })
  private?: boolean;

  @Column('varchar', { length: 1000, default: '' })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  // @OneToMany(() => ChannelMember, (ChannelMember) => ChannelMember.Channel, {
  //   cascade: ['insert'],
  // })
  // ChannelMember: ChannelMember[];

  // 이거 나중에 해야해.
  //@OneToMany(() => Chats, (channelchats) => channelchats.Channel)
  //ChannelChats: Chats[];
  // @ManyToOne(() => User, (user) => user.photos)
  // user: User
  @OneToMany(() => ChannelMember, (ChannelMember) => ChannelMember.Channel)
  ChannelMembers: ChannelMember[];
}
