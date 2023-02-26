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
  
    @Column('varchar', { name: 'name', length: 30 })
    name: string;
  
    @Column('smallint', {
      name: 'private',
      nullable: true,
      width: 1,
      default: () => "'0'",
    })
    private: boolean | null;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;   
}