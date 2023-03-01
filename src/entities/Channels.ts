import { Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
     } from "typeorm";

@Entity({ schema: 'j_test'})
export class Channels {
    @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;
  
    @Column('varchar', { name: 'title', length: 30 })
    title: string;
  
    @Column('smallint', {
      name: 'private',
      nullable: true,
      width: 1,
      default: () => "'0'",
    })
    private: boolean | null;
    
    @Column('int', {name: 'max', default: 10})
    max: number;

    @Column('varchar', {name: 'password', length: 30})
    password: string;

    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;   
}