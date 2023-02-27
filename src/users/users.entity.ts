import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  INGAME = 'INGAME',
}

@Entity()
export class User {
  @PrimaryColumn()
  id: number;

  @Column({ unique: true })
  nickname: string;

  @Column({ default: '12345' })
  avatar: string;

  @Column({ default: false })
  useAuth: boolean;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.OFFLINE,
  })
  status: UserStatus;

  @Column()
  refreshToken: string;

  @Column({ nullable: true })
  twoFactorSecret: string;
}
