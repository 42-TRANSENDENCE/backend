import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Title {
  FIRST_LOGIN = 'FIRST_LOGIN',
  FIRST_GAME = 'FIRST_GAME',
  FIRST_FREINDSHIP = 'FIRST_FRIENDSHIP',
  WIN_TEN_GAME = 'WIN_TEN_GAME',
}

@Entity()
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: Title })
  title: Title;
}
