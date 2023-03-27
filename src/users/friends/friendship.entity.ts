import { User } from 'src/users/users.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

export enum FriendStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

@Entity()
export class Friendship {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  otherUserId: number;

  @ManyToOne(() => User, (user) => user.friends, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, (otherUser) => otherUser.friends, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'otherUserId' })
  otherUser: User;

  @Column({ type: 'enum', enum: FriendStatus })
  status: FriendStatus;
}
