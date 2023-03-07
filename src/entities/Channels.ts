import { Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
     } from "typeorm";
import { ChannelMember } from "./ChannelMember";


@Entity({name: 'channels'})
export class Channels {
    @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;
  
    @Column('varchar', { name: 'title', length: 30 , default:"default"})
    title: string;
    
    @Column('int', {name: 'owner', default: 0})
    owner: number;

    @Column('smallint', {
      name: 'private',
      nullable: true,
      width: 1,
      default: () => "'0'",
    })
    private: boolean | null;
    
    @Column('varchar', {name: 'password', length: 100, default:""})
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