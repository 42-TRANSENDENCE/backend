import { User } from 'src/users/users.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

export enum FriendStatus {
  SENT,
  RECEIVED,
  APPROVED,
  BLOCKED,
}

@Entity()
export class Friendship {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  otherUserId: number;

  @ManyToOne(() => User, (user) => user.friends)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, (otherUser) => otherUser.friends)
  @JoinColumn({ name: 'otherUserId' })
  otherUser: User;

  @Column({ type: 'enum', enum: FriendStatus })
  status: FriendStatus;
}
