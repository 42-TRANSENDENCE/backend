import { Exclude } from 'class-transformer';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { Friendship } from 'src/users/friends/friendship.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  INGAME = 'INGAME',
}

@Entity({ name: 'user' })
export class User {
  @PrimaryColumn()
  id: number;

  @Column({ unique: true })
  nickname: string;

  @Column({
    type: 'bytea',
    nullable: false,
  })
  @Exclude()
  avatar: Uint8Array;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.OFFLINE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  @Exclude()
  hashedRefreshToken?: string;

  @Column({ nullable: true })
  @Exclude()
  twoFactorSecret?: string;

  @Column({ default: false })
  isTwoFactorAuthenticationEnabled: boolean;

  @ManyToOne(() => ChannelMember, (channelmember) => channelmember.users)
  channelMember: User

  @OneToMany(() => Friendship, (friends) => friends.user)
  friends: Friendship[];

  @ManyToMany(() => User, (user) => user.blocked, { onDelete: 'CASCADE' })
  @JoinTable()
  blocked: User[];
}
