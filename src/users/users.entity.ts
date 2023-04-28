import { Exclude } from 'class-transformer';
import { ChannelMember } from 'src/channels/entity/channelmember.entity';
import { ChannelBanMember } from 'src/channels/entity/channelbanmember.entity';
import {
  Column,
  Entity,
  PrimaryColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { GameHistory } from 'src/game/history/history.entity';
import { Friendship } from 'src/users/friends/friendship.entity';
import { Achievement } from 'src/achievement/achievement.entity';
import { Blockship } from 'src/users/friends/blockship.entity';
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

  blocks: Blockship[];

  @OneToMany(() => GameHistory, (gamehistory) => gamehistory.winner)
  wins: GameHistory[];

  @OneToMany(() => GameHistory, (gamehistory) => gamehistory.loser)
  loses: GameHistory[];

  @OneToMany(() => ChannelMember, (channelmember) => channelmember.user)
  channelMembers: ChannelMember[];

  @OneToMany(
    () => ChannelBanMember,
    (channelbanmember) => channelbanmember.user,
  )
  channelBanMembers: ChannelBanMember[];
}
