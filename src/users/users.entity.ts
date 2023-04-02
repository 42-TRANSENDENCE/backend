import { Exclude } from 'class-transformer';
import { ChannelMember } from 'src/channels/channelmember.entity';
import { Column, Entity, PrimaryColumn, ManyToOne, ManyToMany } from 'typeorm';
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
  achievement: Achievement[];

  friends: Friendship[];

  histories: GameHistory[];

  @ManyToOne(() => ChannelMember, (channelmember) => channelmember.users)
  channelMember: User;
}
