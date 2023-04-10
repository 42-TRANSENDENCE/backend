import { Channel } from '../channels.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  OneToOne,
} from 'typeorm';
import { User } from 'src/users/users.entity';

// @Index('userId', ['senderId'], {})
// @Index('channelId', ['channelId'], {})
@Entity()
export class Chat {
  // @PrimaryGeneratedColumn()
  // id: number;

  @Column('varchar', {
    length: 100,
  })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @PrimaryColumn()
  channelId: number;

  @Column() // 얘를 유저 아이디랑 묶어야 겠다.
  senderId: number;

  @Column({ nullable: true }) // 얘도 유저 아이디랑 묶어야 겠다.
  receiverId?: number;

  @ManyToOne(() => Channel, (channel) => channel.chats, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'channelId' })
  chats: Channel;

  // @ManyToOne(() => Channels, (channel) => channel.dm, { onDelete: 'SET NULL' })
  // dm: Chats;

  // @OneToOne(() => User, (user) => user.id) // specify inverse side as a second parameter
  // senderId: User;

  // @OneToOne(() => User, (user) => user.profile) // specify inverse side as a second parameter
  //   user: User

  // @OneToOne(() => User)
  // @JoinColumn({ name: 'senderId' })
  // sender: User;
}
