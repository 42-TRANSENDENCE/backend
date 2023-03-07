import { PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
 } from "typeorm";

@Entity({ name: 'chats' })
export class Chats {
    @PrimaryGeneratedColumn({type:'int', name: 'id'})
    id : number;

    @Column('text', { name: 'content' })
    content: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @Column('int', { name: 'WorkspaceId', nullable: true })
    WorkspaceId: number | null;
  
    @Column('int', { name: 'SenderId', nullable: true })
    SenderId: number | null;
  
    @Column('int', { name: 'ReceiverId', nullable: true })
    ReceiverId: number | null;   
}