import { Exclude } from 'class-transformer';
<<<<<<< HEAD
import { ChannelMember } from 'src/channels/channelmember.entity';
import { Column, Entity, PrimaryColumn, ManyToOne } from 'typeorm';
=======
import { Friendship } from 'src/users/friends/friendship.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
>>>>>>> 26b5bd338b0ce8ad014086f84fc1864bc8446f03

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
<<<<<<< HEAD

  @ManyToOne(() => ChannelMember, (channelmember) => channelmember.users)
  channelMember: User
}
=======
>>>>>>> 26b5bd338b0ce8ad014086f84fc1864bc8446f03

  @OneToMany(() => Friendship, (friends) => friends.user)
  friends: Friendship[];

  @ManyToMany(() => User, (user) => user.blocked, { onDelete: 'CASCADE' })
  @JoinTable()
  blocked: User[];
}
