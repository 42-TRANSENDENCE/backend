import { PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
    Index,
    ManyToOne,
    JoinColumn,
 } from "typeorm";
import { User } from "src/users/users.entity";
import { Channels } from "src/channels/channels.entity";

@Index('UserId', ['UserId'], {})
@Index('ChannelId', ['ChannelId'], {})
@Entity()
export class Chats {
    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    content: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
    
    @Column({nullable: true })
    UserId: number | null;

    @Column({ nullable: true })
    ChannelId: number | null;
    
    @Column({ nullable: true })
    SenderId: number | null;
  
    // @Column({ nullable: true })
    // ReceiverId: number | null;
    
    // @ManyToOne(() => User, (users) => users.ChannelChats, {
    //     onDelete: 'SET NULL',
    //     onUpdate: 'CASCADE',
    // })
    // @JoinColumn([{ name: 'UserId', referencedColumnName: 'id' }])
    // User: User;

    // @ManyToOne(() => Channels, (channels) => channels.ChannelChats, {
    //     onDelete: 'SET NULL',
    //     onUpdate: 'CASCADE',
    // })
    // @JoinColumn([{ name: 'ChannelId', referencedColumnName: 'id' }])
    // Channel: Channels;   
}
// export default Chats;