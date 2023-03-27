import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// import { ChannelMember } from './channelcember.entity';

@Entity()
export class Channels {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 30, default: 'default' })
  title: string;

  @Column({ nullable: true })
  owner?: number;

  @Column({
    nullable: true,
  })
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
}
