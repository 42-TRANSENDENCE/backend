import { Exclude } from 'class-transformer';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { Column, Entity, PrimaryColumn, ManyToOne } from 'typeorm';
import { GameHistory } from 'src/game/history/history.entity';
import { Friendship } from 'src/users/friends/friendship.entity';

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  INGAME = 'INGAME',
}

export enum Achievement {
  FIRST_LOGIN = 'FIRST_LOGIN',
  FIRST_GAME = 'FIRST_GAME',
  FIRST_FREINDSHIP = 'FIRST_FRIENDSHIP',
  WIN_TEN_GAME = 'WIN_TEN_GAME',
}

@Entity({ name: 'user' })
export class User {
  @PrimaryColumn()
  id: number;

  @Column({ unique: true, type: 'varchar', length: 15 })
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

  @Column({ type: 'enum', enum: Achievement })
  acheivements: Achievement[];

  friends: Friendship[];

  histories: GameHistory[];
  @ManyToOne(() => ChannelMember, (channelmember) => channelmember.users)
  channelMember: User;
}
