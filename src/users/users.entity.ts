import { Exclude } from 'class-transformer';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { ChannelBanMember } from 'src/channels/channelbanmember.entity';
import {
  Column,
  Entity,
  PrimaryColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { GameHistory } from 'src/game/history/history.entity';
import { Friendship } from 'src/users/friends/friendship.entity';
import { Achievement } from 'src/achievement/achievement.entity';

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  INGAME = 'INGAME',
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

  @Column({ nullable: true })
  @Exclude()
  hashedRefreshToken?: string;

  @Column({ nullable: true })
  @Exclude()
  twoFactorSecret?: string;

  @Column({ default: false })
  isTwoFactorAuthenticationEnabled: boolean;

  @ManyToMany(() => Achievement)
  @JoinTable()
  achievements: Achievement[];

  friends: Friendship[];

  @OneToMany(() => GameHistory, (gamehistory) => gamehistory.winner)
  wins: GameHistory[];

  @OneToMany(() => GameHistory, (gamehistory) => gamehistory.loser)
  loses: GameHistory[];

  @OneToMany(() => ChannelMember, (channelmember) => channelmember.user)
  memberchannels: ChannelMember[];

  @OneToMany(
    () => ChannelBanMember,
    (channelbanmember) => channelbanmember.user,
  )
  bannedChannels: ChannelBanMember[];
}
