import { Exclude } from 'class-transformer';
import { Friendship } from 'src/friends/friend.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

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

  @OneToMany(() => Friendship, (friends) => friends.user)
  friends: Friendship[];
}
