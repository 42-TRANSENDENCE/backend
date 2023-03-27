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

    @Column()
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    ChannelId: number | null;

    @Column({ nullable: true })
    SenderId: number | null;

    @Column({ nullable: true })
    ReceiverId: number | null;
}