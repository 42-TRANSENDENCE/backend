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

@Index('UserId', ['UserId'], {})
@Index('ChannelId', ['ChannelId'], {})
@Entity()
export class Chats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', {
    length: 100,
    nullable: true,
  })
  content?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  ChannelId?: number;

  @Column({ nullable: true })
  SenderId?: number;

  @Column({ nullable: true })
  ReceiverId?: number;

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
