import { User } from 'src/users/users.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class GameHistory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => User, (user) => user.histories, { onDelete: 'SET NULL' })
  winner: User;

  @ManyToOne(() => User, (user) => user.histories, { onDelete: 'SET NULL' })
  loser: User;

  @Column({ type: 'smallint' })
  winnerScore: number;

  @Column({ type: 'smallint' })
  loserScore: number;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime?: Date;
}
