import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Index('userId', ['id'], {})
@Index('channelId', ['channelId'], {})
@Entity()
export class Chats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', {
    length: 100,
  })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  channelId: number;

  @Column()
  senderId: number;

  @Column({ nullable: true })
  receiverId?: number;

  // @ManyToOne(() => User, (users) => users.ChannelChats, {
  //     onDelete: 'SET NULL',
  //     onUpdate: 'CASCADE',
  // })
  // @JoinColumn([{ name: 'UserId', referencedColumnName: 'id' }])
  // User: User;

  // @ManyToOne(() => Channels, (channels) => channels.ChannelChats, {
  //     onDelete: 'SET NULL',
  //     onUpdate: 'CASCADE',
  // })
  // @JoinColumn([{ name: 'ChannelId', referencedColumnName: 'id' }])
  // Channel: Channels;
}
