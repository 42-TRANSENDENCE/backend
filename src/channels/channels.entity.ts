import { Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
     } from "typeorm";

@Entity()
export class Channels {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column('varchar', {length: 30 , default:"default"})
    title: string;
    
    @Column({nullable:true, default: () => "'0'"})
    owner: number;

    @Column('smallint', {
      nullable: true,
      width: 1,
      default: () => "'0'",
    })
    private: boolean | null;
    
    @Column('varchar', {length: 100, default:""})
    password: string;

    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;

    // @OneToMany(() => ChannelMember, (channelMembers) => channelMember.Channels, {
    //   cascade: ['insert'],
    // })
    // ChannelMembers: ChannelMembers[];
    // @OneToMany(type => ChannelMember, channelmembers => channelmembers.channelmembers)
    // channelmembers: ChannelMember[];
}