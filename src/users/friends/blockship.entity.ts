import { User } from 'src/users/users.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class Blockship {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  otherUserId: number;

  @ManyToOne(() => User, (user) => user.friends, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, (user) => user.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'otherUserId' })
  otherUser: User;
}
