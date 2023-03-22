import { Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
     } from "typeorm";
import { ChannelMember } from "./channelmember.entity";
import { Chats } from "src/channels/chats/chats.entity";
@Entity()
export class Channels {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column('varchar', {length: 30 , default:"default"})
    title: string;
    
    @Column({
        nullable : true, 
        default: () => "'0'"
    })
    owner: number;

    @Column({
        nullable: true, 
        // default: () => "'0'"
    })
    admin: number;
    
    @Column({
      nullable: true,
      default: () => "'0'",
    })
    private: boolean | null;
    
    //TODO:
    // 이부분 default 로 하면 몇으로 할당 하는지 체크해서 최적화
    @Column('varchar',{length:1000,default:""}) 
    password: string;

    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;

    // @OneToMany(() => ChannelMember, (ChannelMember) => ChannelMember.Channel, {
    //   cascade: ['insert'],
    // })
    // ChannelMember: ChannelMember[];
    
    // 이거 나중에 해야해.
//     @OneToMany(() => Chats, (channelchats) => channelchats.Channel)
//     ChannelChats: Chats[];
    // @ManyToOne(() => User, (user) => user.photos)
    // user: User
    @OneToMany(() => ChannelMember, (ChannelMember) => ChannelMember.Channel)
    ChannelMembers: ChannelMember[]
}