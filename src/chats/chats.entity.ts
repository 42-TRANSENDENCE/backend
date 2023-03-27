import {
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
} from "typeorm";

@Entity()
export class Chats {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', {
        length:100, 
        nullable:true
    })
    content?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    ChannelId?: number;

    @Column({ nullable: true })
    SenderId?: number;

    @Column({ nullable: true })
    ReceiverId?: number;
}