import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  INGAME = 'INGAME',
}

@Entity({ name: 'user'})
export class User {
  @PrimaryColumn()
  id: number;

  @Column()
  nickname: string;

  @Column()
  avatar: string;

  @Column({ default: false })
  useAuth: boolean;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.OFFLINE,
  })
  status: number;
}

