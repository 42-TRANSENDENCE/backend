import { 
    CreateDateColumn,
    Entity,
    UpdateDateColumn ,
    Column,
    ManyToOne,
    PrimaryColumnCannotBeNullableError,
    PrimaryGeneratedColumn,
    JoinColumn,
} from "typeorm";
import { Channels } from './Channels'

@Entity({name: 'channelmembers'})
export class ChannelMember {
    @PrimaryGeneratedColumn({type:'int',name: "id"})
    id:number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column('int', { primary: true, name: 'ChannelId' })
    ChannelId: number;
  
    @Column('int', { primary: true, name: 'UserId' })
    UserId: number;

    @ManyToOne(() => Channels)
    @JoinColumn({name: "ChannelId"})
    channelMember: ChannelMember;
}